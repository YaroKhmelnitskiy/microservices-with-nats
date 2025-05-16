import { IsBoolean, IsDate, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { randomUUID } from "crypto";
import { Entity } from "../../../core/entity/Entity";
import { Nullable } from "../../../core/types/utility.types";

export interface UserAvatarProps {
	id?: string;
	userId: string;
	path: string;
	active: boolean;
	createdAt?: Nullable<Date>;
	updatedAt?: Nullable<Date>;
	deletedAt?: Nullable<Date>;
}

export class UserAvatar extends Entity {
	@IsUUID()
	public id: string;

	@IsUUID()
	public userId: string;

	@IsNotEmpty()
	@IsString()
	public path: string;

	@IsBoolean()
	public active: boolean;

	@IsDate()
	public createdAt: Date;

	@IsOptional()
	@IsDate()
	public updatedAt: Nullable<Date>;

	@IsOptional()
	@IsDate()
	public deletedAt: Nullable<Date>;

	private constructor(props: UserAvatarProps) {
		super();
		this.id = props.id ?? randomUUID();
		this.userId = props.userId;
		this.path = props.path;
		this.active = props.active;
		this.createdAt = props.createdAt ?? new Date();
		this.updatedAt = props.updatedAt ?? null;
		this.deletedAt = props.deletedAt ?? null;
	}

	public static async create(props: UserAvatarProps): Promise<UserAvatar> {
		const userAvatar = new UserAvatar(props);
		await userAvatar.validate();
		return userAvatar;
	}
}
