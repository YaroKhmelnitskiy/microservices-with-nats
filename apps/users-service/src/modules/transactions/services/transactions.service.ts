import { Transactional } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Nullable } from "../../../core/types/utility.types";
import { Money } from "../../../core/value-objects/Money";
import { UsersService } from "../../users/services/users.service";
import { CreateDepositRequestDto } from "../dtos/requests/create-deposit.request.dto";
import { CreateTransferRequestDto } from "../dtos/requests/create-transfer.request.dto";
import { Transaction } from "../entities/Transaction";
import { TransactionOutbox, TransactionOutboxEventName } from "../entities/TransactionOutbox";
import { TransactionsOutboxRepositoryImpl } from "../external/prisma/transactions-outbox.repository.impl";
import { TransactionsRepositoryImpl } from "../external/prisma/transactions.repository.impl";
import { TransactionsOutboxRepository } from "../repositories/transactions-outbox.repository";
import { TransactionsRepository } from "../repositories/transactions.repository";
import { TransactionTypes } from "../types/transaction-types.enum";
import { TransactionsEventsPublisher } from "./transactions-event.publisher";

@Injectable()
export class TransactionsService {
	private readonly LOGGER = new Logger(TransactionsService.name);

	constructor(
		@Inject(TransactionsRepositoryImpl)
		private readonly transactionsRepository: TransactionsRepository,
		@Inject(TransactionsOutboxRepositoryImpl)
		private readonly transactionsOutboxRepository: TransactionsOutboxRepository,
		private readonly usersService: UsersService,
		private readonly transactionsEventsPublisher: TransactionsEventsPublisher
	) {}

	@Transactional<TransactionalAdapterPrisma>({
		isolationLevel: "RepeatableRead",
	})
	public async createTransfer(dto: CreateTransferRequestDto & { from: string }): Promise<{
		id: string;
		amount: number;
		createdAt: Date;
		from: Nullable<string>;
		to: string;
		type: TransactionTypes;
	}> {
		this.LOGGER.log(
			"Creating transfer transaction from user %s to user %s for amount %s",
			dto.from,
			dto.to,
			dto.amount
		);

		const amount = Money.fromNumber(dto.amount);

		const fromUser = await this.usersService.getByIdForUpdate(dto.from);
		const toUser = await this.usersService.getByIdForUpdate(dto.to);

		if (!fromUser || !toUser) {
			this.LOGGER.warn(
				"Transfer failed: user not found (from: %s, to: %s)",
				dto.from,
				dto.to
			);
			throw new NotFoundException("User not found");
		}

		if (fromUser.balance.isLessThan(amount)) {
			this.LOGGER.warn(
				"Transfer failed: insufficient balance for user %s (balance: %s, amount: %s)",
				dto.from,
				fromUser.balance.toNumber(),
				amount.toNumber()
			);
			throw new BadRequestException("Insufficient balance");
		}

		this.LOGGER.debug("Updating balances for transfer");
		await fromUser.setBalance(fromUser.balance.subtract(amount));
		await toUser.setBalance(toUser.balance.add(amount));

		const transaction = await Transaction.create({
			from: dto.from,
			to: dto.to,
			amount: amount,
			type: TransactionTypes.TRANSFER,
		});

		this.LOGGER.debug("Creating transaction record");
		const createdTransaction = await this.transactionsRepository.create(transaction);

		this.LOGGER.debug("Updating user balances in database");
		await this.usersService.updateBalance(fromUser.id, fromUser.balance);
		await this.usersService.updateBalance(toUser.id, toUser.balance);

		this.LOGGER.log(
			"Transfer transaction created successfully with id %s",
			createdTransaction.id
		);

		this.LOGGER.log("Creating transaction outbox record");
		const transactionOutbox = new TransactionOutbox({
			eventName: TransactionOutboxEventName.TransferCreated,
			payload: {
				transactionId: transaction.id,
				from: dto.from,
				to: dto.to,
				amount: createdTransaction.amount,
				createdAt: createdTransaction.createdAt,
			},
		});
		await this.transactionsOutboxRepository.create(transactionOutbox);
		this.LOGGER.log("Transaction outbox record created successfully");

		return {
			id: createdTransaction.id,
			amount: createdTransaction.amount,
			createdAt: createdTransaction.createdAt,
			from: createdTransaction.from,
			to: createdTransaction.to,
			type: createdTransaction.type,
		};
	}

	@Transactional<TransactionalAdapterPrisma>({
		isolationLevel: "RepeatableRead",
	})
	public async createDeposit(dto: CreateDepositRequestDto & { userId: string }): Promise<{
		id: string;
		amount: number;
		createdAt: Date;
		to: string;
		type: TransactionTypes;
	}> {
		this.LOGGER.log(
			"Creating deposit transaction for user %s with amount %s",
			dto.userId,
			dto.amount
		);

		const amount = Money.fromNumber(dto.amount);

		const user = await this.usersService.getByIdForUpdate(dto.userId);

		if (!user) {
			this.LOGGER.warn("Deposit failed: user not found (userId: %s)", dto.userId);
			throw new NotFoundException("User not found");
		}

		this.LOGGER.debug("Updating user balance for deposit");
		await user.setBalance(user.balance.add(amount));

		const transaction = await Transaction.create({
			to: dto.userId,
			amount: amount,
			type: TransactionTypes.SYSTEM_DEPOSIT,
		});

		this.LOGGER.debug("Creating transaction record");
		const createdTransaction = await this.transactionsRepository.create(transaction);

		this.LOGGER.debug("Updating user balance in database");
		await this.usersService.updateBalance(user.id, user.balance);

		this.LOGGER.log(
			"Deposit transaction created successfully with id %s",
			createdTransaction.id
		);

		const transactionOutbox = new TransactionOutbox({
			eventName: TransactionOutboxEventName.DepositCreated,
			payload: {
				transactionId: transaction.id,
				userId: dto.userId,
				amount: createdTransaction.amount,
				createdAt: createdTransaction.createdAt,
			},
		});
		this.LOGGER.log("Creating transaction outbox record");
		await this.transactionsOutboxRepository.create(transactionOutbox);
		this.LOGGER.log("Transaction outbox record created successfully");

		return {
			id: createdTransaction.id,
			amount: createdTransaction.amount,
			createdAt: createdTransaction.createdAt,
			to: createdTransaction.to,
			type: createdTransaction.type,
		};
	}
}
