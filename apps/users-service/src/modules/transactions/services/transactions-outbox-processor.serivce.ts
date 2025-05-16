import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import {
	TransactionOutbox,
	TransactionOutboxEventName,
	TransactionOutboxPayload,
} from "../entities/TransactionOutbox";
import { TransactionsOutboxRepositoryImpl } from "../external/prisma/transactions-outbox.repository.impl";
import { TransactionsOutboxRepository } from "../repositories/transactions-outbox.repository";
import { TransactionsEventsPublisher } from "./transactions-event.publisher";

@Injectable()
export class TransactionsOutboxProcessorService {
	private readonly LOGGER = new Logger(TransactionsOutboxProcessorService.name);
	private readonly BATCH_SIZE = 10; // Ограничиваем количество сообщений в одной итерации

	constructor(
		@Inject(TransactionsOutboxRepositoryImpl)
		private readonly transactionsOutboxRepository: TransactionsOutboxRepository,
		private readonly transactionsEventsPublisher: TransactionsEventsPublisher
	) {}

	@Cron("* * * * * *", {
		waitForCompletion: true,
	})
	public async processOutboxMessages(): Promise<void> {
		const pendingTransactionsEvents =
			await this.transactionsOutboxRepository.getPendingTransactions();

		if (pendingTransactionsEvents.length === 0) {
			this.LOGGER.debug("No pending transactions");
			return;
		}

		this.LOGGER.log(`Processing ${pendingTransactionsEvents.length} pending transactions`);

		// Обрабатываем сообщения батчами
		for (let i = 0; i < pendingTransactionsEvents.length; i += this.BATCH_SIZE) {
			const batch = pendingTransactionsEvents.slice(i, i + this.BATCH_SIZE);
			await this.processBatch(batch);
		}
	}

	private async processBatch(batch: TransactionOutbox[]): Promise<void> {
		const publishedIds: bigint[] = [];
		this.LOGGER.debug(`Processing batch of ${batch.length} transactions events`);
		await this.transactionsOutboxRepository.markManyAsProcessing(
			batch.map((event) => event.getId())
		);

		for (const transactionEvent of batch) {
			const event = {
				eventName: transactionEvent.eventName,
				payload: transactionEvent.payload,
			} as TransactionOutboxPayload;

			try {
				switch (event.eventName) {
					case TransactionOutboxEventName.TransferCreated: {
						this.LOGGER.debug(
							`Publishing transfer created event for transaction ${event.payload.transactionId}`
						);
						await this.transactionsEventsPublisher.transferCreated({
							transactionId: event.payload.transactionId,
							from: event.payload.from,
							to: event.payload.to,
							amount: event.payload.amount,
							createdAt: event.payload.createdAt,
						});
						publishedIds.push(transactionEvent.getId());
						break;
					}
					case TransactionOutboxEventName.DepositCreated: {
						this.LOGGER.debug(
							`Publishing deposit created event for transaction ${event.payload.transactionId}`
						);
						await this.transactionsEventsPublisher.depositCreated({
							transactionId: event.payload.transactionId,
							userId: event.payload.userId,
							amount: event.payload.amount,
							createdAt: event.payload.createdAt,
						});
						publishedIds.push(transactionEvent.getId());
						break;
					}
				}
			} catch (error: unknown) {
				this.LOGGER.error(
					{ error, transactionId: transactionEvent.getId() },
					"Failed to publish transaction event"
				);
				throw error;
			}
		}

		if (publishedIds.length > 0) {
			this.LOGGER.debug(`Marking ${publishedIds.length} transactions as published`);
			await this.transactionsOutboxRepository.markManyAsPublished(publishedIds);
		}
	}
}
