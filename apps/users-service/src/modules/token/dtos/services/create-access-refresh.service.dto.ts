export interface CreateAccessRefreshTokensServiceDTO {
	userId: string;
	login: string;
	email: string;
	fingerprint: string;
	ipAddress: string;
	userAgent: string;
}
