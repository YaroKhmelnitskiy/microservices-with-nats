import { Type, applyDecorators } from "@nestjs/common";
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from "@nestjs/swagger";
import { PaginatedResponseDto } from "@shared/dtos/pagination/with-pagination.response.dto";

export const ApiPaginatedOkResponse = <TModel extends Type<any>>(model: TModel) => {
	return applyDecorators(
		ApiExtraModels(PaginatedResponseDto, model),
		ApiOkResponse({
			description: "Успешно получены данные",
			schema: {
				allOf: [
					{ $ref: getSchemaPath(PaginatedResponseDto) },
					{
						properties: {
							data: {
								type: "array",
								items: { $ref: getSchemaPath(model) },
							},
						},
					},
				],
			},
		})
	);
};
