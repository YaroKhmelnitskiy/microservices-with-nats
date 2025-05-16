import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { RequestContextMiddleware } from "../../../../../libs/shared/src/middlewares/request-context.middleware";
import { PrismaModule } from "../../external/persistence/prisma/prisma.module";
import { TokenModule } from "../token/token.module";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./controllers/auth.controller";
import { AuthService } from "./services/auth.service";
import { AccessTokenStrategy } from "./strategies/access-token.strategy";

@Module({
	imports: [PrismaModule, UsersModule, PassportModule, TokenModule],
	controllers: [AuthController],
	providers: [AuthService, AccessTokenStrategy],
})
export class AuthModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(RequestContextMiddleware)
			.forRoutes("auth/login", "auth/register", "auth/refresh-token");
	}
}
