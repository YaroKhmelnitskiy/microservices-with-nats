import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Job } from "bullmq";
import { Model } from "mongoose";
import { NotificationWithTransaction } from "../external/mongo/schemas/notifications-with-transactions.schema";
import { NotificationStatus } from "../external/mongo/schemas/notifications.schema";
import { NotificationGateway } from "../notification.gateway";
import { TransactionNotificationPayload } from "../types/notification.types";
import { NotificationJobs } from "./notification-jobs.enum";
import { NotificationQueues } from "./notification-queues.enum";

@Processor(NotificationQueues.Notification)
export class NotificationQueueProcessor extends WorkerHost {
	private readonly logger = new Logger(NotificationQueueProcessor.name);

	constructor(
		private readonly notificationGateway: NotificationGateway,
		@InjectModel(NotificationWithTransaction.name)
		private readonly notificationModel: Model<NotificationWithTransaction>
	) {
		super();
	}

	async process(job: Job<TransactionNotificationPayload, any, NotificationJobs>): Promise<void> {
		this.logger.debug("Processing job", job);

		switch (job.name) {
			case NotificationJobs.SendTransactionNotification:
				await this.sendTransactionNotification(job.data);
				break;
			default:
				this.logger.error(`Unknown job`);
				break;
		}
	}

	private async sendTransactionNotification(
		payload: TransactionNotificationPayload
	): Promise<void> {
		if (this.notificationGateway.isConnected(payload.userId)) {
			await this.notificationModel.updateOne(
				{ transactionId: payload.transactionId, userId: payload.userId },
				{ $set: { status: NotificationStatus.READ } }
			);
			this.notificationGateway.sendNotification(payload);
			this.logger.debug("Notification sent", payload);
		} else {
			this.logger.debug("User is not connected for notification", payload);
		}
	}
}
