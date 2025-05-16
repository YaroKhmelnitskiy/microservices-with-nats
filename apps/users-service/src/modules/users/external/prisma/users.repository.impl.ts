import { Inject, Injectable } from "@nestjs/common";
import { users as PrismaUser } from "@prisma/users-client";

import { TransactionHost } from "@nestjs-cls/transactional";
import { PrismaAdapterType } from "apps/users-service/src/external/persistence/cls-transactional/prisma-adapter.type";
import {
	FindAllUsersWithPaginationInputDTO,
	FindAllUsersWithPaginationRepositoryResultDTO,
} from "../../dtos/find-all-users-w-pagination.dto";
import { User } from "../../entities/User";
import { UserAvatar } from "../../entities/UserAvatar";
import { AvatarMapper } from "../../mappers/avatar.mapper";
import { UserPrismaMapper } from "../../mappers/users-prisma.mapper";
import { UsersRepository } from "../../repositories/users.repository";
@Injectable()
export class UsersRepositoryImpl implements UsersRepository {
	constructor(
		@Inject(TransactionHost) private readonly txHost: TransactionHost<PrismaAdapterType>
	) {}

	public async exists(id: string): Promise<boolean> {
		const user = await this.txHost.tx.users.findUnique({
			where: {
				id: id,
				deleted_at: null,
			},
		});
		return !!user;
	}

	public async findAllWithPagination(
		dto: FindAllUsersWithPaginationInputDTO
	): Promise<FindAllUsersWithPaginationRepositoryResultDTO> {
		const total = await this.txHost.tx.users.count({
			where: {
				deleted_at: null,
				login: {
					startsWith: dto.login,
					mode: "insensitive",
				},
			},
		});

		const prismaUsers = await this.txHost.tx.users.findMany({
			skip: dto.skip,
			take: dto.take,
			orderBy: {
				id: dto.orderBy,
			},
			select: {
				id: true,
				login: true,
				age: true,
				about: true,
				avatars: {
					where: {
						active: true,
						deleted_at: null,
					},
					select: {
						id: true,
						user_id: true,
						path: true,
						active: true,
						created_at: true,
					},
					take: 1,
				},
			},
			where: {
				deleted_at: null,
				login: {
					startsWith: dto.login,
					mode: "insensitive",
				},
			},
		});

		return {
			data: prismaUsers.map((prUser) => {
				return {
					id: prUser.id,
					login: prUser.login,
					age: prUser.age,
					about: prUser.about,
					activeAvatar:
						prUser.avatars.length > 0
							? {
									id: prUser.avatars[0].id,
									path: prUser.avatars[0].path,
									active: prUser.avatars[0].active,
									createdAt: prUser.avatars[0].created_at,
									userId: prUser.avatars[0].user_id,
								}
							: null,
				};
			}),
			total,
		};
	}

	public async getById(id: string): Promise<User | null> {
		const prismaUser = await this.txHost.tx.users.findUnique({
			where: {
				id: id,
				deleted_at: null,
			},
			include: {
				avatars: {
					where: {
						deleted_at: null,
					},
					orderBy: {
						created_at: "desc",
					},
				},
			},
		});

		if (!prismaUser) {
			return null;
		}

		const { avatars, ...user } = prismaUser;
		return await UserPrismaMapper.toEntity(user, avatars);
	}

	public async getByLogin(login: string): Promise<User | null> {
		const prismaUser = await this.txHost.tx.users.findUnique({
			where: {
				login: login,
				deleted_at: null,
			},
			include: {
				avatars: {
					where: {
						deleted_at: null,
					},
					orderBy: {
						created_at: "desc",
					},
				},
			},
		});

		if (!prismaUser) {
			return null;
		}

		const { avatars, ...user } = prismaUser;
		return await UserPrismaMapper.toEntity(user, avatars);
	}

	public async getByEmail(email: string): Promise<User | null> {
		const prismaUser = await this.txHost.tx.users.findUnique({
			where: {
				email: email,
				deleted_at: null,
			},
			include: {
				avatars: {
					where: {
						deleted_at: null,
					},
					orderBy: {
						created_at: "desc",
					},
				},
			},
		});

		if (!prismaUser) {
			return null;
		}

		const { avatars, ...user } = prismaUser;
		return await UserPrismaMapper.toEntity(user, avatars);
	}

