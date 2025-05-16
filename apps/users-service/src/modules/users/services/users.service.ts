import { Transactional } from "@nestjs-cls/transactional";
import { TransactionalAdapterPrisma } from "@nestjs-cls/transactional-adapter-prisma";
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PaginationOrder } from "@shared/dtos/pagination/page-options.request.dto";
import { comparePassword, hashPassword } from "@utils";
import { randomUUID } from "node:crypto";
import { AccessRefreshTokens } from "../../../common/types/common.types";
import { Money } from "../../../core/value-objects/Money";
import { S3Service } from "../../../external/s3/s3.service";
import { TokenService } from "../../token/services/token.service";
import { FindAllUsersWithPaginationOutputDTO } from "../dtos/find-all-users-w-pagination.dto";
import { CreateUserRequestDTO } from "../dtos/requests/create-user.request.dto";
import { UsersPaginatedRequestDTO } from "../dtos/requests/get-all-users.request.dto";
import { RemoveAvatarRequestDTO } from "../dtos/requests/remove-avatar.request.dto";
import { UpdatePersonalProfilePasswordRequestDTO } from "../dtos/requests/update-profile-password.request.dto";
import { UpdateUserRequestDTO } from "../dtos/requests/update-user.request.dto";
import { UserAvatarResponseDTO } from "../dtos/responses/user-avatar.response.dto";
import { UploadAvatarDTO } from "../dtos/upload-avatar.dto";
import { User } from "../entities/User";
import { UserAvatar } from "../entities/UserAvatar";
import { UsersRepositoryImpl } from "../external/prisma/users.repository.impl";
import { AvatarMapper } from "../mappers/avatar.mapper";
import { UsersRepository } from "../repositories/users.repository";

@Injectable()
export class UsersService {
	private readonly LOGGER = new Logger(UsersService.name);

	constructor(
		@Inject(UsersRepositoryImpl) private readonly usersRepository: UsersRepository,
		private readonly tokenService: TokenService,
		private readonly S3AvatarsService: S3Service
	) {}

	public async paginate(
		dto: UsersPaginatedRequestDTO
	): Promise<FindAllUsersWithPaginationOutputDTO> {
		this.LOGGER.log(
			{
				dto: {
					login: dto.login,
					take: dto.take,
					skip: dto.skip,
					order: dto.order,
				},
			},
			"Attempting to paginate users"
		);

		const users = await this.usersRepository.findAllWithPagination({
			login: dto.login,
			take: dto.take!,
			skip: dto.skip,
			orderBy: dto.order === PaginationOrder.ASC ? "asc" : "desc",
		});

		this.LOGGER.debug(
			{
				total: users.total,
				count: users.data.length,
			},
			"Users paginated successfully"
		);

		return {
			data: users.data.map((user) => ({
				...user,
				activeAvatar: user.activeAvatar
					? AvatarMapper.toResponseDTO(
							user.activeAvatar,
							this.S3AvatarsService.getFileUrl(user.activeAvatar.path)
						)
					: null,
			})),
			total: users.total,
		};
	}

	@Transactional()
	public async deleteById(id: string) {
		this.LOGGER.log(
			{
				userId: id,
			},
			"Attempting to delete user"
		);

		await this.usersRepository.softDeleteByUserId(id);

		this.LOGGER.log(
			{
				userId: id,
			},
			"User deleted successfully"
		);

		await this.tokenService.deleteAllRefreshSessionsByUserId(id);

		this.LOGGER.debug(
			{
				userId: id,
			},
			"All refresh sessions deleted for user"
		);
	}

	public async checkIfExists(userId: string) {
		return await this.usersRepository.exists(userId);
	}

	public async getById(id: string): Promise<User | null> {
		this.LOGGER.debug(
			{
				userId: id,
			},
			"Attempting to get user by id"
		);

		const user = await this.usersRepository.getById(id);

		if (!user) {
			this.LOGGER.debug(
				{
					userId: id,
				},
				"User not found"
			);
			return null;
		}

		this.LOGGER.debug(
			{
				user: {
					id: user.id,
					login: user.login,
					email: user.email,
				},
			},
			"User found successfully"
		);

		return user;
	}

	public async getByIdForUpdate(id: string): Promise<User | null> {
		const user = await this.usersRepository.getForUpdate(id);

		if (!user) {
			return null;
		}

		return user;
	}

	public async getByEmail(email: string) {
		return await this.usersRepository.getByEmail(email);
	}

