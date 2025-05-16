import { ApiProperty } from "@nestjs/swagger";

export class UserAvatarResponseDTO {
	@ApiProperty({
		description: "Идентификатор аватара",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	id: string;

	@ApiProperty({
		description: "Идентификатор пользователя",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	userId: string;

	@ApiProperty({
		description: "URL аватара",
		example: "https://example.com/avatar.jpg",
	})
	url: string;

	@ApiProperty({
		description: "Активный ли аватар",
		example: true,
	})
	active: boolean;

	@ApiProperty({
		description: "Дата создания аватара",
		example: "2021-01-01T00:00:00.000Z",
	})
	createdAt: Date;
}
