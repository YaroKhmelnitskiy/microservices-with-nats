import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RefreshSessionsRedisRepositoryImpl } from "../external/redis/refreshSessions.repository.impl";
import { RefreshSessionsRepository } from "../repositories/refreshSessions.repository";

@Injectable()
export class SessionCleanupService {
	private readonly LOGGER = new Logger(SessionCleanupService.name);

	constructor(
		@Inject(RefreshSessionsRedisRepositoryImpl)
		private readonly refreshSessionRepository: RefreshSessionsRepository
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	public async cleanupExpiredSessions(): Promise<void> {
		this.LOGGER.log("Starting cleanup of expired sessions");

		try {
			const deletedCount = await this.refreshSessionRepository.cleanupExpiredSessions();

			this.LOGGER.log(
				{
					deletedCount,
					timestamp: new Date().toISOString(),
				},
				"Cleanup completed successfully"
			);
		} catch (error) {
			this.LOGGER.error(
				{
					error: error.message,
					stack: error.stack,
				},
				"Failed to cleanup expired sessions"
			);
			throw error;
		}
	}
}
