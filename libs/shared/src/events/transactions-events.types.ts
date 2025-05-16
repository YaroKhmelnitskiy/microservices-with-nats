export enum TransactionEvents {
	TRANSFER_CREATED = "transactions.transfer.created",
	DEPOSIT_CREATED = "transactions.deposit.created",
}

export type TransferCreatedEvent = {
	transactionId: string;
	from: string;
	to: string;
	amount: number;
	createdAt: Date;
};

export type DepositCreatedEvent = {
	transactionId: string;
	userId: string;
	amount: number;
	createdAt: Date;
};
