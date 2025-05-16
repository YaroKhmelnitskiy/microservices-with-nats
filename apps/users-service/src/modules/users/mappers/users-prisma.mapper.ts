import { avatars as PrismaAvatar, users as PrismaUser } from "@prisma/users-client";
import { Money } from "../../../core/value-objects/Money";
import { User } from "../entities/User";
import { AvatarMapper } from "./avatar.mapper";

export class UserPrismaMapper {
	static async toEntity(prismaUser: PrismaUser, avatars: PrismaAvatar[] = []): Promise<User> {
		const entityAvatars = await Promise.all(
			avatars.map(async (avatar) => await AvatarMapper.fromPrismaToEntity(avatar))
		);

		return await User.create({
			id: prismaUser.id,
			age: prismaUser.age,
			email: prismaUser.email,
			login: prismaUser.login,
			balance: Money.fromNumber(prismaUser.balance.toNumber()),
			password: prismaUser.password,
			about: prismaUser.about,
			avatars: entityAvatars,
			createdAt: prismaUser.created_at,
			updatedAt: prismaUser.updated_at,
			deletedAt: prismaUser.deleted_at,
		});
	}

	public static fromEntityToCache(user: User): string {
		return JSON.stringify({
			id: user.id,
			about: user.about,
			age: user.age,
			createdAt: user.createdAt,
			activeAvatar: user.getActiveAvatar(),
			email: user.email,
			login: user.login,
		});
	}
}