	public async getByLogin(login: string): Promise<User | null> {
		return await this.usersRepository.getByLogin(login);
	}

	public async getUserBalance(userId: string): Promise<Money> {
		this.LOGGER.debug(
			{
				userId,
			},
			"Attempting to get user balance"
		);

		const balance = await this.usersRepository.getBalance(userId);

		if (balance === null) {
			this.LOGGER.warn(
				{
					userId,
				},
				"User balance not found"
			);
			throw new NotFoundException("User balance not found");
		}

		this.LOGGER.debug(
			{
				userId,
				balance: balance,
			},
			"User balance retrieved successfully"
		);

		return Money.fromNumber(balance);
	}

	public async create(dto: CreateUserRequestDTO): Promise<User> {
		this.LOGGER.log(
			{
				login: dto.login,
				email: dto.email,
				age: dto.age,
			},
			"Attempting to create new user"
		);

		const user = await User.create({
			login: dto.login,
			password: await hashPassword(dto.password),
			email: dto.email,
			about: dto.about,
			age: dto.age,
			avatars: [],
		});

		await this.usersRepository.create(user);

		this.LOGGER.log(
			{
				userId: user.id,
				login: user.login,
				email: user.email,
			},
			"User created successfully"
		);

		return user;
	}

	public async update(dto: UpdateUserRequestDTO): Promise<void> {
		this.LOGGER.log(
			{
				userId: dto.id,
				updates: {
					email: dto.email,
					login: dto.login,
					age: dto.age,
					about: dto.about,
				},
			},
			"Attempting to update user"
		);

		const user = await this.usersRepository.getById(dto.id);

		if (!user) {
			this.LOGGER.warn(
				{
					userId: dto.id,
				},
				"User not found for update"
			);
			throw new NotFoundException("User not found");
		}

		if (dto.email) await user.setEmail(dto.email);
		if (dto.login) await user.setLogin(dto.login);
		if (dto.age) await user.setAge(dto.age);
		if (dto.about) await user.setAbout(dto.about);

		await this.usersRepository.update(user);

		this.LOGGER.log(
			{
				userId: dto.id,
				updates: {
					email: dto.email,
					login: dto.login,
					age: dto.age,
					about: dto.about,
				},
			},
			"User updated successfully"
		);
	}

	@Transactional<TransactionalAdapterPrisma>({
		isolationLevel: "RepeatableRead",
	})
	public async updateBalance(userId: string, balance: Money): Promise<void> {
		this.LOGGER.log(
			{
				userId,
				balance: balance.toNumber(),
			},
			"Attempting to update user balance"
		);

		await this.usersRepository.updateBalance(userId, balance.toNumber());

		this.LOGGER.debug(
			{
				userId,
				balance: balance.toNumber(),
			},
			"User balance updated successfully"
		);
	}

	@Transactional()
	public async updatePersonalProfilePassword(
		dto: UpdatePersonalProfilePasswordRequestDTO & {
			userId: string;
			fingerprint: string;
			ipAddress: string;
			userAgent: string;
		}
	): Promise<AccessRefreshTokens> {
		this.LOGGER.log(
			{
				userId: dto.userId,
			},
			"Attempting to update personal profile password"
		);

		const user = await this.usersRepository.getById(dto.userId);

		if (!user) {
			this.LOGGER.warn(
				{
					userId: dto.userId,
				},
				"User not found for password update"
			);
			throw new NotFoundException("User not found");
		}

		if (!(await comparePassword(dto.oldPassword, user.password))) {
			this.LOGGER.warn(
				{
					userId: dto.userId,
				},
				"Incorrect old password provided"
			);
			throw new BadRequestException("Old password is incorrect");
		}

		await user.setPassword(await hashPassword(dto.newPassword));
		await this.usersRepository.update(user);

		this.LOGGER.log(
			{
				userId: dto.userId,
			},
			"Personal profile password updated successfully"
		);

		await this.tokenService.deleteAllRefreshSessionsByUserId(dto.userId);

		this.LOGGER.debug(
			{
				userId: dto.userId,
			},
			"All refresh sessions deleted for user"
		);

		return await this.tokenService.createAccessRefreshTokens({
			userId: user.id,
			email: user.email,
			login: user.login,
			fingerprint: dto.fingerprint,
			ipAddress: dto.ipAddress,
			userAgent: dto.userAgent,
		});
	}