	public async getBalance(userId: string): Promise<number | null> {
		const balance = await this.txHost.tx.users.findUnique({
			where: { id: userId },
			select: { balance: true },
		});

		if (!balance) {
			return null;
		}

		return balance.balance.toNumber();
	}

	public async create(user: User): Promise<void> {
		await this.txHost.tx.users.create({
			data: {
				id: user.id,
				age: user.age,
				email: user.email,
				login: user.login,
				password: user.password,
				about: user.about,
				created_at: user.createdAt,
			},
		});
	}

	public async update(user: User): Promise<void> {
		await this.txHost.tx.users.update({
			data: {
				id: user.id,
				age: user.age,
				email: user.email,
				login: user.login,
				password: user.password,
				about: user.about,
			},
			where: {
				id: user.id,
			},
		});
	}

	public async updateBalance(userId: string, balance: number): Promise<void> {
		await this.txHost.tx.users.update({
			data: {
				balance: balance,
			},
			where: {
				id: userId,
			},
		});
	}

	public async findAvatarByUserId(id: string): Promise<UserAvatar | null> {
		const prismaAvatar = await this.txHost.tx.avatars.findUnique({
			where: {
				id: id,
				deleted_at: null,
			},
		});

		if (!prismaAvatar) {
			return null;
		}

		return await AvatarMapper.fromPrismaToEntity(prismaAvatar);
	}

	public async findUserAvatarsByUserIdSortedDesc(userId: string): Promise<UserAvatar[]> {
		const prismaAvatars = await this.txHost.tx.avatars.findMany({
			where: {
				user_id: userId,
				deleted_at: null,
			},
			orderBy: {
				created_at: "desc",
			},
		});

		return await Promise.all(
			prismaAvatars.map(
				async (prismaAvatar) => await AvatarMapper.fromPrismaToEntity(prismaAvatar)
			)
		);
	}

	public async findActiveUserAvatarByUserId(userId: string): Promise<UserAvatar | null> {
		const prismaAvatar = await this.txHost.tx.avatars.findFirst({
			where: {
				user_id: userId,
				active: true,
				deleted_at: null,
			},
		});

		if (!prismaAvatar) {
			return null;
		}

		return await AvatarMapper.fromPrismaToEntity(prismaAvatar);
	}

	public async createUserAvatar(avatar: UserAvatar): Promise<void> {
		await this.txHost.tx.avatars.create({
			data: {
				id: avatar.id,
				user_id: avatar.userId,
				path: avatar.path,
				active: avatar.active,
			},
		});
	}

	public async softRemoveAvatarByAvatarId(id: string): Promise<void> {
		await this.txHost.tx.avatars.update({
			where: {
				id: id,
			},
			data: {
				active: false,
				deleted_at: new Date(),
			},
		});
	}

	public async updateAvatarActiveStatusByAvatarId(
		avatarId: string,
		isActive: boolean
	): Promise<void> {
		await this.txHost.tx.avatars.update({
			where: {
				id: avatarId,
				deleted_at: null,
			},
			data: {
				active: isActive,
			},
		});
	}

	public async softDeleteByUserId(id: string): Promise<void> {
		await this.txHost.tx.users.update({
			data: {
				deleted_at: new Date(),
			},
			where: {
				id: id,
			},
		});
	}

	public async getForUpdate(userId: string): Promise<User | null> {
		const prismaUser = await this.txHost.tx.$queryRaw<PrismaUser[]>`
			SELECT * FROM users
			WHERE id = ${userId}::uuid AND deleted_at IS NULL
			FOR UPDATE
		`;

		if (prismaUser.length === 0) {
			return null;
		}

		const userWithAvatars = prismaUser[0];
		return await UserPrismaMapper.toEntity(userWithAvatars);
	}

	public async resetAllUsersBalance(): Promise<void> {
		await this.txHost.tx.users.updateMany({
			data: { balance: 0 },
		});
	}
}
