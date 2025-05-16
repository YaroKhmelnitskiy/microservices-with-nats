import { AccessJwtPayload } from "@auth/types/access-jwt-payload.type";
import {
	CanActivate,
	ExecutionContext,
	Injectable,
	Logger,
	UnauthorizedException,
} from "@nestjs/common";
import { Socket } from "socket.io";
import { InvalidTokenError } from "../../../core/errors/auth.errors";
import { AuthService } from "../services/auth.service";

@Injectable()
export class SocketAuthGuard implements CanActivate {
	private readonly LOGGER = new Logger(SocketAuthGuard.name);

	constructor(private readonly authService: AuthService) {}

	canActivate(context: ExecutionContext): boolean {
		const socket: Socket = context.switchToWs().getClient();
		try {
			// Логируем информацию о типе соединения
			this.LOGGER.debug(
				{
					socketId: socket.id,
					transport: socket.conn.transport.name,
					upgraded: socket.conn.upgraded,
					readyState: socket.conn.readyState,
				},
				"Socket connection details"
			);

			const { authorization } = socket.handshake.headers;

			if (!authorization) {
				this.LOGGER.warn(
					{ socketId: socket.id, transport: socket.conn.transport.name },
					"No authorization token provided"
				);
				throw new UnauthorizedException("No authorization token provided");
			}

			const token = authorization.split(" ")[1];

			try {
				this.LOGGER.log(token, "Token");
				const payload: AccessJwtPayload = this.authService.validateUserToken(token);
				socket.data.user = payload;
				this.LOGGER.log({ socketId: socket.id }, "Token validated successfully");
				return true;
			} catch (error) {
				this.LOGGER.warn(
					{
						socketId: socket.id,
						transport: socket.conn.transport.name,
						error,
					},
					"Invalid token provided"
				);
				throw new InvalidTokenError("Invalid token");
			}
		} catch (error) {
			this.LOGGER.error({ error }, "Socket authentication failed");
			socket.emit("auth_error", { message: "Authentication failed" });
			socket.disconnect(true);
			return false;
		}
	}
}
