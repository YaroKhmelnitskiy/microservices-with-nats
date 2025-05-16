import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import type { RequestContext } from "../../../../apps/users-service/src/common/types/common.types";

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
	private readonly LOGGER = new Logger(RequestContextMiddleware.name);

	use(req: Request, res: Response, next: NextFunction) {
		const requestContext: RequestContext = {
			fingerprint: (req.headers["x-fingerprint"] as string) ?? "",
			userAgent: (req.headers["user-agent"] as string) ?? "",
			ipAddress: req.ip || req.socket.remoteAddress || "",
		};

		this.LOGGER.debug({ requestContext }, "Request context");

		req["requestContext"] = requestContext;
		next();
	}
}
