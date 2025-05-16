import { ApiProperty } from "@nestjs/swagger";

export class CreateDepositResponseDTO {
	@ApiProperty({
		description: "Идентификатор депозита",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	id: string;

	@ApiProperty({
		description: "Сумма депозита",
		example: 1000,
	})
	amount: number;

	@ApiProperty({
		description: "Дата создания депозита",
		example: "2021-01-01T00:00:00.000Z",
	})
	createdAt: Date;
}
