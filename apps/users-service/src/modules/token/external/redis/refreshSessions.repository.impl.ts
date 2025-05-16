import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../../../../external/cache/redis/redis.service";
import { RefreshSession } from "../../entities/RefreshSession";
import { RefreshSessionsCachedMapper } from "../../mappers/refreshSessions-cached.mapper";
import { RefreshSessionsRepository } from "../../repositories/refreshSessions.repository";
import { RefreshSessionCached } from "../../types/refreshSession-cached.type";

@Injectable()
export class RefreshSessionsRedisRepositoryImpl implements RefreshSessionsRepository {
	private readonly LOGGER = new Logger(RefreshSessionsRedisRepositoryImpl.name);

	private readonly sessionKeyPrefix = "refresh_session:";
	private readonly userSessionsKeyPrefix = "user_sessions:";

	constructor(private readonly redis: RedisService) {}

	public async createRefreshSession(session: RefreshSession): Promise<void> {
		const sessionKey = `${this.sessionKeyPrefix}${session.refreshToken}`;
		const userSessionKey = `${this.userSessionsKeyPrefix}${session.userId}`;
		const expiresAt = session.expiresAt.getTime();
		const userSessionToken = `${session.refreshToken}:${expiresAt}`;

		const pipeline = this.redis.pipeline();

		// Сохраняем сессию
		pipeline.psetex(
			sessionKey,
			session.expiresInMs,
			JSON.stringify(RefreshSessionsCachedMapper.fromEntityToCached(session))
		);

		// Добавляем ID сессии в список сессий пользователя
		pipeline.sadd(userSessionKey, userSessionToken);

		await pipeline.exec();
	}

	public async deleteRefreshSessionByToken(refreshToken: string): Promise<void> {
		const sessionKey = `${this.sessionKeyPrefix}${refreshToken}`;

		// Получаем сессию для определения userId
		const session = await this.getRefreshSessionByToken(refreshToken);
		if (!session) return;

		const userSessionsKey = `${this.userSessionsKeyPrefix}${session.userId}`;

		const pipeline = this.redis.pipeline();

		// Удаляем сессию
		pipeline.del(sessionKey);

		// Сканируем и удаляем из множества пользователя
		const userSessions = await this.redis.smembers(userSessionsKey);
		const sessionToDelete = userSessions.find((s) => s.startsWith(refreshToken));

		if (sessionToDelete) {
			pipeline.srem(userSessionsKey, sessionToDelete);
		}

		await pipeline.exec();
	}

	public async getRefreshSessionByToken(token: string): Promise<RefreshSession | null> {
		const sessionKey = `${this.sessionKeyPrefix}${token}`;
		const session = await this.redis.getJson<RefreshSessionCached>(sessionKey, (key, value) => {
			if (key === "expiresAt" || key === "createdAt") {
				value = new Date(value);
			}
			return value;
		});

		if (!session) return null;

		return await RefreshSessionsCachedMapper.fromCachedToEntity(session);
	}

	public async getAllRefreshSessionsByUserIdOrderedByCreatedAtAsc(
		userId: string
	): Promise<RefreshSession[]> {
		try {
			const userSessions = await this.redis.smembers(
				`${this.userSessionsKeyPrefix}${userId}`
			);
			if (!userSessions.length) return [];

			// Получаем все сессии одним запросом через pipeline
			const pipeline = this.redis.pipeline();

			for (const session of userSessions) {
				const token = session.split(":")[0];
				pipeline.get(`${this.sessionKeyPrefix}${token}`);
			}

			const sessionsData = await pipeline.exec();
			if (!sessionsData) return [];

			// Преобразуем и фильтруем результаты
			const sessions = sessionsData
				.map(([err, data]) => {
					if (err || !data) return null;
					const session = JSON.parse(data as string, (key, value) => {
						if (key === "expiresAt" || key === "createdAt") {
							return new Date(value);
						}
						return value;
					}) as RefreshSessionCached;
					return session;
				})
				.filter(
					(session): session is RefreshSessionCached =>
						session !== null && session.expiresAt > Date.now() // проверяем, что срок действия сессии не истек, ибо могли не успеть очистить по кроне ведь в SET нет TTL
				)
				.toSorted((a, b) => a.createdAt - b.createdAt); // сортируем по createdAt

			// Преобразуем в доменные сущности
			return Promise.all(
				sessions.map((session) => RefreshSessionsCachedMapper.fromCachedToEntity(session))
			);
		} catch (error) {
			throw new Error(`Failed to get refresh sessions: ${error.message}`);
		}
	}

