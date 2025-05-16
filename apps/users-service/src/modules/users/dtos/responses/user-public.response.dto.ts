import { ApiProperty } from "@nestjs/swagger";
import { Nullable } from "../../../../core/types/utility.types";
import { UserAvatarResponseDTO } from "./user-avatar.response.dto";

export class UserPublicResponseDTO {
	@ApiProperty({
		description: "User id",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	id: string;

	@ApiProperty({
		description: "User login",
		example: "johndoe",
	})
	login: string;

	@ApiProperty({
		description: "User age",
		example: 30,
	})
	age: number;

	@ApiProperty({
		description: "About user",
		example: "Software developer with 5 years of experience",
		type: "string",
		nullable: true,
	})
	about: Nullable<string>;

	@ApiProperty({
		description: "Active avatar",
		type: UserAvatarResponseDTO,
		example: {
			id: "123e4567-e89b-12d3-a456-426614174000",
			userId: "123e4567-e89b-12d3-a456-426614174000",
			url: "https://example.com/avatar.jpg",
			active: true,
			createdAt: "2021-01-01T00:00:00.000Z",
		},
		nullable: true,
	})
	activeAvatar: Nullable<UserAvatarResponseDTO>;
}
