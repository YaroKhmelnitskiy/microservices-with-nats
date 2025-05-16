import {
	FindAllUsersWithPaginationInputDTO,
	FindAllUsersWithPaginationRepositoryResultDTO,
} from "../dtos/find-all-users-w-pagination.dto";
import { User } from "../entities/User";
import { UserAvatar } from "../entities/UserAvatar";

export interface UsersRepository {
	exists(userId: string): Promise<boolean>;
	findAllWithPagination(
		dto: FindAllUsersWithPaginationInputDTO
	): Promise<FindAllUsersWithPaginationRepositoryResultDTO>;
	getById(userId: string): Promise<User | null>;
	getByLogin(login: string): Promise<User | null>;
	getByEmail(email: string): Promise<User | null>;
	create(user: User): Promise<void>;
	update(user: User): Promise<void>;
	updateBalance(userId: string, balance: number): Promise<void>;
	softDeleteByUserId(userId: string): Promise<void>;
	findAvatarByUserId(userId: string): Promise<UserAvatar | null>;
	findActiveUserAvatarByUserId(userId: string): Promise<UserAvatar | null>;
	findUserAvatarsByUserIdSortedDesc(userId: string): Promise<UserAvatar[]>;
	createUserAvatar(avatar: UserAvatar): Promise<void>;
	softRemoveAvatarByAvatarId(avatarId: string): Promise<void>;
	updateAvatarActiveStatusByAvatarId(avatarId: string, isActive: boolean): Promise<void>;
	getForUpdate(userId: string): Promise<User | null>;
	getBalance(userId: string): Promise<number | null>;
	resetAllUsersBalance(): Promise<void>;
}
