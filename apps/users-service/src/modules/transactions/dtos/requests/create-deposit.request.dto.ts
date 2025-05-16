import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsPositive, Max, Min } from "class-validator";

export class CreateDepositRequestDto {
	@ApiProperty({
		description: "Сумма депозита",
		example: 1000,
		type: "number",
		format: "decimal",
		minimum: 1,
		maximum: 10_000,
	})
	@IsNumber(
		{ maxDecimalPlaces: 2 },
		{ message: "Amount must be a number with up to 2 decimal places" }
	)
	@IsPositive()
	@Min(1)
	@Max(10_000)
	amount: number;
}
