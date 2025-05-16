import { plainToInstance, Transform } from "class-transformer";
import {
	IsBoolean,
	IsEnum,
	IsIP,
	IsNumber,
	IsString,
	Matches,
	validateSync,
} from "class-validator";

enum Environment {
	Development = "development",
	Production = "production",
	Test = "test",
}

enum LogLevel {
	Trace = "trace",
	Debug = "debug",
	Info = "info",
	Warn = "warn",
	Error = "error",
	Fatal = "fatal",
}

class EnvironmentVariables {
	@IsEnum(Environment)
	NODE_ENV: Environment;

	@IsString()
	USERS_SERVICE_NAME: string;

	@IsString()
	NOTIFICATION_SERVICE_NAME: string;

	@Transform(({ value }) => Number(value))
	@IsNumber()
	USERS_SERVICE_PORT: number;

	@Transform(({ value }) => Number(value))
	@IsNumber()
	NOTIFICATION_SERVICE_PORT: number;

	@IsString()
	POSTGRES_USER: string;

	@IsString()
	POSTGRES_PASSWORD: string;

	@IsString()
	POSTGRES_DB: string;

	@Transform(({ value }) => Number(value))
	@IsNumber()
	POSTGRES_PORT: number;

	@IsString()
	JWT_ACCESS_SECRET: string;

	@IsString()
	JWT_REFRESH_SECRET: string;

	@Matches(/^\d+[smhd]$/)
	REFRESH_EXPIRED_IN: string;

	@Matches(/^\d+[smhd]$/)
	ACCESS_EXPIRED_IN: string;

	@IsString()
	DATABASE_URL: string;

	@IsString()
	REDIS_USER: string;

	@IsString()
	REDIS_PASSWORD: string;

	@Transform(({ value }) => Number(value))
	@IsNumber()
	REDIS_DEFAULT_TTL_SECONDS: number;

	@IsString()
	S3_URL: string;

	@IsString()
	S3_USER_AVATARS_BUCKET: string;

	@IsIP()
	REDIS_HOST: string;

	@Transform(({ value }) => Number(value))
	@IsNumber()
	REDIS_PORT: number;

	@IsString()
	S3_ACCESS_KEY_ID: string;

	@IsString()
	S3_SECRET_ACCESS_KEY: string;

	@IsString()
	S3_REGION: string;

	@IsString()
	NATS_URL: string;

	@IsString()
	NATS_USER: string;

	@IsString()
	NATS_PASSWORD: string;

	@IsEnum(LogLevel)
	LOG_LEVEL: LogLevel;

	@Transform(({ value }) => {
		if (value === "true") return true;
		if (value === "false") return false;
		return value;
	})
	@IsBoolean()
	LOG_TO_CONSOLE: boolean;

	@Transform(({ value }) => {
		if (value === "true") return true;
		if (value === "false") return false;
		return value;
	})
	@IsBoolean()
	LOG_AUTO_LOGGING: boolean;

	@Transform(({ value }) => {
		if (value === "true") return true;
		if (value === "false") return false;
		return value;
	})
	@IsBoolean()
	LOG_QUIET_REQ_LOGGER: boolean;

	@Transform(({ value }) => {
		if (value === "true") return true;
		if (value === "false") return false;
		return value;
	})
	@IsBoolean()
	LOG_QUIET_RES_LOGGER: boolean;
}

export function validateEnv(config: Record<string, unknown>) {
	const validatedConfig = plainToInstance(EnvironmentVariables, config, {
		exposeDefaultValues: true,
	});

	const errors = validateSync(validatedConfig, {
		skipMissingProperties: false,
	});

	if (errors.length > 0) {
		throw new Error(errors.toString());
	}
	return validatedConfig;
}
