import { RefreshSession } from "../entities/RefreshSession";

export interface RefreshSessionsRepository {
	createRefreshSession(session: RefreshSession): Promise<void>;

	deleteRefreshSessionByToken(refreshToken: string): Promise<void>;

	getRefreshSessionByToken(token: string): Promise<RefreshSession | null>;

	getAllRefreshSessionsByUserIdOrderedByCreatedAtAsc(userId: string): Promise<RefreshSession[]>;

	deleteAllRefreshSessionsByUserId(userId: string): Promise<void>;

	deleteAllRefreshSessionsByUserIdExceptToken(
		userId: string,
		refreshToken: string
	): Promise<void>;

	cleanupExpiredSessions(): Promise<void>;
}
