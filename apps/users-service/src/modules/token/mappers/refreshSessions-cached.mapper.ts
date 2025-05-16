import { RefreshSession } from "../entities/RefreshSession";
import { RefreshSessionCached } from "../types/refreshSession-cached.type";

export class RefreshSessionsCachedMapper {
	public static fromEntityToCached(session: RefreshSession): RefreshSessionCached {
		return {
			refreshToken: session.refreshToken,
			expiresAt: session.expiresAt.getTime(),
			createdAt: session.createdAt.getTime(),
			userId: session.userId,
			fingerprint: session.fingerprint,
			ipAddress: session.ipAddress,
			userAgent: session.userAgent,
		};
	}

	public static async fromCachedToEntity(session: RefreshSessionCached): Promise<RefreshSession> {
		return RefreshSession.create({
			refreshToken: session.refreshToken,
			expiresAt: new Date(session.expiresAt),
			createdAt: new Date(session.createdAt),
			userId: session.userId,
			fingerprint: session.fingerprint,
			ipAddress: session.ipAddress,
			userAgent: session.userAgent,
		});
	}
}
