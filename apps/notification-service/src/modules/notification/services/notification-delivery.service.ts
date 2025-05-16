import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectModel } from "@nestjs/mongoose";
import { Queue } from "bullmq";
import { RateLimiter } from "limiter";
import { Model } from "mongoose";
import { NotificationWithTransaction } from "../external/mongo/schemas/notifications-with-transactions.schema";
import { NotificationStatus } from "../external/mongo/schemas/notifications.schema";
import { NotificationJobs } from "../queue/notification-jobs.enum";
import { NotificationQueues } from "../queue/notification-queues.enum";
import { TransactionNotificationPayload } from "../types/notification.types";

@Injectable()
export class NotificationDeliveryService {
	private readonly logger = new Logger(NotificationDeliveryService.name);
	private readonly limiter: RateLimiter = new RateLimiter({
		tokensPerInterval: 5,
		interval: 10000,
		fireImmediately: false,
	});

	constructor(
		@InjectQueue(NotificationQueues.Notification)
		private readonly notificationQueue: Queue<TransactionNotificationPayload>,
		@InjectModel(NotificationWithTransaction.name)
		private readonly notificationModel: Model<NotificationWithTransaction>
	) {}

	@OnEvent("user.connected")
	public async handleUserConnected(userId: string) {
		this.logger.debug("User connected", userId);
		const notifications = await this.notificationModel.find({
			status: NotificationStatus.UNREAD,
			userId: userId,
		});

		if (notifications.length > 0) {
			for (const notification of notifications) {
				await this.limiter.removeTokens(1);
				await this.notificationQueue.add(
					NotificationJobs.SendTransactionNotification,
					{
						message: notification.message,
						userId: notification.userId,
						transactionId: notification.transactionId,
					},
					{
						attempts: 3,
						backoff: {
							type: "fixed",
							delay: 1000,
						},
					}
				);
			}
		}
	}

	public async deliverNotification(payload: TransactionNotificationPayload) {
		this.logger.debug("Delivering notification", payload);
		await this.notificationQueue.add(NotificationJobs.SendTransactionNotification, payload, {
			attempts: 3,
			backoff: {
				type: "fixed",
				delay: 1000,
			},
		});
	}
}
