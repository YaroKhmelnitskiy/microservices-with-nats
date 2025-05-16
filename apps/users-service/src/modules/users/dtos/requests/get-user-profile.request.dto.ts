import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class GetUserByIdRequestDTO {
	@ApiProperty({
		description: "User id",
		example: "123e4567-e89b-12d3-a456-426614174000",
		type: "string",
	})
	@IsUUID()
	id: string;
}
