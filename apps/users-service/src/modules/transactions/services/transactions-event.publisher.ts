import { Injectable } from "@nestjs/common";
import {
	DepositCreatedEvent,
	TransactionEvents,
	TransferCreatedEvent,
} from "@shared/events/transactions-events.types";
import { EventsPublisher } from "apps/users-service/src/core/interfaces/event-publisher.interface";

@Injectable()
export class TransactionsEventsPublisher {
	constructor(private readonly eventPublisher: EventsPublisher) {}

	async transferCreated(event: TransferCreatedEvent): Promise<void> {
		await this.eventPublisher.publish(TransactionEvents.TRANSFER_CREATED, event, {
			maxRetries: 4,
			baseDelay: 1000,
		});
	}

	async depositCreated(event: DepositCreatedEvent): Promise<void> {
		await this.eventPublisher.publish(TransactionEvents.DEPOSIT_CREATED, event, {
			maxRetries: 4,
			baseDelay: 1000,
		});
	}
}