	public async getAllUserAvatars(userId: string): Promise<UserAvatarResponseDTO[]> {
		this.LOGGER.debug(
			{
				userId,
			},
			"Attempting to get all user avatars"
		);

		const avatars = await this.usersRepository.findUserAvatarsByUserIdSortedDesc(userId);

		this.LOGGER.debug(
			{
				userId,
				count: avatars.length,
			},
			"User avatars retrieved successfully"
		);

		return avatars.map((avatar) =>
			AvatarMapper.toResponseDTO(avatar, this.S3AvatarsService.getFileUrl(avatar.path))
		);
	}

	public async getActiveUserAvatar(userId: string): Promise<UserAvatarResponseDTO | null> {
		this.LOGGER.debug(
			{
				userId,
			},
			"Attempting to get active user avatar"
		);

		const avatar = await this.usersRepository.findActiveUserAvatarByUserId(userId);

		if (!avatar) {
			this.LOGGER.debug(
				{
					userId,
				},
				"No active avatar found for user"
			);
			return null;
		}

		this.LOGGER.debug(
			{
				userId,
				avatarId: avatar.id,
			},
			"Active user avatar retrieved successfully"
		);

		return AvatarMapper.toResponseDTO(avatar, this.S3AvatarsService.getFileUrl(avatar.path));
	}

	@Transactional()
	public async uploadPersonalProfileAvatar(dto: UploadAvatarDTO): Promise<UserAvatarResponseDTO> {
		this.LOGGER.log(
			{
				userId: dto.userId,
			},
			"Attempting to upload personal profile avatar"
		);

		const avatars = await this.usersRepository.findUserAvatarsByUserIdSortedDesc(dto.userId);

		if (avatars.length >= 5) {
			this.LOGGER.warn(
				{
					userId: dto.userId,
					currentCount: avatars.length,
					maxCount: 5,
				},
				"User attempted to upload more than maximum allowed avatars"
			);
			throw new BadRequestException("You can't upload more than 5 avatars");
		}

		const id = randomUUID();
		const uploadKey = `${dto.userId}/${id}`;

		const currentActiveAvatar = avatars.find((avatar) => avatar.active);
		if (currentActiveAvatar) {
			this.LOGGER.debug(
				{
					userId: dto.userId,
					avatarId: currentActiveAvatar.id,
				},
				"Updating previous avatar active status"
			);
			await this.usersRepository.updateAvatarActiveStatusByAvatarId(
				currentActiveAvatar.id,
				false
			);
		}

		const avatar = await UserAvatar.create({
			id: id,
			path: uploadKey,
			userId: dto.userId,
			active: true,
		});

		await this.usersRepository.createUserAvatar(avatar);

		const { url } = await this.S3AvatarsService.uploadFile({
			Key: uploadKey,
			Body: dto.file.buffer,
			ContentType: dto.file.mimetype,
			ACL: "public-read",
		});

		this.LOGGER.log(
			{
				userId: dto.userId,
				avatarId: avatar.id,
			},
			"Personal profile avatar uploaded successfully"
		);

		return AvatarMapper.toResponseDTO(avatar, url);
	}

	@Transactional()
	public async softDeletePersonalProfileAvatar(dto: RemoveAvatarRequestDTO & { userId: string }) {
		this.LOGGER.log(
			{
				userId: dto.userId,
				avatarId: dto.avatarId,
			},
			"Attempting to soft delete personal profile avatar"
		);

		await this.usersRepository.softRemoveAvatarByAvatarId(dto.avatarId);

		// ищем последний аватар и делаем его активным
		const avatars = await this.usersRepository.findUserAvatarsByUserIdSortedDesc(dto.userId);
		if (avatars.length !== 0 && !avatars.some((avatar) => avatar.active)) {
			await this.usersRepository.updateAvatarActiveStatusByAvatarId(avatars[0].id, true);
		}

		this.LOGGER.log(
			{
				userId: dto.userId,
				avatarId: dto.avatarId,
			},
			"Personal profile avatar soft deleted successfully"
		);
	}

	@Transactional()
	public async resetAllUsersBalance() {
		this.LOGGER.log(
			{
				timestamp: new Date().toISOString(),
			},
			"Attempting to reset all users balance"
		);

		await this.usersRepository.resetAllUsersBalance();

		this.LOGGER.log(
			{
				timestamp: new Date().toISOString(),
			},
			"All users balance reset successfully"
		);
	}
}
