import { Module } from "@nestjs/common";
import { SharedConfigModule } from "@shared/config/shared-config.module";
import { ExternalModule } from "./external/external.module";
import { FeaturesModule } from "./modules/features.module";

@Module({
	imports: [SharedConfigModule, ExternalModule, FeaturesModule],
	controllers: [],
	providers: [],
})
export class AppModule {}
