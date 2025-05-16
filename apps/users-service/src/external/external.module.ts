import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { getPinoConfig } from "@pino-shared";
import { ClsModule } from "nestjs-cls";
import { LoggerModule } from "nestjs-pino";
import { RedisModule } from "./cache/redis/redis.module";
import { NatsModule } from "./nats/nats.module";
import { clsConfig } from "./persistence/cls-transactional/cls.config";
import { S3Module } from "./s3/s3.module";

@Module({
	imports: [
		LoggerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				return getPinoConfig({
					nodeEnv: configService.get<string>("NODE_ENV")!,
					appName: configService.get<string>("USERS_SERVICE_NAME")!,
					logLevel: configService.get<string>("LOG_LEVEL")!,
					logToConsole: configService.get<boolean>("LOG_TO_CONSOLE")!,
					autoLogging: configService.get<boolean>("LOG_AUTO_LOGGING")!,
					quietReqLogger: configService.get<boolean>("LOG_QUIET_REQ_LOGGER")!,
					quietResLogger: configService.get<boolean>("LOG_QUIET_RES_LOGGER")!,
				});
			},
		}),
		ClsModule.forRoot(clsConfig),
		RedisModule,
		ScheduleModule.forRoot(),
		BullModule.forRootAsync({
			useFactory: (configService: ConfigService) => ({
				connection: {
					host: configService.get<string>("REDIS_HOST"),
					port: configService.get<number>("REDIS_PORT"),
					password: configService.get<string>("REDIS_PASSWORD"),
				},
			}),
			inject: [ConfigService],
		}),
		S3Module.forRootAsync({
			useFactory: (configService: ConfigService) => ({
				region: configService.get<string>("S3_REGION") || "",
				endpoint: configService.get<string>("S3_URL") || "",
				credentials: {
					accessKeyId: configService.get<string>("S3_ACCESS_KEY_ID") || "",
					secretAccessKey: configService.get<string>("S3_SECRET_ACCESS_KEY") || "",
				},
			}),
			inject: [ConfigService],
		}),
		NatsModule,
	],
	exports: [],
})
export class ExternalModule {}
