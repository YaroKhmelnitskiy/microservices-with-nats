import { ObjectCannedACL } from "@aws-sdk/client-s3";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { JobsOptions, Queue } from "bullmq";
import { FileQueues } from "../types/file-queues.enum";

export enum FileOperationTypes {
	DELETE = "DELETE",
	UPLOAD = "UPLOAD",
}

export interface S3CommandOptions {
	bucket: string;
	key: string;
	contentType?: string;
	acl?: ObjectCannedACL;
}

@Injectable()
export class FileProcessingQueueProducer {
	private readonly LOGGER = new Logger(FileProcessingQueueProducer.name);
	constructor(
		@InjectQueue(FileQueues.FileProcessing)
		private readonly fileProcessingQueue: Queue
	) {}

	async produce(type: FileOperationTypes, data: S3CommandOptions, options?: JobsOptions) {
		this.LOGGER.debug(
			{
				type,
				data,
				options,
			},
			"Preparing to produce job"
		);

		try {
			const job = await this.fileProcessingQueue.add(type, data, options);

			this.LOGGER.log(
				{
					jobId: job.id,
					type,
					bucket: data.bucket,
					key: data.key,
					options: options || {},
				},
				"Job successfully added to queue"
			);

			return job;
		} catch (error) {
			this.LOGGER.error(
				{
					type,
					data,
					error: error.message,
					stack: error.stack,
				},
				"Failed to add job to queue"
			);
			throw error;
		}
	}
}
