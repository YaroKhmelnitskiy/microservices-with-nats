import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./env.validation";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validate: validateEnv,
			ignoreEnvFile: process.env.NODE_ENV === "production",
			envFilePath: `./env/.env.${process.env.NODE_ENV === "test" ? "test" : "dev"}`,
		}),
	],
	exports: [ConfigModule],
})
export class SharedConfigModule {}
