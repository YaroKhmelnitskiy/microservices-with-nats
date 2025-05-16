import { ApiProperty } from "@nestjs/swagger";
import { Nullable } from "../../../../core/types/utility.types";
import { UserAvatarResponseDTO } from "./user-avatar.response.dto";

export class UserPersonalProfileResponseDto {
	@ApiProperty({
		description: "User ID (uuid)",
		example: "123e4567-e89b-12d3-a456-426614174000",
		type: "string",
	})
	id: string;

	@ApiProperty({
		description: "Login",
		example: "johndoe",
		type: "string",
	})
	login: string;

	@ApiProperty({
		description: "Email",
		example: "john.doe@example.com",
		type: "string",
	})
	email: string;

	@ApiProperty({
		description: "Age",
		example: 30,
		type: "integer",
	})
	age: number;

	@ApiProperty({
		description: "About",
		example: "Software developer with 5 years of experience",
		nullable: true,
		maxLength: 1000,
		type: "string",
	})
	about: Nullable<string>;

	activeAvatar: Nullable<UserAvatarResponseDTO>;

	@ApiProperty({
		description: "Created at",
		example: "2021-07-01T12:00:00.000Z",
	})
	createdAt: Date;
}
