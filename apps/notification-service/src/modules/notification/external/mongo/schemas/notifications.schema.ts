import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
	TRANSACTION = "transaction",
}

export enum NotificationStatus {
	UNREAD = "unread",
	READ = "read",
}

@Schema()
export class Notification {
	@Prop({ required: true, index: true })
	userId: string;

	@Prop({ required: true, enum: NotificationType, index: true })
	type: NotificationType;

	@Prop({
		required: true,
		enum: NotificationStatus,
		index: true,
		default: NotificationStatus.UNREAD,
	})
	status: NotificationStatus;

	@Prop({ required: true })
	message: string;

	@Prop({ default: Date.now })
	createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
