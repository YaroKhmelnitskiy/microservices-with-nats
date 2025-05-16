import { avatars as PrismaAvatar } from "@prisma/users-client";
import { UserAvatarResponseDTO } from "../dtos/responses/user-avatar.response.dto";
import { UserAvatar } from "../entities/UserAvatar";
import { CachedAvatar } from "../types/cached-user.types";

export class AvatarMapper {
	public static toResponseDTO(
		avatar: UserAvatar | CachedAvatar,
		url: string
	): UserAvatarResponseDTO {
		return {
			id: avatar.id,
			userId: avatar.userId,
			url: url,
			active: avatar.active,
			createdAt: avatar.createdAt,
		};
	}

	public static async fromPrismaToEntity(avatar: PrismaAvatar): Promise<UserAvatar> {
		return await UserAvatar.create({
			id: avatar.id,
			userId: avatar.user_id,
			path: avatar.path,
			active: avatar.active,
			createdAt: avatar.created_at,
			updatedAt: avatar.updated_at,
			deletedAt: avatar.deleted_at,
		});
	}
}
