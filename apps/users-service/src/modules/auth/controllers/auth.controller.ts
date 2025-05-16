import {
	Body,
	Controller,
	HttpCode,
	Logger,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UseGuards,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiConflictResponse,
	ApiCookieAuth,
	ApiCreatedResponse,
	ApiHeader,
	ApiOkResponse,
	ApiOperation,
	ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Response } from "express";
import { RequiredHeaders } from "../../../../../../libs/shared/src/decorators/required-headers.decorator";
import { SecurityHeadersGuard } from "../../../../../../libs/shared/src/guards/security-headers.guard";
import { AccessTokenResponse } from "../../../common/dtos/tokens/access-token.response";
import { RequestWithContext, RequestWithUser } from "../../../common/types/common.types";
import { setCookieSwaggerHeader } from "../../../external/swagger/setCookieHeader.swagger";
import { LoginUserRequestDTO } from "../dtos/requests/login-user.request.dto";
import { RegisterUserRequestDTO } from "../dtos/requests/register-user.request.dto";
import { AccessTokenGuard } from "../guards/access-token-auth.guard";
import { AuthService } from "../services/auth.service";

@Controller("auth")
@UseGuards(SecurityHeadersGuard)
export class AuthController {
	private readonly LOGGER = new Logger(AuthController.name);

	constructor(private readonly authService: AuthService) {}

	@ApiOperation({
		summary: "Аутентификация пользователя",
		description: "Аутентификация пользователя",
	})
	@ApiHeader({
		name: "X-Fingerprint",
		description: "Уникальный идентификатор устройства",
		required: true,
		schema: { type: "string" },
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	@ApiOkResponse({
		description: "Пользователь успешно аутентифицирован",
		type: AccessTokenResponse,
		headers: {
			...setCookieSwaggerHeader,
		},
	})
	@ApiUnauthorizedResponse({
		description: "Неправильно указан логин/email или пароль",
	})
	@RequiredHeaders(["X-Fingerprint", "User-Agent"])
	@HttpCode(200)
	@Post("login")
	public async login(
		@Req() req: RequestWithContext,
		@Body() loginUserDto: LoginUserRequestDTO,
		@Res({ passthrough: true }) res: Response
	): Promise<AccessTokenResponse> {
		const { accessToken, refreshSession } = await this.authService.login({
			...loginUserDto,
			...req.requestContext,
		});

		res.cookie("refreshToken", refreshSession.refreshToken, {
			httpOnly: true,
			maxAge: refreshSession.expiresIn,
		});

		return {
			accessToken,
		};
	}

	@ApiOperation({
		summary: "Регистрация пользователя",
		description: "Регистрация пользователя",
	})
	@ApiHeader({
		name: "X-Fingerprint",
		description: "Уникальный идентификатор устройства",
		required: true,
		schema: { type: "string" },
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	@ApiCreatedResponse({
		description: "Пользователь успешно зарегистрирован",
		type: AccessTokenResponse,
		headers: {
			...setCookieSwaggerHeader,
		},
	})
	@ApiConflictResponse({
		description: "Пользователь с таким логином или email уже существует",
	})
	@RequiredHeaders(["X-Fingerprint", "User-Agent"])
	@HttpCode(201)
	@Post("register")
	public async register(
		@Req() req: RequestWithContext,
		@Body() registerUserDto: RegisterUserRequestDTO,
		@Res({ passthrough: true }) res: Response
	): Promise<AccessTokenResponse> {
		const { accessToken, refreshSession } = await this.authService.register({
			...registerUserDto,
			...req.requestContext,
		});

		res.cookie("refreshToken", refreshSession.refreshToken, {
			httpOnly: true,
			maxAge: refreshSession.expiresIn,
		});

		return {
			accessToken,
		};
	}

	@ApiOperation({
		summary: "Выход из системы",
		description:
			"Выход из системы. Удаляет refresh token из базы данных и удаляет куку из браузера. Нужно удалить access на фронте",
	})
	@ApiOkResponse({
		description: "Пользователь успешно разлогинен",
		headers: {
			...setCookieSwaggerHeader,
		},
	})
	@ApiUnauthorizedResponse({
		description: "Refresh token не был предоставлен",
	})
	@ApiCookieAuth()
	@ApiBearerAuth()
	@HttpCode(200)
	@UseGuards(AccessTokenGuard)
	@Post("logout")
	public async logout(
		@Req() req: RequestWithUser,
		@Res({ passthrough: true }) res: Response
	): Promise<void> {
		const refreshToken: string = req.cookies["refreshToken"];

		if (!refreshToken) {
			throw new UnauthorizedException("No refresh token provided");
		}

		await this.authService.logout(refreshToken);

		res.clearCookie("refreshToken");
	}

	@ApiOperation({
		description: "Выход из всех сессий кроме текущей",
		summary: "Выход из всех сессий кроме текущей",
	})
	@ApiOkResponse({
		description: "Успешный выход из сессией",
	})
	@ApiUnauthorizedResponse({
		description: "Refresh token не был предоставлен",
	})
	@ApiBearerAuth()
	@ApiCookieAuth()
	@HttpCode(200)
	@UseGuards(AccessTokenGuard)
	@Post("logout-all-sessions-except-current")
	public async logoutAllSessionsExceptCurrent(@Req() req: RequestWithUser): Promise<void> {
		const refreshToken: string = req.cookies["refreshToken"];
		this.LOGGER.log("logoutAllSessionsExceptCurrent", { refreshToken });

		if (!refreshToken) {
			throw new UnauthorizedException("No refresh token provided");
		}

		await this.authService.logoutAllSessionsExceptCurrent(req.user.id, refreshToken);
	}

	@ApiOperation({
		summary: "Обновление access token",
		description:
			"Обновление access token. При обновлении access token также обновляется refresh token",
	})
	@ApiHeader({
		name: "X-Fingerprint",
		description: "Уникальный идентификатор устройства",
		required: true,
		schema: { type: "string" },
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	@ApiOkResponse({
		description: "Access token успешно обновлен",
		type: AccessTokenResponse,
		headers: {
			...setCookieSwaggerHeader,
		},
	})
	@ApiUnauthorizedResponse({
		description:
			"Refresh token не был предоставлен, либо истек, либо нет такой сессии, либо пользователь не найден/удален",
	})
	@ApiCookieAuth()
	@RequiredHeaders(["X-Fingerprint", "User-Agent"])
	@HttpCode(200)
	@Post("refresh-token")
	public async refreshToken(
		@Req() req: RequestWithContext,
		@Res({ passthrough: true }) res: Response
	): Promise<AccessTokenResponse> {
		const refreshToken: string = req.cookies["refreshToken"];
		this.LOGGER.log("refreshToken %s", refreshToken);

		if (!refreshToken) {
			throw new UnauthorizedException("Refresh token is required");
		}

		const { accessToken, refreshSession } = await this.authService.refreshToken({
			refreshToken,
			...req.requestContext,
		});

		res.cookie("refreshToken", refreshSession.refreshToken, {
			httpOnly: true,
			maxAge: refreshSession.expiresIn,
		});

		return {
			accessToken: accessToken,
		};
	}
}
