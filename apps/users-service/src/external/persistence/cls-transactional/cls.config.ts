import { ClsPluginTransactional } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { PrismaClient } from "@prisma/users-client";
import { ClsModuleOptions } from "nestjs-cls";
import { PrismaModule } from "../prisma/prisma.module";
import { PrismaService } from "../prisma/prisma.service";

export const clsConfig: ClsModuleOptions = {
	plugins: [
		new ClsPluginTransactional({
			imports: [PrismaModule],
			adapter: new TransactionalAdapterPrisma<PrismaClient>({
				prismaInjectionToken: PrismaService,
			}),
		}),
	],
};
