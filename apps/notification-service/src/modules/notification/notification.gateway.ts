import { Logger, UseGuards } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	WebSocketGateway,
	WebSocketServer,
	type OnGatewayInit,
} from "@nestjs/websockets";
import { SocketAuthGuard } from "../auth/guards/socket-auth.guard";
import { SocketAuthMiddleware } from "../auth/middlewares/socket-auth.middleware";
import { NotificationServer, NotificationSocket } from "./types/notification-socketio.types";
import { TransactionNotificationPayload } from "./types/notification.types";

@WebSocketGateway({
	namespace: "notification",
})
@UseGuards(SocketAuthGuard)
export class NotificationGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	private readonly logger = new Logger(NotificationGateway.name);
	private readonly connectedUsers: Map<string, NotificationSocket> = new Map();

	@WebSocketServer()
	server: NotificationServer;

	constructor(
		private readonly socketAuthMiddleware: SocketAuthMiddleware,
		private readonly eventEmitter: EventEmitter2
	) {}

	public isConnected(userId: string) {
		return this.connectedUsers.has(userId);
	}

	public afterInit() {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		this.server.use(async (socket, next) => {
			await this.socketAuthMiddleware.use(socket, next);
		});
	}

	public async handleConnection(client: NotificationSocket) {
		this.logger.log(`Client connected: ${client.id}`);
		this.connectedUsers.set(client.data.user.id, client);
		await client.join(client.data.user.id);
		this.eventEmitter.emit("user.connected", client.data.user.id);
	}

	public handleDisconnect(client: NotificationSocket) {
		this.logger.log(`Client disconnected: ${client.id}`);
		this.connectedUsers.delete(client.data.user.id);
	}

	public sendNotification(notification: TransactionNotificationPayload) {
		this.logger.log("Sending notification to user %s", notification.userId);
		this.server.to(notification.userId).emit("notification", notification.message);
	}
}
