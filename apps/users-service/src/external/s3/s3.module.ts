import { S3Client, S3ClientConfig } from "@aws-sdk/client-s3";
import { DynamicModule, Global, Module } from "@nestjs/common";
import { S3_CLIENT } from "./constants/s3.constants";
import { S3BucketConfig } from "./interfaces/s3-config.interface";
import { S3Service } from "./s3.service";

@Global()
@Module({})
export class S3Module {
	static forRoot(options: S3ClientConfig): DynamicModule {
		return {
			module: S3Module,
			providers: [
				{
					provide: S3_CLIENT,
					useValue: new S3Client(options),
				},
			],
		};
	}

	static forRootAsync(options: {
		imports?: any[];
		useFactory: (...args: any[]) => Promise<S3ClientConfig> | S3ClientConfig;
		inject?: any[];
	}): DynamicModule {
		return {
			module: S3Module,
			imports: [...(options.imports || [])],
			providers: [
				{
					provide: S3_CLIENT,
					useFactory: async (...args: any[]) => {
						const config = await options.useFactory(...args);
						const client = new S3Client(config);
						return {
							client,
							endpoint: config.endpoint,
						};
					},
					inject: options.inject,
				},
			],
			exports: [S3_CLIENT],
		};
	}

	static forFeatureAsync(options: {
		imports?: any[];
		useFactory: (...args: any[]) => S3BucketConfig;
		inject?: any[];
		provide?: string;
	}): DynamicModule {
		const provide = options.provide ?? S3Service;
		return {
			module: S3Module,
			providers: [
				{
					provide,
					useFactory: (...args: any[]) => {
						const client = args[0];
						const rest = args.slice(1);
						const config = {
							client,
							...options.useFactory(...rest),
						};
						return new S3Service(config);
					},
					inject: [S3_CLIENT, ...(options.inject || [])],
				},
			],
			imports: [],
			exports: [provide],
		};
	}

	static forFeature(options?: { provide?: string; bucket?: string }): DynamicModule {
		const provide = options?.provide ?? S3Service;
		return {
			module: S3Module,
			providers: [
				{
					provide,
					useFactory: (...args: any[]) => {
						const client = args[0];
						const config = {
							client,
							bucket: options?.bucket,
						};
						return new S3Service(config);
					},
					inject: [S3_CLIENT],
				},
			],
			exports: [provide],
		};
	}
}
