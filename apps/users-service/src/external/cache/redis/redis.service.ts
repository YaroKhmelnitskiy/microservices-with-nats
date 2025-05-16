import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Scope } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { MAX_RETRY_ATTEMPTS, MAX_RETRY_DELAY, MIN_RETRY_DELAY } from "./constants/redis.constants";

@Injectable({
	scope: Scope.DEFAULT,
})
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(RedisService.name);
	private readonly defaultTtlSeconds: number;

	constructor(configService: ConfigService) {
		const host = configService.get<string>("REDIS_HOST");
		const port = configService.get<number>("REDIS_PORT");
		const password = configService.get<string>("REDIS_PASSWORD");
		const defaultTtlSeconds = configService.get<number>("REDIS_DEFAULT_TTL_SECONDS") ?? 30;

		if (!host || !port || !password) {
			throw new Error("Redis configuration is missing required parameters");
		}

		super({
			host,
			port,
			password,
			retryStrategy(times) {
				if (times > MAX_RETRY_ATTEMPTS) {
					return null;
				}
				const delay = Math.min(times * MIN_RETRY_DELAY, MAX_RETRY_DELAY);
				return delay;
			},
			maxRetriesPerRequest: MAX_RETRY_ATTEMPTS,
			enableReadyCheck: true,
			autoResubscribe: true,
			lazyConnect: true,
			autoResendUnfulfilledCommands: true,
		});

		this.defaultTtlSeconds = defaultTtlSeconds;

		this.on("error", (error) => {
			this.logger.error("Redis connection error:", error);
		});

		this.on("connect", () => {
			this.logger.log("Successfully connected to Redis");
		});
	}

	async onModuleInit(): Promise<void> {
		try {
			await this.connect();
			this.logger.log("Redis client initialized");
		} catch (error) {
			this.logger.error("Failed to initialize Redis client:", error);
			throw error;
		}
	}

	async onModuleDestroy(): Promise<void> {
		try {
			await this.quit();
			this.logger.log("Redis client disconnected");
		} catch (error) {
			this.logger.error("Error while disconnecting Redis client:", error);
		}
	}

	/**
	 * Обертка над методом set для автоматической сериализации в JSON
	 */
	async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
		const serialized = JSON.stringify(value);
		await this.setex(key, ttlSeconds ?? this.defaultTtlSeconds, serialized);
	}

	/**
	 * Обертка над методом get для автоматической десериализации JSON
	 */
	async getJson<T>(key: string, reviver?: (key: string, value: any) => any): Promise<T | null> {
		const value = await this.get(key);
		if (!value) return null;

		try {
			return JSON.parse(value, reviver) as T;
		} catch (error) {
			this.logger.error(`Error parsing JSON for key ${key}:`, error);
			return null;
		}
	}
}
