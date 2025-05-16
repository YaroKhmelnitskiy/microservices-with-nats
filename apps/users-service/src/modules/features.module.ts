import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { UsersBalanceResetModule } from "./users-balance-reset/users-balance-reset.module";
import { UsersModule } from "./users/users.module";

@Module({
	imports: [AuthModule, TransactionsModule, UsersModule, UsersBalanceResetModule],
})
export class FeaturesModule {}
