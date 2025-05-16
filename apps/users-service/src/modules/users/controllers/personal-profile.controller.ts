import {
	Body,
	Controller,
	Delete,
	FileTypeValidator,
	Get,
	HttpCode,
	Logger,
	MaxFileSizeValidator,
	NotFoundException,
	ParseFilePipe,
	Patch,
	Post,
	Req,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiCreatedResponse,
	ApiHeader,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Response } from "express";
import { RequiredHeaders } from "../../../../../../libs/shared/src/decorators/required-headers.decorator";
import { SecurityHeadersGuard } from "../../../../../../libs/shared/src/guards/security-headers.guard";
import { AccessTokenResponse } from "../../../common/dtos/tokens/access-token.response";
import { RequestWithContext, RequestWithUser } from "../../../common/types/common.types";
import { RedisService } from "../../../external/cache/redis/redis.service";
import { setCookieSwaggerHeader } from "../../../external/swagger/setCookieHeader.swagger";
import { AccessTokenGuard } from "../../auth/guards/access-token-auth.guard";
import { RemoveAvatarRequestDTO } from "../dtos/requests/remove-avatar.request.dto";
import { UpdatePersonalProfilePasswordRequestDTO } from "../dtos/requests/update-profile-password.request.dto";
import { UpdatePersonalProfileRequestDTO } from "../dtos/requests/update-profile.request.dto";
import { UserAvatarResponseDTO } from "../dtos/responses/user-avatar.response.dto";
import { UserPersonalProfileResponseDto } from "../dtos/responses/user-personal-profile.response.dto";
import { UsersService } from "../services/users.service";
import { CachedUser } from "../types/cached-user.types";

@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: "Пользователь не авторизован" })
@ApiTags("PersonalProfile as owner of profile")
@Controller("personalProfile")
@UseGuards(AccessTokenGuard)
export class PersonalProfileController {
	private readonly userKey = "user:";

	private LOGGER = new Logger(PersonalProfileController.name);

	constructor(
		private readonly usersService: UsersService,
		private readonly redisService: RedisService,
		private readonly configService: ConfigService
	) {}

	@ApiOperation({
		description: "Получение профиля пользователя",
		summary: "Получение профиля пользователя",
	})
	@ApiOkResponse({
		description: "Профиль пользователя был успешно получен",
		type: UserPersonalProfileResponseDto,
	})
	@ApiNotFoundResponse({
		description: "Пользователь не найден",
	})
	@HttpCode(200)
	@Get()
	public async getPersonalProfile(
		@Req() req: RequestWithUser
	): Promise<UserPersonalProfileResponseDto> {
		this.LOGGER.log("Getting personal profile for user %s", req.user.id);

		const cachedUser = await this.redisService.getJson<CachedUser>(
			`${this.userKey}${req.user.id}`,
			(key, value) => {
				if (key === "createdAt") {
					return new Date(value);
				}
				return value;
			}
		);

		if (cachedUser) {
			this.LOGGER.log("User with id %s was found in cache", req.user.id);
			return {
				id: cachedUser.id,
				login: cachedUser.login,
				email: cachedUser.email,
				about: cachedUser.about,
				age: cachedUser.age,
				createdAt: cachedUser.createdAt,
				activeAvatar: cachedUser.activeAvatar
					? {
							id: cachedUser.activeAvatar.id,
							userId: cachedUser.activeAvatar.userId,
							url: `${this.configService.get("S3_URL")}/${this.configService.get("S3_USER_AVATARS_BUCKET")}/${cachedUser.activeAvatar.path}`,
							active: cachedUser.activeAvatar.active,
							createdAt: cachedUser.activeAvatar.createdAt,
						}
					: null,
			};
		}

		const user = await this.usersService.getById(req.user.id);

		if (!user) {
			throw new NotFoundException("User not found");
		}

		await this.redisService.setJson<CachedUser>(
			`${this.userKey}${user.id}`,
			{
				id: user.id,
				login: user.login,
				email: user.email,
				about: user.about,
				age: user.age,
				createdAt: user.createdAt,
				activeAvatar: user.getActiveAvatar(),
			},
			30
		);
		this.LOGGER.log("User with id %s was set to cache", user.id);

		const activeAvatar = user.getActiveAvatar();
		return {
			id: user.id,
			login: user.login,
			email: user.email,
			about: user.about,
			age: user.age,
			createdAt: user.createdAt,
			activeAvatar: activeAvatar
				? {
						id: activeAvatar.id,
						userId: activeAvatar.userId,
						url: `${this.configService.get("S3_URL")}/${this.configService.get("S3_USER_AVATARS_BUCKET")}/${activeAvatar.path}`,
						active: activeAvatar.active,
						createdAt: activeAvatar.createdAt,
					}
				: null,
		};
	}

	@ApiOperation({
		description: "Получение баланса пользователя",
		summary: "Получение баланса пользователя",
	})
	@ApiOkResponse({
		description: "Баланс пользователя был успешно получен",
		type: Number,
	})
	@ApiNotFoundResponse({
		description: "Баланс пользователя или пользователь не найдены",
	})
	@HttpCode(200)
	@Get("balance")
	public async getPersonalProfileBalance(@Req() req: RequestWithUser) {
		this.LOGGER.log("Getting personal profile balance for user %s", req.user.id);
		const balance = await this.usersService.getUserBalance(req.user.id);

		return balance.toNumber();
	}

