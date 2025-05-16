import { NatsJetStreamTransport } from "@nestjs-plugins/nestjs-nats-jetstream-transport";
import { Global, Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ConnectionOptions, NatsConnection } from "nats";
import { NatsEventsPublisher } from "./nats.events.publisher";
import { NatsService } from "./nats.service";

@Global()
@Module({
	imports: [
		NatsJetStreamTransport.registerAsync({
			useFactory: (configService: ConfigService) => {
				const logger = new Logger(NatsModule.name);
				let baseDelay = 500;
				let attempts = 0;
				return {
					connectionOptions: {
						servers: configService.get<string>("NATS_URL")!,
						user: configService.get<string>("NATS_USER")!,
						password: configService.get<string>("NATS_PASSWORD")!,
						connectedHook: (nc: NatsConnection) => {
							logger.verbose({ nc }, "NATS connected");
						},
						reconnect: true,
						reconnectDelayHandler: () => {
							const currentDelay = baseDelay;
							const maxDelay = 30000; // 2 минуты в миллисекундах
							const exponentialDelay = Math.min(currentDelay, maxDelay);

							logger.debug("Nats reconnecting try #" + attempts);

							baseDelay *= 2;
							attempts++;
							return exponentialDelay;
						},
						maxReconnectAttempts: -1,
					} as ConnectionOptions,
				};
			},
			inject: [ConfigService],
		}),
	],
	providers: [NatsService, NatsEventsPublisher],
	exports: [NatsService, NatsEventsPublisher],
})
export class NatsModule {}
