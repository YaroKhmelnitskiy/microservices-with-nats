import {
	IsEmail,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Matches,
	Max,
	MaxLength,
	Min,
	MinLength,
} from "class-validator";
import { NoSpaces } from "../../../../../../../libs/shared/src/class-validator/noSpaces.decorator";

export class UpdateUserRequestDTO {
	@IsUUID()
	id: string;

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

	@IsOptional()
	@IsNotEmpty()
	@IsEmail()
	@MaxLength(255)
	email?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(150)
	age?: number;

	@IsOptional()
	@IsNotEmpty()
	@IsString()
	@MaxLength(1000)
	about?: string;
}
