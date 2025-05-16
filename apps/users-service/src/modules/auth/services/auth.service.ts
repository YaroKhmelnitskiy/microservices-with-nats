import { ConflictException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { comparePassword } from "../../../../../../libs/utils/src/password/hash-password";
import { AccessRefreshTokens } from "../../../common/types/common.types";
import { TokenService } from "../../token/services/token.service";
import { UsersService } from "../../users/services/users.service";
import { LoginUserRequestDTO } from "../dtos/requests/login-user.request.dto";
import { RegisterUserRequestDTO } from "../dtos/requests/register-user.request.dto";
import { RefreshTokenServiceDTO } from "../dtos/services/refresh-token.service.dto";

@Injectable()
export class AuthService {
	private readonly LOGGER = new Logger(AuthService.name);

	constructor(
		private readonly usersService: UsersService,
		private readonly tokenService: TokenService
	) {}

	public async login(
		dto: LoginUserRequestDTO & {
			ipAddress: string;
			userAgent: string;
			fingerprint: string;
		}
	): Promise<AccessRefreshTokens> {
		this.LOGGER.log(
			{
				login: dto.login,
				email: dto.email,
				ipAddress: dto.ipAddress,
				fingerprint: dto.fingerprint,
			},
			"Attempting user login"
		);

		const user = dto.login
			? await this.usersService.getByLogin(dto.login)
			: await this.usersService.getByEmail(dto.email!);

		if (!user || !(await comparePassword(dto.password, user.password))) {
			this.LOGGER.warn(
				{
					login: dto.login,
					email: dto.email,
					ipAddress: dto.ipAddress,
				},
				"Failed login attempt: invalid credentials"
			);
			throw new UnauthorizedException("Неправильно указан логин/email или пароль.");
		}

		let userSessions = await this.tokenService.getAllRefreshSessionsByUserId(user.id);

		this.LOGGER.debug(
			{
				userId: user.id,
				sessionsCount: userSessions.length,
			},
			"Retrieved current user sessions"
		);

		const sameFingerprintSession = userSessions.find(
			(session) => session.fingerprint === dto.fingerprint
		);

		if (sameFingerprintSession) {
			this.LOGGER.debug(
				{
					userId: user.id,
					sessionId: sameFingerprintSession.refreshToken,
				},
				"Found session with same fingerprint, deleting it"
			);
			await this.tokenService.deleteRefreshSessionByToken(
				sameFingerprintSession.refreshToken
			);
			userSessions = userSessions.filter(
				(s) => s.refreshToken !== sameFingerprintSession.refreshToken
			);
		}

		if (userSessions.length >= 5) {
			this.LOGGER.debug(
				{
					userId: user.id,
					sessionsCount: userSessions.length,
					maxSessions: 5,
				},
				"Maximum sessions reached, deleting oldest session"
			);
			await this.tokenService.deleteRefreshSessionByToken(userSessions[0].refreshToken);
		}

		this.LOGGER.log(
			{
				userId: user.id,
				login: user.login,
				email: user.email,
			},
			"Creating new session for user"
		);

		const tokens = await this.tokenService.createAccessRefreshTokens({
			userId: user.id,
			login: user.login,
			email: user.email,
			fingerprint: dto.fingerprint,
			ipAddress: dto.ipAddress,
			userAgent: dto.userAgent,
		});

		this.LOGGER.log(
			{
				userId: user.id,
				login: user.login,
			},
			"User successfully logged in"
		);

		return tokens;
	}

	public async logout(refreshToken: string): Promise<void> {
		this.LOGGER.log(
			{
				refreshToken: refreshToken.substring(0, 10) + "...",
			},
			"Attempting to logout session"
		);

		await this.tokenService.deleteRefreshSessionByToken(refreshToken);

		this.LOGGER.log(
			{
				refreshToken: refreshToken.substring(0, 10) + "...",
			},
			"Session successfully logged out"
		);
	}

	public async logoutAllSessionsExceptCurrent(
		userId: string,
		refreshToken: string
	): Promise<void> {
		this.LOGGER.log(
			{
				userId,
				refreshToken: refreshToken.substring(0, 10) + "...",
			},
			"Attempting to logout all sessions except current"
		);

		await this.tokenService.deleteAllRefreshSessionsByUserIdExceptToken(userId, refreshToken);

		this.LOGGER.log(
			{
				userId,
			},
			"All other sessions successfully logged out"
		);
	}

	public async register(
		dto: RegisterUserRequestDTO & {
			ipAddress: string;
			fingerprint: string;
			userAgent: string;
		}
	): Promise<AccessRefreshTokens> {
		this.LOGGER.log(
			{
				login: dto.login,
				email: dto.email,
				ipAddress: dto.ipAddress,
			},
			"Attempting to register new user"
		);

		const candidateByLogin = await this.usersService.getByLogin(dto.login);

		if (candidateByLogin) {
			this.LOGGER.warn(
				{
					login: dto.login,
				},
				"Registration failed: user with this login already exists"
			);
			throw new ConflictException("Пользователь с таким логином уже существует.");
		}

		const candidateByEmail = await this.usersService.getByEmail(dto.email);

		if (candidateByEmail) {
			this.LOGGER.warn(
				{
					email: dto.email,
				},
				"Registration failed: user with this email already exists"
			);
			throw new ConflictException("Пользователь с таким email уже существует.");
		}

		this.LOGGER.debug(
			{
				login: dto.login,
				email: dto.email,
			},
			"Creating new user"
		);

		const user = await this.usersService.create(dto);

		this.LOGGER.log(
			{
				userId: user.id,
				login: user.login,
				email: user.email,
			},
			"User successfully created"
		);

		this.LOGGER.debug(
			{
				userId: user.id,
				login: user.login,
			},
			"Creating initial session for new user"
		);

		const tokens = await this.tokenService.createAccessRefreshTokens({
			userId: user.id,
			login: user.login,
			email: user.email,
			fingerprint: dto.fingerprint,
			ipAddress: dto.ipAddress,
			userAgent: dto.userAgent,
		});

		this.LOGGER.log(
			{
				userId: user.id,
				login: user.login,
			},
			"Initial session created successfully"
		);

		return tokens;
	}

	public async refreshToken(dto: RefreshTokenServiceDTO): Promise<AccessRefreshTokens> {
		this.LOGGER.log(
			{
				refreshToken: dto.refreshToken.substring(0, 10) + "...",
				ipAddress: dto.ipAddress,
			},
			"Attempting to refresh token"
		);

		const existingSession = await this.tokenService.getRefreshSessionByToken(dto.refreshToken);

		if (!existingSession || existingSession.isExpired()) {
			this.LOGGER.warn(
				{
					refreshToken: dto.refreshToken.substring(0, 10) + "...",
					reason: !existingSession ? "session not found" : "session expired",
				},
				"Token refresh failed"
			);
			throw new UnauthorizedException();
		}

		this.LOGGER.debug(
			{
				sessionId: existingSession.refreshToken,
				userId: existingSession.userId,
			},
			"Deleting old refresh token"
		);

		await this.tokenService.deleteRefreshSessionByToken(dto.refreshToken);

		const user = await this.usersService.getById(existingSession.userId);

		if (!user) {
			this.LOGGER.warn(
				{
					userId: existingSession.userId,
				},
				"Token refresh failed: user not found"
			);
			throw new UnauthorizedException();
		}

		this.LOGGER.log(
			{
				userId: user.id,
				login: user.login,
			},
			"Creating new session for user"
		);

		const tokens = await this.tokenService.createAccessRefreshTokens({
			userId: user.id,
			login: user.login,
			email: user.email,
			fingerprint: dto.fingerprint,
			ipAddress: dto.ipAddress,
			userAgent: dto.userAgent,
		});

		this.LOGGER.log(
			{
				userId: user.id,
				login: user.login,
			},
			"Token successfully refreshed"
		);

		return tokens;
	}
}
