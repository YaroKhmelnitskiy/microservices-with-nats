import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Notification } from "./notifications.schema";

@Schema()
export class NotificationWithTransaction extends Notification {
	@Prop({ required: true, index: true })
	transactionId: string;
}

export const NotificationWithTransactionSchema = SchemaFactory.createForClass(
	NotificationWithTransaction
);

NotificationWithTransactionSchema.index({ transactionId: 1, type: 1, userId: 1 }, { unique: true });
