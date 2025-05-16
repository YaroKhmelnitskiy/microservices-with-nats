import { ApiProperty } from "@nestjs/swagger";

export class AccessTokenResponse {
	@ApiProperty({ description: "Новый access token" })
	accessToken: string;
}
