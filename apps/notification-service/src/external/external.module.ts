import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { MongooseModule } from "@nestjs/mongoose";
import { getPinoConfig } from "@pino-shared";
import { LoggerModule } from "nestjs-pino";

@Module({
	imports: [
		BullModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				connection: {
					host: configService.get<string>("REDIS_HOST"),
					port: configService.get<number>("REDIS_PORT"),
					password: configService.get<string>("REDIS_PASSWORD"),
				},
			}),
		}),
		MongooseModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>("MONGO_URI")!,
				dbName: configService.get<string>("MONGO_DB_NAME")!,
			}),
		}),
		EventEmitterModule.forRoot(),
		LoggerModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				return getPinoConfig({
					nodeEnv: configService.get<string>("NODE_ENV")!,
					appName: configService.get<string>("NOTIFICATION_SERVICE_NAME")!,
					logLevel: configService.get<string>("LOG_LEVEL")!,
					logToConsole: configService.get<boolean>("LOG_TO_CONSOLE")!,
					autoLogging: configService.get<boolean>("LOG_AUTO_LOGGING")!,
					quietReqLogger: configService.get<boolean>("LOG_QUIET_REQ_LOGGER")!,
					quietResLogger: configService.get<boolean>("LOG_QUIET_RES_LOGGER")!,
				});
			},
		}),
	],
})
export class ExternalModule {}
