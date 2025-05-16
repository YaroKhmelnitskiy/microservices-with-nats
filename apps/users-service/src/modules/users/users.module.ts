import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RequestContextMiddleware } from "../../../../../libs/shared/src/middlewares/request-context.middleware";
import { S3Module } from "../../external/s3/s3.module";
import { FileModule } from "../file/file.module";
import { TokenModule } from "../token/token.module";
import { PersonalProfileController } from "./controllers/personal-profile.controller";
import { UsersController } from "./controllers/users.controller";
import { UsersRepositoryImpl } from "./external/prisma/users.repository.impl";
import { UsersService } from "./services/users.service";

@Module({
	imports: [
		TokenModule,
		FileModule,
		S3Module.forFeatureAsync({
			useFactory: (configService: ConfigService) => ({
				bucket: configService.get<string>("S3_USER_AVATARS_BUCKET")!,
			}),
			inject: [ConfigService],
		}),
	],
	providers: [UsersRepositoryImpl, UsersService],
	controllers: [UsersController, PersonalProfileController],
	exports: [UsersService],
})
export class UsersModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(RequestContextMiddleware).forRoutes("personalProfile/update-password");
	}
}
