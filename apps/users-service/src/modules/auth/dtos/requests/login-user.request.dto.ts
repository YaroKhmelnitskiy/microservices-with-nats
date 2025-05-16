import { ApiProperty } from "@nestjs/swagger";
import {
	IsEmail,
	IsNotEmpty,
	IsString,
	Matches,
	MaxLength,
	MinLength,
	ValidateIf,
} from "class-validator";
import { NoSpaces } from "../../../../../../../libs/shared/src/class-validator/noSpaces.decorator";

export class LoginUserRequestDTO {
	@ApiProperty({
		description: "User login",
		required: false,
		example: "johndoe",
		type: String,
		minLength: 3,
		maxLength: 255,
	})
	@ValidateIf((o: LoginUserRequestDTO) => !o.email)
	@IsNotEmpty()
	@IsString()
	@NoSpaces()
	@Matches(/^[a-zA-Z0-9_-]*$/, {
		message: "The login should not contain special characters",
	})
	@MinLength(3)
	@MaxLength(255)
	login?: string;

	@ApiProperty({
		description: "User email",
		required: false,
		example: "john.doe@example.com",
		type: String,
		maxLength: 255,
	})
	@ValidateIf((o: LoginUserRequestDTO) => !o.login)
	@IsNotEmpty()
	@IsEmail()
	@MaxLength(255)
	email?: string;

	@ApiProperty({
		description: "User password",
		required: true,
		example: "Pass1234!",
		type: String,
		maxLength: 255,
	})
	@IsNotEmpty()
	@IsString()
	@MaxLength(255)
	password: string;
}
