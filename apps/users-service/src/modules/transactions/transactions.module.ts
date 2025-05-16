import { Module } from "@nestjs/common";
import { EventsPublisher } from "../../core/interfaces/event-publisher.interface";
import { ExternalModule } from "../../external/external.module";
import { NatsEventsPublisher } from "../../external/nats/nats.events.publisher";
import { UsersModule } from "../users/users.module";
import { TransactionsController } from "./controllers/transactions.controller";
import { TransactionsOutboxRepositoryImpl } from "./external/prisma/transactions-outbox.repository.impl";
import { TransactionsRepositoryImpl } from "./external/prisma/transactions.repository.impl";
import { TransactionsEventsPublisher } from "./services/transactions-event.publisher";
import { TransactionsOutboxProcessorService } from "./services/transactions-outbox-processor.serivce";
import { TransactionsService } from "./services/transactions.service";

@Module({
	imports: [UsersModule, ExternalModule],
	controllers: [TransactionsController],
	providers: [
		TransactionsService,
		TransactionsRepositoryImpl,
		TransactionsOutboxRepositoryImpl,
		TransactionsOutboxProcessorService,
		{
			provide: TransactionsEventsPublisher,
			useFactory: (eventPublisher: EventsPublisher) =>
				new TransactionsEventsPublisher(eventPublisher),
			inject: [NatsEventsPublisher],
		},
	],
	exports: [TransactionsService],
})
export class TransactionsModule {}
