import { ApiProperty } from "@nestjs/swagger";
import {
	IsEmail,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Matches,
	Max,
	MaxLength,
	Min,
	MinLength,
} from "class-validator";
import { NoSpaces } from "../../../../../../../libs/shared/src/class-validator/noSpaces.decorator";

export class RegisterUserRequestDTO {
	@ApiProperty({
		description: "Login",
		example: "johndoe",
		minLength: 3,
		maxLength: 255,
	})
	@IsNotEmpty()
	@IsString()
	@NoSpaces()
	@Matches(/^[a-zA-Z0-9_-]*$/, {
		message: "The string should not contain special characters",
	})
	@MinLength(3)
	@MaxLength(255)
	login: string;

	@ApiProperty({
		description: "Email",
		example: "john.doe@example.com",
		maxLength: 255,
	})
	@IsNotEmpty()
	@IsEmail()
	@MaxLength(255)
	email: string;

	@ApiProperty({
		description: "Password",
		example: "Pass1234!",
		maxLength: 255,
	})
	@IsNotEmpty()
	@IsString()
	@MaxLength(255)
	password: string;

	@ApiProperty({
		description: "Age",
		example: 30,
		minimum: 0,
		maximum: 150,
		type: "integer",
	})
	@IsNotEmpty()
	@IsNumber()
	@Min(0)
	@Max(150)
	age: number;

	@ApiProperty({
		description: "About user",
		example: "Software developer with 5 years of experience",
		maxLength: 1000,
		required: false,
		type: "string",
	})
	@IsOptional()
	@IsNotEmpty()
	@IsString()
	@MaxLength(1000)
	about?: string;
}
