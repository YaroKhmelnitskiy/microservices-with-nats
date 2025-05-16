import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { S3Module } from "../../external/s3/s3.module";
import { FileProcessingQueueConsumer } from "./queue/file-processing.consumer";
import { FileProcessingQueueProducer } from "./queue/file-processing.producer";
import { FileQueues } from "./types/file-queues.enum";

@Module({
	imports: [
		S3Module.forFeature(),
		BullModule.registerQueue({
			name: FileQueues.FileProcessing,
		}),
	],
	providers: [FileProcessingQueueConsumer, FileProcessingQueueProducer],
	exports: [FileProcessingQueueProducer],
})
export class FileModule {}
