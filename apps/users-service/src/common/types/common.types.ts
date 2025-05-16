import type { Request } from "express";

export interface RequestContext {
	fingerprint: string;
	userAgent: string;
	ipAddress: string;
}

export type RequestWithUser = Request & {
	user: {
		id: string;
		login: string;
		email: string;
	};
};

export type RequestWithContext = Request & {
	requestContext: RequestContext;
};

export type AccessRefreshTokens = {
	accessToken: string;
	refreshSession: {
		refreshToken: string;
		expiresIn: number;
	};
};
