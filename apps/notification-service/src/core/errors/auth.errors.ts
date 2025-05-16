export class InvalidTokenError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = "InvalidTokenError";
	}
}

export class NoAuthorizationError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = "NoAuthorizationError";
	}
}
