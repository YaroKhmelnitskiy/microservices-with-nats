import { Nullable } from "apps/users-service/src/core/types/utility.types";

export enum TransactionOutboxStatus {
	Pending = "pending",
	Processing = "processing",
	Published = "published",
}

export enum TransactionOutboxEventName {
	TransferCreated = "transfer.created",
	DepositCreated = "deposit.created",
}

// Определяем интерфейсы для payload в зависимости от eventName
interface TransferCreatedPayload {
	transactionId: string;
	from: string;
	to: string;
	amount: number;
	createdAt: Date;
}

interface DepositCreatedPayload {
	transactionId: string;
	userId: string;
	amount: number;
	createdAt: Date;
}

// Создаём тип, связывающий eventName и payload
export type TransactionOutboxPayload =
	| {
			eventName: TransactionOutboxEventName.TransferCreated;
			payload: TransferCreatedPayload;
	  }
	| {
			eventName: TransactionOutboxEventName.DepositCreated;
			payload: DepositCreatedPayload;
	  };

export interface TransactionOutboxProps {
	id?: Nullable<bigint>;
	eventName: TransactionOutboxEventName;
	payload: TransactionOutboxPayload["payload"];
	status?: Nullable<TransactionOutboxStatus>;
	createdAt?: Nullable<Date>;
	publishedAt?: Nullable<Date>;
}

export class TransactionOutbox {
	private readonly id: Nullable<bigint>;
	public readonly eventName: TransactionOutboxEventName;
	public readonly payload: TransactionOutboxPayload["payload"];
	public readonly status: TransactionOutboxStatus;
	public readonly createdAt: Date | null;
	public readonly publishedAt: Date | null;

	constructor(props: TransactionOutboxProps) {
		this.id = props.id ?? null;
		this.eventName = props.eventName;
		this.payload = props.payload;
		this.status = props.status ?? TransactionOutboxStatus.Pending;
		this.createdAt = props.createdAt ?? null;
		this.publishedAt = props.publishedAt ?? null;
	}

	public getId(): bigint {
		if (!this.id) {
			throw new Error("Id is not set");
		}
		return this.id;
	}
}
