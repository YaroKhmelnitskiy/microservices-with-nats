import {
	DeleteObjectCommand,
	DeleteObjectCommandInput,
	PutObjectCommand,
	PutObjectCommandInput,
	S3Client,
} from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";

@Injectable()
export class S3Service {
	private readonly s3Client: S3Client;
	private readonly clientBaseURL: string;
	private readonly defaultBucket?: string;

	constructor(clientProvider: any) {
		this.s3Client = clientProvider.client.client;
		this.clientBaseURL = clientProvider.client.endpoint;
		this.defaultBucket = clientProvider.bucket;
	}

	public getBucket(): string {
		if (!this.defaultBucket) {
			throw new Error("Bucket is required");
		}

		return this.defaultBucket;
	}

	public getFileUrl(path: string, bucket?: string): string {
		if (!this.defaultBucket && !bucket) {
			throw new Error("Bucket is required");
		}

		if (bucket && this.defaultBucket) {
			throw new Error("Cannot specify bucket when default bucket is set");
		}

		const targetBucket = bucket || this.defaultBucket!;
		return `${this.clientBaseURL}/${targetBucket}/${path}`;
	}

	async uploadFile(
		options: Omit<PutObjectCommandInput, "Bucket"> & { Bucket?: string }
	): Promise<{
		url: string;
	}> {
		if (!options.Key || (options.Key && options.Key.trim().length === 0)) {
			throw new Error("Key can't be empty");
		}

		if (!this.defaultBucket && !options.Bucket) {
			throw new Error("Bucket is required");
		}

		if (options.Bucket && this.defaultBucket) {
			throw new Error("Cannot specify bucket when default bucket is set");
		}

		const targetBucket = options.Bucket || this.defaultBucket!;

		await this.s3Client.send(
			new PutObjectCommand({
				...options,
				Bucket: targetBucket,
			})
		);

		return {
			url: this.getFileUrl(options.Key, options.Bucket),
		};
	}

	async deleteFile(
		options: Omit<DeleteObjectCommandInput, "Bucket"> & { Bucket?: string }
	): Promise<void> {
		if (!options.Key) return;

		if (!this.defaultBucket && !options.Bucket) {
			throw new Error("Bucket is required");
		}

		if (options.Bucket && this.defaultBucket) {
			throw new Error("Cannot specify bucket when default bucket is set");
		}

		const targetBucket = options.Bucket || this.defaultBucket!;

		await this.s3Client.send(
			new DeleteObjectCommand({
				Bucket: targetBucket,
				Key: options.Key,
			})
		);
	}
}
