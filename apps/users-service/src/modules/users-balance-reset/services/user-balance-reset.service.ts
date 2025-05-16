import { Injectable, Logger } from "@nestjs/common";
import { UserBalanceResetProducer } from "../queue/user-balance-reset.producer";

@Injectable()
export class UserBalanceResetService {
	private readonly logger = new Logger(UserBalanceResetService.name);
	constructor(private readonly userBalanceResetProducer: UserBalanceResetProducer) {}

	public async resetBalance() {
		this.logger.log("Starting balance reset process for all users");
		await this.userBalanceResetProducer.produce();
		this.logger.log("Balance reset process initiated successfully");
	}
}
