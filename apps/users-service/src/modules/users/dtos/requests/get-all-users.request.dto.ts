import { ApiPropertyOptional } from "@nestjs/swagger";
import { PageOptionsRequestDTO } from "@shared/dtos/pagination/page-options.request.dto";
import { IsOptional, IsString } from "class-validator";

export class UsersPaginatedRequestDTO extends PageOptionsRequestDTO {
	@ApiPropertyOptional({
		type: "string",
		description: "Поиск по логину",
		example: "user123",
	})
	@IsOptional()
	@IsString()
	login?: string;
}
