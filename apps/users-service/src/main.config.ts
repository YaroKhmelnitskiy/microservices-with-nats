import { INestApplication } from "@nestjs/common";

export function initMainConfig(app: INestApplication) {
	app.setGlobalPrefix("/api");
}
