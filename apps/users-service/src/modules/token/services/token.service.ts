import { Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "crypto";
import { AccessRefreshTokens } from "../../../common/types/common.types";
import { parseTimeToMilliseconds } from "../../auth/helpers/parseTimeToMilliseconds";
import { CreateAccessRefreshTokensServiceDTO } from "../dtos/services/create-access-refresh.service.dto";
import { CreateAccessTokenServiceDTO } from "../dtos/services/create-access-token.service.dto";
import { CreateRefreshServiceDTO } from "../dtos/services/create-refresh-session.service.dto";
import { RefreshSession } from "../entities/RefreshSession";
import { RefreshSessionsRedisRepositoryImpl } from "../external/redis/refreshSessions.repository.impl";
import { RefreshSessionsRepository } from "../repositories/refreshSessions.repository";
import { CreateRefreshSessionResult } from "../types/create-refreshSession-result.type";

export class TokenService {
	private readonly LOGGER = new Logger(TokenService.name);

	constructor(
		private readonly configService: ConfigService,
		private readonly accessJwtService: JwtService,
		@Inject(RefreshSessionsRedisRepositoryImpl)
		private readonly refreshSessionRepository: RefreshSessionsRepository
	) {}

	public async getRefreshSessionByToken(refreshToken: string): Promise<RefreshSession | null> {
		this.LOGGER.debug(
			{
				refreshToken: refreshToken.substring(0, 10) + "...",
			},
			"Attempting to get refresh session by token"
		);

		const session = await this.refreshSessionRepository.getRefreshSessionByToken(refreshToken);

		if (!session) {
			this.LOGGER.debug(
				{
					refreshToken: refreshToken.substring(0, 10) + "...",
				},
				"Refresh session not found"
			);
		} else {
			this.LOGGER.debug(
				{
					userId: session.userId,
					expiresAt: session.expiresAt,
				},
				"Refresh session found"
			);
		}

		return session;
	}

	public async getAllRefreshSessionsByUserId(userId: string): Promise<RefreshSession[]> {
		this.LOGGER.debug(
			{
				userId,
			},
			"Attempting to get all refresh sessions for user"
		);

		const sessions =
			await this.refreshSessionRepository.getAllRefreshSessionsByUserIdOrderedByCreatedAtAsc(
				userId
			);

		this.LOGGER.debug(
			{
				userId,
				sessionsCount: sessions.length,
			},
			"Retrieved user refresh sessions"
		);

		return sessions;
	}

	public async createAccessRefreshTokens(
		dto: CreateAccessRefreshTokensServiceDTO
	): Promise<AccessRefreshTokens> {
		this.LOGGER.log(
			{
				userId: dto.userId,
				login: dto.login,
				email: dto.email,
				ipAddress: dto.ipAddress,
			},
			"Creating access refresh tokens for user"
		);

		const refreshSession = await this.createRefreshSession({
			userId: dto.userId,
			fingerprint: dto.fingerprint,
			ipAddress: dto.ipAddress,
			userAgent: dto.userAgent,
		});

		this.LOGGER.debug(
			{
				userId: dto.userId,
			},
			"Creating access token"
		);

		const accessToken = await this.createAccessToken({
			userId: dto.userId,
			login: dto.login,
			email: dto.email,
		});

		this.LOGGER.log(
			{
				userId: dto.userId,
				login: dto.login,
				refreshTokenExpiresIn: refreshSession.expiresIn,
			},
			"Access refresh tokens created successfully"
		);

		return {
			accessToken,
			refreshSession,
		};
	}

	public async createAccessToken(dto: CreateAccessTokenServiceDTO) {
		this.LOGGER.debug(
			{
				userId: dto.userId,
				login: dto.login,
				email: dto.email,
			},
			"Creating access token"
		);

		const token = await this.accessJwtService.signAsync({
			id: dto.userId,
			login: dto.login,
			email: dto.email,
		});

		this.LOGGER.debug(
			{
				userId: dto.userId,
			},
			"Access token created successfully"
		);

		return token;
	}

	public async createRefreshSession(
		dto: CreateRefreshServiceDTO
	): Promise<CreateRefreshSessionResult> {
		this.LOGGER.log(
			{
				userId: dto.userId,
				ipAddress: dto.ipAddress,
				fingerprint: dto.fingerprint,
			},
			"Creating refresh session"
		);

		const refreshToken = randomUUID();
		const expiresAt = new Date(
			Date.now() +
				parseTimeToMilliseconds(this.configService.get<string>("REFRESH_EXPIRED_IN")!)
		);

		const refreshSession = await RefreshSession.create({
			refreshToken: refreshToken,
			userId: dto.userId,
			userAgent: dto.userAgent,
			fingerprint: dto.fingerprint,
			expiresAt: expiresAt,
			ipAddress: dto.ipAddress,
		});

		this.LOGGER.debug(
			{
				userId: dto.userId,
				expiresAt: refreshSession.expiresAt,
			},
			"Created refresh session"
		);

		await this.refreshSessionRepository.createRefreshSession(refreshSession);

		this.LOGGER.log(
			{
				userId: dto.userId,
				expiresIn: refreshSession.expiresInMs,
			},
			"Refresh session created successfully"
		);

		return {
			refreshToken: refreshSession.refreshToken,
			expiresIn: refreshSession.expiresInMs,
		};
	}

	public async deleteRefreshSessionByToken(refreshToken: string): Promise<void> {
		this.LOGGER.log(
			{
				refreshToken: refreshToken.substring(0, 10) + "...",
			},
			"Attempting to delete refresh session"
		);

		await this.refreshSessionRepository.deleteRefreshSessionByToken(refreshToken);

		this.LOGGER.log(
			{
				refreshToken: refreshToken.substring(0, 10) + "...",
			},
			"Refresh session deleted successfully"
		);
	}

	public async deleteAllRefreshSessionsByUserId(userId: string): Promise<void> {
		this.LOGGER.log(
			{
				userId,
			},
			"Attempting to delete all refresh sessions for user"
		);

		await this.refreshSessionRepository.deleteAllRefreshSessionsByUserId(userId);

		this.LOGGER.log(
			{
				userId,
			},
			"All refresh sessions deleted successfully"
		);
	}

	public async deleteAllRefreshSessionsByUserIdExceptToken(userId: string, refreshToken: string) {
		this.LOGGER.log(
			{
				userId,
				refreshToken: refreshToken.substring(0, 10) + "...",
			},
			"Attempting to delete all refresh sessions except current"
		);

		await this.refreshSessionRepository.deleteAllRefreshSessionsByUserIdExceptToken(
			userId,
			refreshToken
		);

		this.LOGGER.log(
			{
				userId,
			},
			"All other refresh sessions deleted successfully"
		);
	}
}
