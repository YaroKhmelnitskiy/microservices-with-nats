import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { PrismaClient } from "@prisma/users-client";

export type PrismaAdapterType = TransactionalAdapterPrisma<PrismaClient>;
