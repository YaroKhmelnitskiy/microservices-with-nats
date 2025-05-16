import { NatsJetStreamServer } from "@nestjs-plugins/nestjs-nats-jetstream-transport";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
	});

	const config = app.get(ConfigService);
	const logger = app.get(Logger);

	app.connectMicroservice<MicroserviceOptions>({
		strategy: new NatsJetStreamServer({
			connectionOptions: {
				servers: config.get<string>("NATS_URL")!,
				name: "notification-service",
				user: config.get<string>("NATS_USER")!,
				pass: config.get<string>("NATS_PASSWORD")!,
			},
			consumerOptions: {
				manualAck: true,
				ackWait: 10000,
				durable: "notification-service",
				deliverGroup: "notification-service",
				deliverTo: "notification-service",
				ackPolicy: "Explicit",
			},
		}),
	});

	app.setGlobalPrefix("/api");
	app.useLogger(logger);

	const port = config.get<number>("NOTIFICATION_SERVICE_PORT");

	await app.startAllMicroservices();
	await app.listen(port!);
}
bootstrap().catch(console.error);
