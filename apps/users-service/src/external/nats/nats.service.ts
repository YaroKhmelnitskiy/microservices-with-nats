import { NatsJetStreamClientProxy } from "@nestjs-plugins/nestjs-nats-jetstream-transport";
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { NatsConnection } from "nats";
import pRetry from "p-retry";
import { firstValueFrom, Subscription } from "rxjs";

interface PublishConfig {
	maxRetries: number;
	baseDelay: number;
}

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(NatsService.name);
	private readonly defaultConfig: PublishConfig = {
		maxRetries: 1,
		baseDelay: 1000,
	};
	private statusSubscription: Subscription;
	private nc: NatsConnection;

	constructor(private readonly client: NatsJetStreamClientProxy) {}

	async onModuleInit() {
		this.nc = await this.client.connect();
		this.listenToStatus();
	}

	private async listenToStatus() {
		try {
			for await (const status of this.nc.status()) {
				this.logger.debug({ status }, "NATS status update");
			}
		} catch (error) {
			this.logger.error({ error }, "Error listening to NATS status");
		}
	}

	async onModuleDestroy() {
		if (this.statusSubscription) {
			this.statusSubscription.unsubscribe();
		}
		await this.client.close();
		this.logger.debug({}, "NATS disconnected");
	}

	async publish(topic: string, event: any, config?: Partial<PublishConfig>): Promise<void> {
		const { maxRetries, baseDelay } = { ...this.defaultConfig, ...config };

		const operation = async (attempt: number) => {
			this.logger.verbose(
				`Publishing event to ${topic} (attempt ${attempt}/${maxRetries}): ${JSON.stringify(event)}`
			);

			try {
				await firstValueFrom(this.client.emit(topic, event));
				this.logger.verbose(`Successfully published event to ${topic}`);
			} catch (error) {
				this.logger.error(`Error publishing event to ${topic}: ${error}`);
				throw error;
			}
		};

		try {
			await pRetry(operation, {
				forever: maxRetries === -1,
				retries: maxRetries - 1,
				minTimeout: baseDelay,
				factor: 2,
				randomize: true,
				onFailedAttempt: (error) => {
					this.logger.warn(
						`Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
					);
				},
			});
		} catch (error) {
			this.logger.error(
				{ error },
				`Failed to publish event to ${topic} after ${maxRetries} attempts`
			);
			throw error;
		}
	}
}
