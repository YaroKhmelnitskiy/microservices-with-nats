import { TransactionHost } from "@nestjs-cls/transactional";
import { Injectable } from "@nestjs/common";
import { PrismaAdapterType } from "apps/users-service/src/external/persistence/cls-transactional/prisma-adapter.type";
import { Nullable } from "../../../../core/types/utility.types";
import { Transaction } from "../../entities/Transaction";
import { TransactionsRepository } from "../../repositories/transactions.repository";
import { TransactionTypes } from "../../types/transaction-types.enum";

@Injectable()
export class TransactionsRepositoryImpl implements TransactionsRepository {
	constructor(private readonly txHost: TransactionHost<PrismaAdapterType>) {}

	public async create(transaction: Transaction): Promise<{
		id: string;
		amount: number;
		createdAt: Date;
		from: Nullable<string>;
		to: string;
		type: TransactionTypes;
	}> {
		if (transaction.type !== TransactionTypes.SYSTEM_DEPOSIT && !transaction.from) {
			throw new Error("From user is required");
		}

		const createdTransaction = await this.txHost.tx.transactions.create({
			data: {
				id: transaction.id,
				amount: transaction.amount.toNumber(),
				from_user_id: transaction.from,
				to_user_id: transaction.to,
				type: transaction.type,
			},
		});

		return {
			id: createdTransaction.id,
			amount: createdTransaction.amount.toNumber(),
			createdAt: createdTransaction.created_at,
			from: createdTransaction.from_user_id ?? null,
			to: createdTransaction.to_user_id,
			type: createdTransaction.type as TransactionTypes,
		};
	}
}
