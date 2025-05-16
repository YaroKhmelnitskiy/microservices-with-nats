import { AuthorizedSocketData } from "apps/notification-service/src/common/types/socketio.types";
import { DefaultEventsMap, Server, Socket } from "socket.io";

export type NotificationClientToServerEvents = {
	notification: (message: string) => void;
};

export type NotificationServer = Server<
	DefaultEventsMap,
	NotificationClientToServerEvents,
	DefaultEventsMap,
	AuthorizedSocketData
>;

export type NotificationSocket = Socket<
	DefaultEventsMap,
	NotificationClientToServerEvents,
	DefaultEventsMap,
	AuthorizedSocketData
>;
