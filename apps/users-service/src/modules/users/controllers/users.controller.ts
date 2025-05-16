import {
	Controller,
	Get,
	HttpCode,
	Logger,
	NotFoundException,
	Param,
	ParseUUIDPipe,
	Query,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import {
	PageMetaDto,
	PaginatedResponseDto,
} from "@shared/dtos/pagination/with-pagination.response.dto";
import { RedisService } from "../../../external/cache/redis/redis.service";
import { S3Service } from "../../../external/s3/s3.service";
import { ApiPaginatedOkResponse } from "../../../external/swagger/decorators/apiPaginatedOkResponse.swagger";
import { AccessTokenGuard } from "../../auth/guards/access-token-auth.guard";
import { UsersPaginatedRequestDTO } from "../dtos/requests/get-all-users.request.dto";
import { UserAvatarResponseDTO } from "../dtos/responses/user-avatar.response.dto";
import { UserPublicResponseDTO } from "../dtos/responses/user-public.response.dto";
import { AvatarMapper } from "../mappers/avatar.mapper";
import { UsersService } from "../services/users.service";
import { CachedUser } from "../types/cached-user.types";

@Controller("users")
export class UsersController {
	private readonly userKey = "user:";
	private LOGGER = new Logger(UsersController.name);

	constructor(
		private readonly usersService: UsersService,
		private readonly redisService: RedisService,
		private readonly s3AvatarsService: S3Service
	) {}

	@ApiOperation({
		summary: "Получить всех пользователей с пагинацией",
		description: "Получить всех пользователей с пагинацией",
	})
	@ApiPaginatedOkResponse(UserPublicResponseDTO)
	@ApiBearerAuth()
	@HttpCode(200)
	@UseGuards(AccessTokenGuard)
	@Get()
	public async paginate(
		@Query() queryDto: UsersPaginatedRequestDTO
	): Promise<PaginatedResponseDto<UserPublicResponseDTO>> {
		this.LOGGER.log({ queryDto }, "Paginating users");
		const users = await this.usersService.paginate(queryDto);
		const pageMetaDto = new PageMetaDto({ itemCount: users.total, pageOptionsDto: queryDto });

		return new PaginatedResponseDto(users.data, pageMetaDto);
	}

	@ApiOperation({
		summary: "Получить профиль пользователя",
		description: "Получить профиль пользователя",
	})
	@ApiOkResponse({
		type: UserPublicResponseDTO,
		description: "Успешно получен профиль пользователя",
	})
	@ApiNotFoundResponse({ description: "Пользователь не найден" })
	@ApiBearerAuth()
	@HttpCode(200)
	@UseGuards(AccessTokenGuard)
	@Get(":id")
	public async getUser(
		@Param("id", ParseUUIDPipe) userId: string
	): Promise<UserPublicResponseDTO> {
		this.LOGGER.log("Getting user with id %s", userId);

		const cachedUser = await this.redisService.getJson<CachedUser>(
			`${this.userKey}${userId}`,
			(key, value) => {
				if (key === "createdAt") {
					return new Date(value);
				}

				return value;
			}
		);

		if (cachedUser) {
			this.LOGGER.log("User with id %s was found in cache", userId);
			return {
				id: cachedUser.id,
				age: cachedUser.age,
				about: cachedUser.about,
				login: cachedUser.login,
				activeAvatar: cachedUser.activeAvatar
					? AvatarMapper.toResponseDTO(
							cachedUser.activeAvatar,
							this.s3AvatarsService.getFileUrl(cachedUser.activeAvatar.path)
						)
					: null,
			};
		}

		const user = await this.usersService.getById(userId);

		if (!user) {
			throw new NotFoundException("User not found");
		}

		await this.redisService.setJson<CachedUser>(
			`${this.userKey}${user.id}`,
			{
				id: user.id,
				age: user.age,
				about: user.about,
				login: user.login,
				activeAvatar: user.getActiveAvatar(),
				email: user.email,
				createdAt: user.createdAt,
			},
			30
		);
		this.LOGGER.log("User with id %s was set to cache", user.id);

		const activeAvatar = user.getActiveAvatar();
		return {
			id: user.id,
			age: user.age,
			about: user.about,
			login: user.login,
			activeAvatar: activeAvatar
				? AvatarMapper.toResponseDTO(
						activeAvatar,
						this.s3AvatarsService.getFileUrl(activeAvatar.path)
					)
				: null,
		};
	}

	@ApiOperation({
		summary: "Получить активный аватар пользователя",
		description: "Получить активный аватар пользователя",
	})
	@ApiOkResponse({
		type: UserAvatarResponseDTO,
		description: "Успешно получен активный аватар пользователя",
	})
	@ApiNotFoundResponse({ description: "Аватар не найден" })
	@ApiBearerAuth()
	@HttpCode(200)
	@UseGuards(AccessTokenGuard)
	@Get(":id/active-avatar")
	public async getUserActiveAvatarUrl(
		@Param("id", ParseUUIDPipe) userId: string
	): Promise<UserAvatarResponseDTO> {
		this.LOGGER.log("Getting user active avatar for user %s", userId);
		const avatar = await this.usersService.getActiveUserAvatar(userId);

		if (!avatar) {
			throw new NotFoundException("Avatar not found");
		}

		this.LOGGER.log({ avatar }, "User active avatar found");
		return avatar;
	}

	@ApiOperation({
		summary: "Получить все аватары пользователя",
		description: "Получить все аватары пользователя",
	})
	@ApiOkResponse({
		type: [UserAvatarResponseDTO],
		description: "Успешно получены все аватары пользователя",
	})
	@ApiBearerAuth()
	@HttpCode(200)
	@UseGuards(AccessTokenGuard)
	@Get(":id/avatars")
	public async getAllUserAvatarsUrl(
		@Param("id", ParseUUIDPipe) userId: string
	): Promise<UserAvatarResponseDTO[]> {
		this.LOGGER.log("Getting all user avatars for user %s", userId);
		return await this.usersService.getAllUserAvatars(userId);
	}
}
