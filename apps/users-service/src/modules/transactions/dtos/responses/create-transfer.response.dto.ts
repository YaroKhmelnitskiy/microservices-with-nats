import { ApiProperty } from "@nestjs/swagger";

export class CreateTransferResponseDTO {
	@ApiProperty({
		description: "Идентификатор перевода",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	id: string;

	@ApiProperty({
		description: "Сумма перевода",
		example: 1000,
	})
	amount: number;

	@ApiProperty({
		description: "Дата создания перевода",
		example: "2021-01-01T00:00:00.000Z",
	})
	createdAt: Date;
}
