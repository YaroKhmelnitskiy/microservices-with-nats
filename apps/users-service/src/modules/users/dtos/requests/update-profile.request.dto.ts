import { ApiPropertyOptional } from "@nestjs/swagger";
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

export class UpdatePersonalProfileRequestDTO {
	@ApiPropertyOptional({
		description: "Login",
		example: "johndoe",
		minLength: 3,
		maxLength: 255,
		type: "string",
	})
	@IsOptional()
	@IsNotEmpty()
	@IsString()
	@NoSpaces()
	@Matches(/^[a-zA-Z0-9_-]*$/, {
		message: "The string should not contain special characters",
	})
	@MinLength(3)
	@MaxLength(255)
	login?: string;

	@ApiPropertyOptional({
		description: "Email",
		example: "john.doe@example.com",
		type: "string",
		maxLength: 255,
	})
	@IsOptional()
	@IsNotEmpty()
	@IsEmail()
	@MaxLength(255)
	email?: string;

	@ApiPropertyOptional({
		description: "Age",
		example: 30,
		minimum: 0,
		maximum: 150,
		type: "integer",
	})
	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(150)
	age?: number;

	@ApiPropertyOptional({
		description: "About",
		example: "Software developer with 5 years of experience",
		maxLength: 1000,
		type: "string",
	})
	@IsOptional()
	@IsNotEmpty()
	@IsString()
	@MaxLength(1000)
	about?: string;
}
