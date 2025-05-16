import BigNumber from "bignumber.js";
import { IsNotEmpty } from "class-validator";

export const BN = BigNumber.clone({
	DECIMAL_PLACES: 2,
	ROUNDING_MODE: BigNumber.ROUND_HALF_EVEN,
});

export class Money {
	@IsNotEmpty()
	public readonly amount: BigNumber;

	private constructor(amount: BigNumber) {
		this.amount = amount;
	}

	public static fromNumber(amount: number): Money {
		if (!Number.isFinite(amount)) {
			throw new Error("Money amount must be a finite number");
		}

		if (amount < 0) {
			throw new Error("Money amount cannot be negative");
		}

		return new Money(new BN(amount));
	}

	public static fromString(amount: string): Money {
		const number = Number(amount);
		if (isNaN(number)) {
			throw new Error("Invalid money amount string");
		}

		return Money.fromNumber(number);
	}

	public static zero(): Money {
		return new Money(new BN(0));
	}

	public add(other: Money): Money {
		return new Money(this.amount.plus(other.amount));
	}

	public subtract(other: Money): Money {
		const result = this.amount.minus(other.amount);

		if (result.isNegative()) {
			throw new Error("Insufficient funds");
		}

		return new Money(result);
	}

	public multiply(factor: number): Money {
		if (!Number.isFinite(factor)) {
			throw new Error("Multiplication factor must be a finite number");
		}
		return new Money(this.amount.multipliedBy(factor));
	}

	public equals(other: Money): boolean {
		return this.amount.eq(other.amount);
	}

	public isGreaterThan(other: Money): boolean {
		return this.amount.isGreaterThan(other.amount);
	}

	public isLessThan(other: Money): boolean {
		return this.amount.isLessThan(other.amount);
	}

	public toString(): string {
		return this.amount.toString();
	}

	public toNumber(): number {
		return this.amount.toNumber();
	}
}