	@ApiOperation({
		description: "Обновление профиля пользователя",
		summary: "Обновление профиля пользователя",
	})
	@ApiOkResponse({
		description: "Профиль пользователя был успешно обновлен",
	})
	@ApiNotFoundResponse({
		description: "Пользователь не найден",
	})
	@HttpCode(200)
	@Patch()
	public async updatePersonalProfile(
		@Req() req: RequestWithUser,
		@Body() dto: UpdatePersonalProfileRequestDTO
	) {
		this.LOGGER.log("Updating personal profile for user %s", req.user.id);
		await this.redisService.del(`${this.userKey}${req.user.id}`);
		this.LOGGER.log("Personal profile for user %s was deleted from cache", req.user.id);
		await this.usersService.update({
			id: req.user.id,
			...dto,
		});
		this.LOGGER.log("Personal profile for user %s was updated", req.user.id);
	}

	@ApiOperation({
		description:
			"Обновление пароля пользователем. После обновления пароля, все предыдущие refreshToken'ы становятся недействительными",
		summary: "Обновление пароля пользователя",
	})
	@ApiHeader({
		name: "X-Fingerprint",
		description: "Уникальный идентификатор устройства",
		required: true,
		schema: { type: "string" },
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	@ApiOkResponse({
		description: "Пароль был успешно обновлен",
		headers: {
			...setCookieSwaggerHeader,
		},
		type: AccessTokenResponse,
	})
	@ApiBadRequestResponse({
		description: "Неправильный старый пароль",
	})
	@ApiNotFoundResponse({
		description: "Пользователь не найден",
	})
	@UseGuards(SecurityHeadersGuard)
	@RequiredHeaders(["X-Fingerprint", "User-Agent"])
	@HttpCode(200)
	@Post("update-password")
	public async updatePersonalProfilePassword(
		@Req() req: RequestWithUser & RequestWithContext,
		@Res({ passthrough: true }) res: Response,
		@Body() dto: UpdatePersonalProfilePasswordRequestDTO
	): Promise<AccessTokenResponse> {
		this.LOGGER.log("Updating personal profile password for user %s", req.user.id);
		const { refreshSession, accessToken } =
			await this.usersService.updatePersonalProfilePassword({
				oldPassword: dto.oldPassword,
				newPassword: dto.newPassword,
				userId: req.user.id,
				fingerprint: req.requestContext.fingerprint,
				ipAddress: req.requestContext.ipAddress,
				userAgent: req.requestContext.userAgent,
			});

		this.LOGGER.log("Personal profile password for user %s was updated", req.user.id);

		res.cookie("refreshToken", refreshSession.refreshToken, {
			httpOnly: true,
			maxAge: Number(refreshSession.expiresIn),
		});
		this.LOGGER.log("Refresh token for user %s was set", req.user.id);

		return {
			accessToken,
		};
	}

	@ApiOperation({
		description: "Удаление профиля пользователя (soft-delete)",
		summary: "Удаление профиля пользователя",
	})
	@ApiOkResponse({
		description: "Профиль пользователя был успешно удален",
	})
	@HttpCode(200)
	@Delete()
	public async deletePersonalProfile(@Req() req: RequestWithUser) {
		this.LOGGER.log("Deleting personal profile for user %s", req.user.id);

		await this.redisService.del(`${this.userKey}${req.user.id}`);

		this.LOGGER.log("Personal profile for user %s was deleted from cache", req.user.id);

		await this.usersService.deleteById(req.user.id);

		this.LOGGER.log("Personal profile for user %s was deleted", req.user.id);
	}

	@ApiOperation({
		description:
			"Загрузка аватара для профиля пользователя. Максимальный размер файла 10MB, разрешенные форматы: jpg, jpeg, png. Максимум 5 аватаров на одного пользователя",
		summary: "Загрузка аватара для профиля пользователя",
	})
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		description: "Аватар для профиля пользователя",
		schema: {
			type: "object",
			properties: {
				avatar: { type: "string", format: "binary" },
			},
		},
	})
	@ApiCreatedResponse({
		description: "Аватар был успешно загружен",
		type: UserAvatarResponseDTO,
	})
	@HttpCode(201)
	@Post("upload-avatar")
	@UseInterceptors(FileInterceptor("avatar"))
	public async uploadAvatar(
		@Req() req: RequestWithUser,
		@UploadedFile(
			new ParseFilePipe({
				validators: [
					new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
					new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
				],
			})
		)
		file: Express.Multer.File
	): Promise<UserAvatarResponseDTO> {
		this.LOGGER.log("Uploading avatar for user %s", req.user.id);
		const avatar = await this.usersService.uploadPersonalProfileAvatar({
			userId: req.user.id,
			file: file,
		});
		this.LOGGER.log("Avatar for user %s was uploaded", req.user.id);
		return avatar;
	}

	@ApiOperation({
		description: "Удаление аватара для профиля пользователя",
		summary: "Удаление аватара для профиля пользователя",
	})
	@ApiOkResponse({
		description: "Аватар был успешно удален",
	})
	@HttpCode(200)
	@Delete("avatar")
	public async softDeleteAvatar(
		@Req() req: RequestWithUser,
		@Body() dto: RemoveAvatarRequestDTO
	): Promise<void> {
		this.LOGGER.log("Deleting avatar for user %s", req.user.id);
		await this.usersService.softDeletePersonalProfileAvatar({
			userId: req.user.id,
			avatarId: dto.avatarId,
		});
		this.LOGGER.log("Avatar for user %s was deleted", req.user.id);
	}
}
