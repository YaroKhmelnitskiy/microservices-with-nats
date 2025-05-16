export type AccessJwtPayload = {
	id: string;
	login: string;
	email: string;
	iat: number;
	exp: number;
};
