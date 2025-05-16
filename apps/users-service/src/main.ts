import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { initMainConfig } from "./main.config";

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
	});

	app.useLogger(app.get(Logger));
	initMainConfig(app);
	const config = app.get(ConfigService);
	const swaggerConfig = new DocumentBuilder()
		.setTitle("Nest Auth API")
		.setDescription("This is Nest Auth API with access/refresh tokens auth logic")
		.setVersion("1.0")
		.addCookieAuth("refreshToken")
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, swaggerConfig);

	SwaggerModule.setup("swagger", app, document, {
		useGlobalPrefix: true,
	});

	const port = config.get<number>("USERS_SERVICE_PORT");

	await app.listen(port!);
}

bootstrap().catch(console.error);
