import { Controller, HttpCode, Logger, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { AccessTokenGuard } from "../../auth/guards/access-token-auth.guard";
import { UserBalanceResetService } from "../services/user-balance-reset.service";

@UseGuards(AccessTokenGuard)
@Controller("users-balance-reset")
export class UserBalanceResetController {
	private readonly logger = new Logger(UserBalanceResetController.name);

	constructor(private readonly userBalanceResetService: UserBalanceResetService) {}

	@ApiOperation({ summary: "Обнулить баланс всех пользователей" })
	@ApiOkResponse({
		description: "Баланс всех пользователей обновлен",
	})
	@ApiBearerAuth()
	@HttpCode(200)
	@Post()
	public async resetBalance() {
		this.logger.log("Resetting balance for all users");
		await this.userBalanceResetService.resetBalance();
		this.logger.log("Balance reset for all users");
	}
}
