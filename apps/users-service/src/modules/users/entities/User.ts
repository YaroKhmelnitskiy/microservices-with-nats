import { Type } from "class-transformer";
import {
	IsArray,
	IsDate,
	IsEmail,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Matches,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateNested,
} from "class-validator";
import { randomUUID } from "crypto";
import { NoSpaces } from "../../../../../../libs/shared/src/class-validator/noSpaces.decorator";
import { Entity } from "../../../core/entity/Entity";
import { Nullable } from "../../../core/types/utility.types";
import { Money } from "../../../core/value-objects/Money";
import { AvatarLengthConflict } from "../errors/user.errors";
import { UserAvatar } from "./UserAvatar";

export interface UserProps {
	id?: string;
	login: string;
	email: string;
	password: string;
	age: number;
	avatars: UserAvatar[];
	balance?: Nullable<Money>;
	about?: Nullable<string>;
	createdAt?: Nullable<Date>;
	updatedAt?: Nullable<Date>;
	deletedAt?: Nullable<Date>;
}

export type UserJSON = {
	id: string;
	login: string;
	email: string;
	age: number;
	about: string;
	password: string;
	avatars: Array<UserAvatar>;
	balance: string;
	createdAt: Nullable<Date>;
	updatedAt: Nullable<Date>;
	deletedAt: Nullable<Date>;
};

export class User extends Entity {
	@IsUUID()
	public id: string;

	@IsNotEmpty()
	@IsString()
	@NoSpaces()
	@Matches(/^[a-zA-Z0-9_-]*$/, {
		message: "The string should not contain special characters",
	})
	@MinLength(3)
	@MaxLength(255)
	public login: string;

	@IsNotEmpty()
	@IsEmail()
	@MaxLength(255)
	public email: string;

	@IsNotEmpty()
	@IsString()
	@MaxLength(255)
	public password: string;

	@IsNotEmpty()
	@IsNumber()
	@Max(150)
	@Min(0)
	public age: number;

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	public about: Nullable<string>;

	@IsNotEmpty()
	@ValidateNested()
	@Type(() => Money)
	public balance: Money;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UserAvatar)
	public avatars: UserAvatar[];

	@IsOptional()
	@IsDate()
	public updatedAt: Nullable<Date>;

	@IsOptional()
	@IsDate()
	public createdAt: Date;

	@IsOptional()
	@IsDate()
	public deletedAt: Nullable<Date>;

	private constructor(props: UserProps) {
		super();
		this.id = props.id ?? randomUUID();
		this.login = props.login;
		this.email = props.email;
		this.password = props.password;
		this.age = props.age;
		this.about = props.about ?? null;
		this.balance = props.balance ?? Money.zero();
		this.avatars = props.avatars;
		this.createdAt = props.createdAt ?? new Date();
		this.updatedAt = props.updatedAt ?? null;
		this.deletedAt = props.deletedAt ?? null;
	}

	public static async create(props: UserProps): Promise<User> {
		const user = new User(props);
		await user.validate();

		return user;
	}

	public async setLogin(login: string) {
		this.login = login;
		await this.validate();
	}

	public async setEmail(email: string) {
		this.email = email;
		await this.validate();
	}

	public async setPassword(password: string) {
		this.password = password;
		await this.validate();
	}

	public async setAge(age: number) {
		this.age = age;
		await this.validate();
	}

	public async setAbout(about: string) {
		this.about = about;
		await this.validate();
	}

	public async setBalance(balance: Money) {
		this.balance = balance;
		await this.validate();
	}

	public getActiveAvatar(): Nullable<UserAvatar> {
		return this.avatars.find((avatar) => avatar.active) ?? null;
	}

	public getNonDeletedAvatars(): UserAvatar[] {
		return this.avatars.filter((avatar) => avatar.deletedAt === null);
	}

	public getDeletedAvatars(): UserAvatar[] {
		return this.avatars.filter((avatar) => avatar.deletedAt !== null);
	}

	public addAvatar(avatar: UserAvatar) {
		if (this.getDeletedAvatars.length >= 5) {
			throw new AvatarLengthConflict();
		}

		this.avatars.push(avatar);
	}

	public removeAvatar(id: string) {
		const avatar = this.avatars.find((avatar) => avatar.id === id);
		if (!avatar) {
			throw new Error("Avatar not found");
		}

		avatar.deletedAt = new Date();
	}
}
