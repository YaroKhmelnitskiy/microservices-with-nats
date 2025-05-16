import { NatsJetStreamContext } from "@nestjs-plugins/nestjs-nats-jetstream-transport";
import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload } from "@nestjs/microservices";
import { InjectModel } from "@nestjs/mongoose";
import {
	DepositCreatedEvent,
	TransactionEvents,
	TransferCreatedEvent,
} from "@shared/events/transactions-events.types";
import { Model } from "mongoose";
import { NotificationWithTransaction } from "../external/mongo/schemas/notifications-with-transactions.schema";
import { NotificationType } from "../external/mongo/schemas/notifications.schema";
import { NotificationDeliveryService } from "./notification-delivery.service";

@Controller()
export class NotificationConsumer {
	private readonly LOGGER = new Logger(NotificationConsumer.name);

	constructor(
		private readonly deliveryService: NotificationDeliveryService,
		@InjectModel(NotificationWithTransaction.name)
		private readonly notificationModel: Model<NotificationWithTransaction>
	) {}

	@EventPattern(TransactionEvents.TRANSFER_CREATED)
	public async handleTransferCreated(
		@Payload() data: TransferCreatedEvent,
		@Ctx() context: NatsJetStreamContext
	) {
		try {
			this.LOGGER.log(data, "Received transfer created event for transaction");
			const notification = await this.notificationModel
				.exists({
					type: NotificationType.TRANSACTION,
					transactionId: data.transactionId,
					userId: { $in: [data.to, data.from] },
				})
				.lean();

			if (notification) {
				this.LOGGER.log(
					"Notifications already exists for transaction %s",
					data.transactionId
				);
				context.message.ack();
				return;
			}

			const fromMessage = `Перевод на сумму ${data.amount} от ${data.from}, ${data.createdAt.toLocaleString()}`;
			const toMessage = `Перевод на сумму ${data.amount} на ${data.to}, ${data.createdAt.toLocaleString()}`;

			this.LOGGER.log(
				"Saving transfer notifications for users %s and %s",
				data.to,
				data.from
			);
			await this.notificationModel.insertMany([
				{
					userId: data.to,
					type: NotificationType.TRANSACTION,
					message: toMessage,
					transactionId: data.transactionId,
				},
				{
					userId: data.from,
					type: NotificationType.TRANSACTION,
					message: fromMessage,
					transactionId: data.transactionId,
				},
			]);

			await Promise.all([
				this.deliveryService.deliverNotification({
					message: toMessage,
					userId: data.to,
					transactionId: data.transactionId,
				}),
				this.deliveryService.deliverNotification({
					message: fromMessage,
					userId: data.from,
					transactionId: data.transactionId,
				}),
			]);

			context.message.ack();
		} catch (error) {
			this.LOGGER.error(error);
			context.message.nak();
		}
	}

	@EventPattern(TransactionEvents.DEPOSIT_CREATED)
	public async handleDepositCreated(
		@Payload() data: DepositCreatedEvent,
		@Ctx() context: NatsJetStreamContext
	) {
		try {
			const existingNotification = await this.notificationModel
				.exists({
					type: NotificationType.TRANSACTION,
					transactionId: data.transactionId,
				})
				.lean();

			if (existingNotification) {
				this.LOGGER.log(
					"Notification already exists for transaction %s",
					data.transactionId
				);
				context.message.ack();
				return;
			}

			const message = `Пополнение на сумму ${data.amount}`;

			this.LOGGER.log("Saving notification for user %s", data.userId);
			const createdNotification = await this.notificationModel.insertOne({
				userId: data.userId,
				type: NotificationType.TRANSACTION,
				message,
				transactionId: data.transactionId,
			});

			this.LOGGER.log("Sending notification to user %s", data.userId);
			await this.deliveryService.deliverNotification({
				message: createdNotification.message,
				userId: createdNotification.userId,
				transactionId: createdNotification.transactionId,
			});

			context.message.ack();
		} catch (error) {
			this.LOGGER.error(error);
			context.message.nak();
		}
	}
}
