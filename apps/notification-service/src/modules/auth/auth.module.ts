import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { SocketAuthMiddleware } from "./middlewares/socket-auth.middleware";
import { AuthService } from "./services/auth.service";

@Module({
	imports: [
		JwtModule.registerAsync({
			useFactory: (configService: ConfigService) => {
				return {
					secret: configService.get<string>("JWT_ACCESS_SECRET"),
				};
			},
			inject: [ConfigService],
		}),
	],
	providers: [SocketAuthMiddleware, AuthService],
	exports: [SocketAuthMiddleware, AuthService],
})
export class AuthModule {}
