export interface PublishConfig {
	maxRetries: number; // -1 for infinite retries
	baseDelay: number;
}

export interface EventsPublisher {
	publish(topic: string, event: any, config?: Partial<PublishConfig>): Promise<void>;
}
