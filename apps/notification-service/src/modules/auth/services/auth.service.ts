import { AccessJwtPayload } from "@auth/types/access-jwt-payload.type";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InvalidTokenError } from "../../../core/errors/auth.errors";

@Injectable()
export class AuthService {
	constructor(private readonly jwtService: JwtService) {}

	public async validateUserTokenAsync(token: string): Promise<AccessJwtPayload> {
		try {
			const payload: AccessJwtPayload = await this.jwtService.verifyAsync(token);
			return payload;
		} catch (error) {
			throw new InvalidTokenError("Invalid token", { cause: error });
		}
	}

	public validateUserToken(token: string): AccessJwtPayload {
		try {
			const payload: AccessJwtPayload = this.jwtService.verify(token);
			return payload;
		} catch (error) {
			throw new InvalidTokenError("Invalid token", { cause: error });
		}
	}
}
