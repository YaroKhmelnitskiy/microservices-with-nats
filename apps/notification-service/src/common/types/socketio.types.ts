import { AccessJwtPayload } from "@auth/types/access-jwt-payload.type";

export type AuthorizedSocketData = {
	user: AccessJwtPayload;
};
