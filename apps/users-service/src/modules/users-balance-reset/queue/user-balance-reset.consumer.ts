import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { UsersService } from "../../users/services/users.service";
import { UserBalanceResetModuleJobs } from "../types/user-balance-reset-jobs.enum";
import { UserBalanceResetModuleQueues } from "../types/user-balance-reset-queues.enum";

@Processor(UserBalanceResetModuleQueues.UserBalanceReset)
export class UserBalanceResetConsumer extends WorkerHost {
	private readonly logger = new Logger(UserBalanceResetConsumer.name);

	constructor(private readonly usersService: UsersService) {
		super();
	}

	public async process(job: Job<any, any, UserBalanceResetModuleJobs>): Promise<void> {
		switch (job.name) {
			case UserBalanceResetModuleJobs.UserBalanceResetJob: {
				this.logger.debug("Resetting balance for all users");
				await this.usersService.resetAllUsersBalance();
				this.logger.debug("Balance reset for all users");
				return;
			}
		}
	}
}
