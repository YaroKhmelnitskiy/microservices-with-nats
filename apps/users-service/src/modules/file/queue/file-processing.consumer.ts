import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { S3Service } from "../../../external/s3/s3.service";
import { FileQueues } from "../types/file-queues.enum";
import { FileOperationTypes, S3CommandOptions } from "./file-processing.producer";

@Processor(FileQueues.FileProcessing)
export class FileProcessingQueueConsumer extends WorkerHost {
	private readonly LOGGER = new Logger(FileProcessingQueueConsumer.name);
	constructor(private readonly s3Service: S3Service) {
		super();
	}

	async process(job: Job<S3CommandOptions, any, FileOperationTypes>) {
		this.LOGGER.log(
			{
				id: job.id,
				name: job.name,
				data: job.data,
			},
			`Starting processing of job ${job.id} (${job.name})`
		);

		const operation = job.data;
		try {
			switch (job.name) {
				case FileOperationTypes.DELETE:
					this.LOGGER.debug(
						{
							bucket: operation.bucket,
							key: operation.key,
						},
						"Attempting to delete file from S3"
					);
					await this.s3Service.deleteFile({
						Bucket: operation.bucket,
						Key: operation.key,
					});
					this.LOGGER.log(
						{
							bucket: operation.bucket,
							key: operation.key,
						},
						"File successfully deleted from S3"
					);
					break;
				default:
					this.LOGGER.warn(
						{
							jobName: job.name,
						},
						"Unknown job type received"
					);
					throw new Error(`Unknown job type: ${job.name}`);
			}

			this.LOGGER.log(
				{
					id: job.id,
					name: job.name,
					duration: Date.now() - job.timestamp,
				},
				`Job ${job.id} completed successfully`
			);
		} catch (error) {
			this.LOGGER.error(
				{
					id: job.id,
					name: job.name,
					error: error.message,
					stack: error.stack,
				},
				`Failed to process job ${job.id}`
			);
			throw error;
		}
	}
}
