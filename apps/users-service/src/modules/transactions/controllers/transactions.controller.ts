import { Body, Controller, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { RequestWithUser } from "../../../common/types/common.types";
import { AccessTokenGuard } from "../../auth/guards/access-token-auth.guard";
import { CreateDepositRequestDto } from "../dtos/requests/create-deposit.request.dto";
import { CreateTransferRequestDto } from "../dtos/requests/create-transfer.request.dto";
import { CreateTransferResponseDTO } from "../dtos/responses/create-transfer.response.dto";
import { TransactionsService } from "../services/transactions.service";

@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: "Пользователь не авторизован" })
@UseGuards(AccessTokenGuard)
@Controller("transactions")
export class TransactionsController {
	constructor(private readonly transactionsService: TransactionsService) {}

	@ApiOperation({
		summary: "Создать перевод",
		description: "Создать перевод",
	})
	@ApiOkResponse({
		description: "Успешно создан перевод",
		type: CreateTransferResponseDTO,
	})
	@ApiBadRequestResponse({
		description: "Недостаточно средств или неправильно введены данные",
	})
	@ApiNotFoundResponse({ description: "Пользователь не найден" })
	@HttpCode(200)
	@Post("transfer")
	async createTransfer(
		@Req() req: RequestWithUser,
		@Body() dto: CreateTransferRequestDto
	): Promise<CreateTransferResponseDTO> {
		const transaction = await this.transactionsService.createTransfer({
			...dto,
			from: req.user.id,
		});

		return {
			id: transaction.id,
			amount: transaction.amount,
			createdAt: transaction.createdAt,
		};
	}

	@ApiOperation({
		summary: "Создать депозит",
		description: "Создать депозит",
	})
	@ApiOkResponse({
		description: "Успешно создан депозит",
	})
	@ApiNotFoundResponse({ description: "Пользователь не найден" })
	@HttpCode(200)
	@Post("deposit")
	async createDeposit(@Req() req: RequestWithUser, @Body() dto: CreateDepositRequestDto) {
		const transaction = await this.transactionsService.createDeposit({
			...dto,
			userId: req.user.id,
		});

		return {
			id: transaction.id,
			createdAt: transaction.createdAt,
		};
	}
}
