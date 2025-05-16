import { TransactionOutbox } from "../entities/TransactionOutbox";

export interface TransactionsOutboxRepository {
	create(transactionOutbox: TransactionOutbox): Promise<void>;
	getPendingTransactions(): Promise<TransactionOutbox[]>;
	markManyAsProcessing(ids: bigint[]): Promise<void>;
	markAsPublished(ids: bigint[]): Promise<void>;
	markManyAsPublished(ids: bigint[]): Promise<void>;
}
