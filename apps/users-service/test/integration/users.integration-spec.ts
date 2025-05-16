import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { Prisma, PrismaClient } from "@prisma/users-client";
import { PaginatedResponseDto } from "@shared/dtos/pagination/with-pagination.response.dto";
import assert from "node:assert";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { initMainConfig } from "../../src/main.config";
import { UserPublicResponseDTO } from "../../src/modules/users/dtos/responses/user-public.response.dto";

describe("Users (e2e)", () => {
	let app: INestApplication;

	let prisma: PrismaClient;
	let token: string;

	const tableNames = Object.values(Prisma.ModelName);

	async function refreshDatabase() {
		for (const tableName of tableNames) {
			await prisma.$queryRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
		}
	}

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		initMainConfig(app);

		prisma = new PrismaClient();
		await prisma.$connect();
		await app.init();
	});

	afterAll(async () => {
		await refreshDatabase();
		await prisma.$disconnect();
		await app.close();
	});

	describe("GET /api/users", () => {
		const usersSortedByUuid = [
			{
				id: "d1c6b93a-6c92-4a84-a56d-e636c968f4c9",
				login: "johndoe",
				email: "john.doe@example.com",
				password: "hashed_password_1",
				age: 28,
				about: "Software engineer with 5 years of experience",
			},
			{
				id: "b9c42c25-4972-4b10-a255-d8b0ef784db6",
				login: "janedoe",
				email: "jane.doe@example.com",
				password: "hashed_password_2",
				age: 32,
				about: "UI/UX designer passionate about user experience",
			},
			{
				id: "e83f91c7-37d4-4b0f-b078-4a6685d73956",
				login: "mikesmith",
				email: "mike.smith@example.com",
				password: "hashed_password_3",
				age: 24,
				about: null,
			},
			{
				id: "7fcd9c7f-eda5-4f56-ae6d-f8e25d3c70c0",
				login: "sarahjones",
				email: "sarah.jones@example.com",
				password: "hashed_password_4",
				age: 41,
				about: "Product manager with expertise in agile methodologies",
			},
			{
				id: "a2e31796-75f4-4f53-bec4-122b5dbeacd2",
				login: "davidwilson",
				email: "david.wilson@example.com",
				password: "hashed_password_5",
				age: 36,
				about: null,
			},
		].toSorted((user1, user2) => {
			if (user1.id < user2.id) return -1;
			if (user1.id > user2.id) return 1;
			return 0;
		});
		const responseUsersSortedByUuid = usersSortedByUuid.map((user) => ({
			id: user.id,
			login: user.login,
			age: user.age,
			about: user.about,
		}));

		beforeAll(async () => {
			await prisma.users.createMany({
				data: usersSortedByUuid,
			});
			token = await request(app.getHttpServer())
				.post("/api/auth/login")
				.send({
					login: usersSortedByUuid[0].login,
					password: usersSortedByUuid[0].password,
					fingerprint: "random",
				})
				.then((res) => res.body.accessToken);
		});

		afterAll(async () => {
			await refreshDatabase();
		});

		it("should return all users without any filters with 200", async () => {
			const response = await request(app.getHttpServer())
				.get("/api/users")
				.set("Authorization", "Bearer " + token)
				.expect(200);

			expect(response.body).toMatchObject({
				data: responseUsersSortedByUuid,
				meta: {
					hasNextPage: false,
					hasPreviousPage: false,
					itemCount: 5,
					page: 1,
					take: 10,
					pageCount: 1,
				},
			} as PaginatedResponseDto<UserPublicResponseDTO>);
		});

		it("should return only one user when ?take=1", async () => {
			const response = await request(app.getHttpServer())
				.get("/api/users")
				.query({ take: 1 })
				.set("Authorization", "Bearer " + token)
				.expect(200);

			expect(response.body).toMatchObject({
				data: [responseUsersSortedByUuid[0]],
				meta: {
					hasNextPage: true,
					hasPreviousPage: false,
					itemCount: 5,
					page: 1,
					take: 1,
					pageCount: 5,
				},
			} as PaginatedResponseDto<UserPublicResponseDTO>);
		});

		it("should return 2nd page with ?take=1&page=2", async () => {
			const response = await request(app.getHttpServer())
				.get("/api/users")
				.query({ take: 1, page: 2 })
				.set("Authorization", "Bearer " + token)
				.expect(200);

			expect(response.body).toMatchObject({
				data: [responseUsersSortedByUuid[1]],
				meta: {
					hasNextPage: true,
					hasPreviousPage: true,
					itemCount: 5,
					page: 2,
					take: 1,
					pageCount: 5,
				},
			} as PaginatedResponseDto<UserPublicResponseDTO>);
		});

		it("should return last page with ?take=1&page=5", async () => {
			const response = await request(app.getHttpServer())
				.get("/api/users")
				.query({ take: 1, page: 5 })
				.set("Authorization", "Bearer " + token)
				.expect(200);

			expect(response.body).toMatchObject({
				data: [responseUsersSortedByUuid[4]],
				meta: {
					hasNextPage: false,
					hasPreviousPage: true,
					itemCount: 5,
					page: 5,
					take: 1,
					pageCount: 5,
				},
			} as PaginatedResponseDto<UserPublicResponseDTO>);
		});

		it("should return users with search ?login=johndoe", async () => {
			const response = await request(app.getHttpServer())
				.get("/api/users")
				.query({ login: "johndoe" })
				.set("Authorization", "Bearer " + token)
				.expect(200);

			expect(response.body).toMatchObject({
				data: [responseUsersSortedByUuid.find((user) => user.login === "johndoe")],
				meta: {
					hasNextPage: false,
					hasPreviousPage: false,
					itemCount: 1,
					page: 1,
					take: 10,
					pageCount: 1,
				},
			} as PaginatedResponseDto<UserPublicResponseDTO>);
		});

		it("should return 400 if ?take= is not number", async () => {
			await request(app.getHttpServer())
				.get("/api/users")
				.query({ take: "notnumber" })
				.set("Authorization", "Bearer " + token)
				.expect(400);
		});

		it("should return 400 if ?page= is not number", async () => {
			await request(app.getHttpServer())
				.get("/api/users")
				.query({ page: "notnumber" })
				.set("Authorization", "Bearer " + token)
				.expect(400);
		});

		it("should return 401 if not authorized", async () => {
			await request(app.getHttpServer()).get("/api/users").expect(401);
		});
	});

	describe("GET /api/users/:id", () => {
		const users = [
			{
				id: "d1c6b93a-6c92-4a84-a56d-e636c968f4c9",
				login: "johndoe",
				email: "john.doe@example.com",
				password: "hashed_password_1",
				age: 28,
				about: "Software engineer with 5 years of experience",
			},
			{
				id: "b9c42c25-4972-4b10-a255-d8b0ef784db6",
				login: "janedoe",
				email: "jane.doe@example.com",
				password: "hashed_password_2",
				age: 32,
				about: "UI/UX designer passionate about user experience",
			},
			{
				id: "e83f91c7-37d4-4b0f-b078-4a6685d73956",
				login: "mikesmith",
				email: "mike.smith@example.com",
				password: "hashed_password_3",
				age: 24,
				about: null,
			},
			{
				id: "7fcd9c7f-eda5-4f56-ae6d-f8e25d3c70c0",
				login: "sarahjones",
				email: "sarah.jones@example.com",
				password: "hashed_password_4",
				age: 41,
				about: "Product manager with expertise in agile methodologies",
			},
			{
				id: "a2e31796-75f4-4f53-bec4-122b5dbeacd2",
				login: "davidwilson",
				email: "david.wilson@example.com",
				password: "hashed_password_5",
				age: 36,
				about: null,
			},
		];

		beforeAll(async () => {
			await prisma.users.createMany({
				data: users,
			});
			token = await request(app.getHttpServer())
				.post("/api/auth/login")
				.send({
					login: users[0].login,
					password: users[0].password,
					fingerprint: "random",
				})
				.then((res) => {
					assert(typeof res.body.accessToken === "string");
					return res.body.accessToken;
				});
		});

		afterAll(async () => {
			await refreshDatabase();
		});

		it("should return user with 200", async () => {
			const response = await request(app.getHttpServer())
				.get("/api/users/a2e31796-75f4-4f53-bec4-122b5dbeacd2")
				.set("Authorization", "Bearer " + token)
				.expect(200);

			expect(response.body).toMatchObject({
				id: "a2e31796-75f4-4f53-bec4-122b5dbeacd2",
				login: "davidwilson",
				age: 36,
				about: null,
			});
		});

		it("should return 404", async () => {
			await request(app.getHttpServer())
				.get("/api/users/a2e31796-75f4-4f53-bec4-424b5dbeacd2")
				.set("Authorization", "Bearer " + token)
				.expect(404);
		});

		it("should return 400 if id is not uuid", async () => {
			await request(app.getHttpServer())
				.get("/api/users/notuuid")
				.set("Authorization", "Bearer " + token)
				.expect(400);

			await request(app.getHttpServer())
				.get("/api/users/10032")
				.set("Authorization", "Bearer " + token)
				.expect(400);
		});

		it("should return 401 if not authorized", async () => {
			await request(app.getHttpServer()).get("/api/users/a2e").expect(401);
		});
	});
});
