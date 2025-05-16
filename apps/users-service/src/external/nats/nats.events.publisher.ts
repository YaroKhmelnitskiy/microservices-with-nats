import { Injectable } from "@nestjs/common";
import {
	EventsPublisher,
	PublishConfig,
} from "apps/users-service/src/core/interfaces/event-publisher.interface";
import { NatsService } from "./nats.service";

@Injectable()
export class NatsEventsPublisher implements EventsPublisher {
	constructor(private readonly natsService: NatsService) {}

	async publish(topic: string, event: any, config?: Partial<PublishConfig>): Promise<void> {
		await this.natsService.publish(topic, event, config);
	}
}