	public async deleteAllRefreshSessionsByUserId(userId: string): Promise<void> {
		const userSessionsKey = `${this.userSessionsKeyPrefix}${userId}`;
		const userSessions = await this.redis.smembers(userSessionsKey);

		if (!userSessions.length) return;

		const pipeline = this.redis.pipeline();

		// Удаляем все сессии
		for (const session of userSessions) {
			const token = session.split(":")[0];
			pipeline.del(`${this.sessionKeyPrefix}${token}`);
		}

		// Удаляем ключ со списком сессий пользователя
		pipeline.del(userSessionsKey);

		await pipeline.exec();
	}

	public async deleteAllRefreshSessionsByUserIdExceptToken(
		userId: string,
		refreshToken: string
	): Promise<void> {
		const userSessionsKey = `${this.userSessionsKeyPrefix}${userId}`;
		const userSessions = await this.redis.smembers(userSessionsKey);

		if (userSessions.length === 0) return;

		const sessionsToDelete = userSessions.filter(
			(session) => !session.startsWith(`${refreshToken}:`)
		);

		if (sessionsToDelete.length === 0) return;

		const pipeline = this.redis.pipeline();

		// Удаляем сессии
		for (const session of sessionsToDelete) {
			const token = session.split(":")[0];
			pipeline.del(`${this.sessionKeyPrefix}${token}`);
		}

		// Удаляем записи из множества пользователя
		pipeline.srem(userSessionsKey, ...sessionsToDelete);

		await pipeline.exec();
	}

	public async cleanupExpiredSessions(): Promise<void> {
		const BATCH_SIZE = 100;
		let totalCleaned = 0;

		return new Promise((resolve, reject) => {
			// Используем scan вместо keys для неблокирующего получения ключей
			const stream = this.redis.scanStream({
				match: `${this.userSessionsKeyPrefix}*`,
				count: BATCH_SIZE,
			});

			stream.on("data", (keys: Array<string>) => {
				this.LOGGER.verbose(`Get user_sessions:* batch with ${keys.length} keys`);

				stream.pause();

				if (keys.length === 0) {
					stream.resume();
					return;
				}

				Promise.all(
					keys.map(async (key: string) => {
						const sessions = await this.redis.smembers(key);

						this.LOGGER.verbose(`Found ${sessions.length} sessions for user ${key}`);
						if (sessions.length === 0) return;

						const sessionsToDelete = sessions.filter(
							(session) => Date.now() >= Number(session.split(":")[1])
						);

						this.LOGGER.verbose(
							`Found ${sessionsToDelete.length} expired sessions to delete`
						);

						if (sessionsToDelete.length === 0) return;

						await this.redis.srem(key, ...sessionsToDelete);
						this.LOGGER.verbose(`Deleted ${sessionsToDelete.length} expired sessions`);
						totalCleaned += sessionsToDelete.length;
					})
				)
					.then(() => {
						stream.resume();
					})
					.catch(reject);
			});

			stream.on("error", (error) => {
				this.LOGGER.error(`Failed to cleanup expired sessions: ${error.message}`);
				reject(error);
			});

			stream.on("pause", () => {
				this.LOGGER.debug(`Paused cleanup of expired sessions`);
			});

			stream.on("resume", () => {
				this.LOGGER.debug(`Resumed cleanup of expired sessions`);
			});

			stream.on("end", () => {
				this.LOGGER.debug(`Cleaned up ${totalCleaned} expired sessions`);
				resolve();
			});
		});
	}
}
