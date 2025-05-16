import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { SharedConfigModule } from "@shared/config/shared-config.module";
import cookieParser from "cookie-parser";
import { ExternalModule } from "./external/external.module";
import { FeaturesModule } from "./modules/features.module";

@Module({
	imports: [SharedConfigModule, ExternalModule, FeaturesModule],
	providers: [
		{
			provide: APP_PIPE,
			useValue: new ValidationPipe({
				whitelist: true,
				transform: true,
				transformOptions: {
					exposeDefaultValues: true,
					exposeUnsetFields: true,
				},
			}),
		},
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(cookieParser()).forRoutes("*");
	}
}
