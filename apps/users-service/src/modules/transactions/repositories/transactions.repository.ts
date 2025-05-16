import { Nullable } from "../../../core/types/utility.types";
import { Transaction } from "../entities/Transaction";
import { TransactionTypes } from "../types/transaction-types.enum";

export interface TransactionsRepository {
	create(transaction: Transaction): Promise<{
		id: string;
		amount: number;
		createdAt: Date;
		from: Nullable<string>;
		to: string;
		type: TransactionTypes;
	}>;
}
