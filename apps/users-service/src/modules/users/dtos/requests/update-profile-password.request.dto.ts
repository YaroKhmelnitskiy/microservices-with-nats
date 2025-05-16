import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdatePersonalProfilePasswordRequestDTO {
	@ApiProperty({
		description: "Old password",
		example: "OldPass1234!",
		type: "string",
		maxLength: 255,
	})
	@IsNotEmpty()
	@IsString()
	@MaxLength(255)
	oldPassword: string;

	@ApiProperty({
		description: "New password",
		example: "Pass1234!",
		type: "string",
		maxLength: 255,
	})
	@IsNotEmpty()
	@IsString()
	@MaxLength(255)
	newPassword: string;
}
