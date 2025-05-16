import { ApiProperty } from "@nestjs/swagger";
import { PageMetaDto } from "@shared/dtos/pagination/with-pagination.response.dto";
import { UserPublicResponseDTO } from "./user-public.response.dto";

export class UsersPaginatedResponseDto {
	@ApiProperty({
		description: "Список пользователей",
		type: [UserPublicResponseDTO],
	})
	readonly data: UserPublicResponseDTO[];

	@ApiProperty({
		description: "Метаданные пагинации",
		type: PageMetaDto,
	})
	readonly meta: PageMetaDto;

	constructor(data: UserPublicResponseDTO[], meta: PageMetaDto) {
		this.data = data;
		this.meta = meta;
	}
}
