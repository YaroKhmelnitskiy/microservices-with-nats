import { TransactionHost } from "@nestjs-cls/transactional";
import { Injectable } from "@nestjs/common";
import { PrismaAdapterType } from "apps/users-service/src/external/persistence/cls-transactional/prisma-adapter.type";
import {
	TransactionOutbox,
	TransactionOutboxEventName,
	TransactionOutboxStatus,
} from "../../entities/TransactionOutbox";
import { TransactionsOutboxRepository } from "../../repositories/transactions-outbox.repository";

@Injectable()
export class TransactionsOutboxRepositoryImpl implements TransactionsOutboxRepository {
	constructor(private readonly txHost: TransactionHost<PrismaAdapterType>) {}

	public async create(transactionOutbox: TransactionOutbox): Promise<void> {
		await this.txHost.tx.transactions_outbox.create({
			data: {
				event_name: transactionOutbox.eventName,
				payload: transactionOutbox.payload as any,
				status: transactionOutbox.status,
				published_at: transactionOutbox.publishedAt,
			},
		});
	}

	public async getPendingTransactions(): Promise<TransactionOutbox[]> {
		const prismaTransactions = await this.txHost.tx.transactions_outbox.findMany({
			where: {
				status: TransactionOutboxStatus.Pending,
			},
			orderBy: {
				created_at: "asc",
			},
		});

		return prismaTransactions.map((prismaTransaction) => {
			return new TransactionOutbox({
				id: prismaTransaction.id,
				eventName: prismaTransaction.event_name as TransactionOutboxEventName,
				payload: prismaTransaction.payload as any,
				status: TransactionOutboxStatus.Processing,
				createdAt: prismaTransaction.created_at,
			});
		});
	}

	public async markManyAsProcessing(ids: bigint[]): Promise<void> {
		await this.txHost.tx.transactions_outbox.updateMany({
			where: {
				id: {
					in: ids,
				},
			},
			data: {
				status: TransactionOutboxStatus.Processing,
			},
		});
	}

	public async markAsPublished(ids: bigint[]): Promise<void> {
		await this.txHost.tx.transactions_outbox.updateMany({
			where: {
				id: {
					in: ids,
				},
			},
			data: {
				status: TransactionOutboxStatus.Published,
				published_at: new Date(),
			},
		});
	}

	public async markManyAsPublished(ids: bigint[]): Promise<void> {
		await this.txHost.tx.transactions_outbox.updateMany({
			where: {
				id: {
					in: ids,
				},
			},
			data: {
				status: TransactionOutboxStatus.Published,
				published_at: new Date(),
			},
		});
	}
}
