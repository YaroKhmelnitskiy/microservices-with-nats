import {
	BadRequestException,
	CanActivate,
	ExecutionContext,
	Injectable,
	Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RequiredHeaders } from "../decorators/required-headers.decorator";

@Injectable()
export class SecurityHeadersGuard implements CanActivate {
	private readonly LOGGER = new Logger(SecurityHeadersGuard.name);

	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredHeaders = this.reflector.get<string[]>(RequiredHeaders, context.getHandler());

		if (!requiredHeaders || !requiredHeaders.length) {
			return true;
		}

		const request = context.switchToHttp().getRequest();
		const missingHeaders = this.getMissingHeaders(request, requiredHeaders);

		if (missingHeaders.length > 0) {
			this.LOGGER.warn(
				{
					missingHeaders,
					headers: request.headers,
				},
				`Missing security headers for request: ${request.path}`
			);

			throw new BadRequestException(
				`Missing required security headers: ${missingHeaders.join(", ")}`
			);
		}

		return true;
	}

	private getMissingHeaders(req: any, requiredHeaders: string[]): string[] {
		return requiredHeaders.filter(
			(header) =>
				!req.headers[header.toLowerCase()] || req.headers[header.toLowerCase()].length === 0
		);
	}
}
