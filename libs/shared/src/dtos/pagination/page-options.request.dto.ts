import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

export enum PaginationOrder {
	ASC = "ASC",
	DESC = "DESC",
}

export class PageOptionsRequestDTO {
	@ApiPropertyOptional({
		description: "Sort order",
		enum: PaginationOrder,
		default: PaginationOrder.ASC,
	})
	@IsEnum(PaginationOrder)
	@IsOptional()
	order?: PaginationOrder = PaginationOrder.ASC;

	@ApiPropertyOptional({
		description: "Page number",
		type: "number",
		minimum: 1,
		default: 1,
	})
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@IsOptional()
	page?: number = 1;

	@ApiPropertyOptional({
		description: "Number of items per page",
		default: 10,
		minimum: 1,
		maximum: 50,
	})
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(50)
	@IsOptional()
	take?: number = 10;

	get skip(): number {
		return (this.page! - 1) * this.take!;
	}
}
