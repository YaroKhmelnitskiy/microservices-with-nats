import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsPositive, IsUUID, Max, Min } from "class-validator";

export class CreateTransferRequestDto {
	@ApiProperty({
		description: "Сумма перевода",
		example: 1000,
		type: "number",
		format: "decimal",
		minimum: 1,
		maximum: 10_000,
	})
	@IsNumber({ maxDecimalPlaces: 2 })
	@IsPositive()
	@Min(1)
	@Max(10_000)
	amount: number;

	@ApiProperty({
		description: "Идентификатор пользователя, которому будет переведены средства",
		example: "123e4567-e89b-12d3-a456-426614174000",
		type: "string",
		format: "uuid",
	})
	@IsUUID()
	to: string;
}
