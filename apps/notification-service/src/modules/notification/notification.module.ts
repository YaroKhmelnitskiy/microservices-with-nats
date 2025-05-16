import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "../auth/auth.module";
import {
	NotificationWithTransaction,
	NotificationWithTransactionSchema,
} from "./external/mongo/schemas/notifications-with-transactions.schema";
import { Notification, NotificationSchema } from "./external/mongo/schemas/notifications.schema";
import { NotificationGateway } from "./notification.gateway";
import { NotificationQueueProcessor } from "./queue/notification-queue.processor";
import { NotificationQueues } from "./queue/notification-queues.enum";
import { NotificationDeliveryService } from "./services/notification-delivery.service";
import { NotificationConsumer } from "./services/notification.consumer";

@Module({
	controllers: [NotificationConsumer],
	imports: [
		BullModule.registerQueue({
			name: NotificationQueues.Notification,
		}),
		MongooseModule.forFeature([
			{
				name: Notification.name,
				schema: NotificationSchema,
				discriminators: [
					{
						name: NotificationWithTransaction.name,
						schema: NotificationWithTransactionSchema,
					},
				],
			},
		]),
		AuthModule,
	],
	providers: [NotificationGateway, NotificationDeliveryService, NotificationQueueProcessor],
})
export class NotificationModule {}
