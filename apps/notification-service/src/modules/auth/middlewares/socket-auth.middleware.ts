import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Socket } from "socket.io";
import { NoAuthorizationError } from "../../../core/errors/auth.errors";
import { AuthService } from "../services/auth.service";

@Injectable()
export class SocketAuthMiddleware implements NestMiddleware {
	private readonly LOGGER = new Logger(SocketAuthMiddleware.name);

	constructor(private readonly authService: AuthService) {}

	async use(socket: Socket, next: (error?: Error) => void) {
		try {
			const { authorization } = socket.handshake.headers;

			if (!authorization) {
				this.LOGGER.warn({ socketId: socket.id }, "No authorization header provided");
				throw new NoAuthorizationError("No authorization header provided");
			}

			const token = authorization.replace("Bearer ", "");
			const payload = await this.authService.validateUserTokenAsync(token);
			this.LOGGER.log({ socketId: socket.id }, "Token validated successfully");
			socket.data.user = payload;
			next();
		} catch (error) {
			this.LOGGER.warn(
				{
					socketId: socket.id,
					error: error instanceof Error ? error.message : "Unknown error",
				},
				"Authentication failed"
			);

			next(error instanceof Error ? error : new Error("Unknown authentication error"));
		}
	}
}
