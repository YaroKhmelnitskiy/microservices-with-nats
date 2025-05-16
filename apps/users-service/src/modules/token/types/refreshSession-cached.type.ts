export type RefreshSessionCached = {
	refreshToken: string;
	expiresAt: number;
	createdAt: number;
	userId: string;
	ipAddress: string;
	userAgent: string;
	fingerprint: string;
};
