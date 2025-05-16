import argon2 from "argon2";
import { randomUUID } from "crypto";
import "reflect-metadata";
import { comparePassword } from "../../../../../../libs/utils/src/password/hash-password";
import { User, UserProps } from "./User";

describe("User", () => {
	let user: User;

	const createValidProps = () => ({
		login: "testlogin",
		email: "email@test.com",
		password: "password",
		age: 30,
		avatars: [],
	});

	describe("Creating valid user", () => {
		it("should create a valid user without optional fields", async () => {
			const props = createValidProps();
			user = await User.create(props);

			expect(user).toBeInstanceOf(User);
			expect(user.login).toBe(props.login);
			expect(user.email).toBe(props.email);
			expect(user.age).toBe(props.age);
			expect(user.about).toBeNull();
			expect(user.createdAt).toBeNull();
			expect(user.password).not.toBe(props.password); // hashed password
			await expect(argon2.verify(user.password, props.password)).resolves.toBe(true); // check that password is hashed with Argon2
		});

		it("should create a valid user with optional fields", async () => {
			const props: UserProps = {
				...createValidProps(),
				id: randomUUID(),
				password: "password",
				about: "about",
				createdAt: new Date(),
			};
			user = await User.create(props);

			expect(user).toBeInstanceOf(User);
			expect(user.id).toBe(props.id);
			expect(user.login).toBe(props.login);
			expect(user.email).toBe(props.email);
			expect(user.age).toBe(props.age);
			expect(user.about).toBe(props.about);
			expect(user.createdAt).toBe(props.createdAt);
			expect(user.password).not.toBe(props.password); // hashed password equal to the one passed
			await expect(argon2.verify(user.password, props.password)).resolves.toBe(true); // check that password is hashed with Argon2
		});

		it("shouldn't hash password if it already hashed", async () => {
			const nonhashedPassword = "password";
			const props: UserProps = {
				...createValidProps(),
				password: await argon2.hash(nonhashedPassword),
			};
			user = await User.create(props);

			expect(user.password).toBe(props.password); // hashed password equal to the one passed
			await expect(argon2.verify(user.password, nonhashedPassword)).resolves.toBe(true); // check that password is hashed with Argon2
		});
	});

	describe("id validation", () => {
		it("should reject with validation error for id not uuid", async () => {
			await expect(User.create({ ...createValidProps(), id: "not-uuid" })).rejects.toThrow();
		});
	});

	describe("login validation", () => {
		it("should reject with validation error for empty login", async () => {
			await expect(User.create({ ...createValidProps(), login: "" })).rejects.toThrow();
		});

		it("should reject with validation error for login with length less than 3", async () => {
			await expect(User.create({ ...createValidProps(), login: "l" })).rejects.toThrow();
		});

		it("should reject with validation error for login with spaces", async () => {
			await expect(
				User.create({ ...createValidProps(), login: "login with spaces" })
			).rejects.toThrow();
		});

		it("should reject with validation error for login with special characters", async () => {
			await expect(User.create({ ...createValidProps(), login: "login!" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login?" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login+" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login=" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login*" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login&" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login%" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login$" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login@" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login#" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login^" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login(" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login)" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login[" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login]" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login{" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login}" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login<" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login>" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login|" })).rejects.toThrow();
			await expect(
				User.create({ ...createValidProps(), login: "login\\" })
			).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login/" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login`" })).rejects.toThrow();
			await expect(User.create({ ...createValidProps(), login: "login~" })).rejects.toThrow();
		});

		it("should reject with validation error for login with length more than 255", async () => {
			await expect(
				User.create({ ...createValidProps(), login: "l".repeat(256) })
			).rejects.toThrow();
		});
	});

	describe("email validation", () => {
		it("should reject with validation error for empty email", async () => {
			await expect(User.create({ ...createValidProps(), email: "" })).rejects.toThrow();
		});

		it("should reject with validation error for invalid email", async () => {
			await expect(
				User.create({ ...createValidProps(), email: "invalid-email" })
			).rejects.toThrow();
			await expect(
				User.create({ ...createValidProps(), email: "invalid@" })
			).rejects.toThrow();
			await expect(
				User.create({ ...createValidProps(), email: "@invalid.com" })
			).rejects.toThrow();
		});

		it("should reject with validation error for email with length more than 255", async () => {
			const longEmail = `${"a".repeat(245)}@test.com`;
			await expect(
				User.create({ ...createValidProps(), email: longEmail })
			).rejects.toThrow();
		});
	});

	describe("password validation", () => {
		it("should reject with validation error for empty password", async () => {
			await expect(User.create({ ...createValidProps(), password: "" })).rejects.toThrow();
		});

		it("should reject with validation error for password with length more than 255", async () => {
			await expect(
				User.create({ ...createValidProps(), password: "p".repeat(256) })
			).rejects.toThrow();
		});
	});

	describe("age validation", () => {
		it("should reject with validation error for age less than 0", async () => {
			await expect(User.create({ ...createValidProps(), age: -1 })).rejects.toThrow();
		});

		it("should reject with validation error for age more than 150", async () => {
			await expect(User.create({ ...createValidProps(), age: 151 })).rejects.toThrow();
		});
	});

	describe("about validation", () => {
		it("should not reject with validation error for empty about", async () => {
			await expect(User.create({ ...createValidProps(), about: "" })).resolves.toBeDefined();
		});

		it("should not reject with validation error for about with about === null", async () => {
			const user = await User.create({ ...createValidProps(), about: null });
			expect(user).toBeDefined();
			expect(user.about).toBeNull();
		});

		it("should reject with validation error for about with length more than 1000", async () => {
			await expect(
				User.create({ ...createValidProps(), about: "a".repeat(1001) })
			).rejects.toThrow();
		});
	});

	describe("createdAt validation", () => {
		it("should not reject with validation error for createdAt === null", async () => {
			const user = await User.create({ ...createValidProps(), createdAt: null });
			expect(user).toBeDefined();
			expect(user.createdAt).toBeNull();
		});

		it("should reject with validation error for createdAt not Date", async () => {
			await expect(
				User.create({ ...createValidProps(), createdAt: "not-date" as any })
			).rejects.toThrow();
		});
	});

	describe("updatedAt validation", () => {
		it("should not reject with validation error for updatedAt === null", async () => {
			const user = await User.create({ ...createValidProps(), updatedAt: null });
			expect(user).toBeDefined();
			expect(user.updatedAt).toBeNull();
		});

		it("should reject with validation error for updatedAt not Date", async () => {
			await expect(
				User.create({ ...createValidProps(), updatedAt: "not-date" as any })
			).rejects.toThrow();
		});
	});

	describe("deletedAt validation", () => {
		it("should not reject with validation error for deletedAt === null", async () => {
			const user = await User.create({ ...createValidProps(), deletedAt: null });
			expect(user).toBeDefined();
			expect(user.deletedAt).toBeNull();
		});

		it("should reject with validation error for deletedAt not Date", async () => {
			await expect(
				User.create({ ...createValidProps(), deletedAt: "not-date" as any })
			).rejects.toThrow();
		});
	});

	describe("password methods", () => {
		beforeEach(async () => {
			user = await User.create(createValidProps());
		});

		it("should return hashed password", async () => {
			const password = "password";
			await user.setPassword(password);

			expect(user.password).not.toBe(password);
			await expect(argon2.verify(user.password, password)).resolves.toBe(true);
		});

		it("should return hashed password when creating User", async () => {
			const password = "password";
			const props: UserProps = {
				...createValidProps(),
				password,
			};
			user = await User.create(props);

			expect(user.password).not.toBe(password);
			await expect(argon2.verify(user.password, password)).resolves.toBe(true);
		});

		it("shouldn't hash password if it already hashed", async () => {
			const nonhashedPassword = "password";
			const hashedPassword = await argon2.hash(nonhashedPassword);
			await user.setPassword(hashedPassword);

			expect(user.password).toBe(hashedPassword);
			await expect(argon2.verify(user.password, nonhashedPassword)).resolves.toBe(true);
		});

		it("shouldn't hash password if it already hashed when creating User", async () => {
			const nonhashedPassword = "password";
			const hashedPassword = await argon2.hash(nonhashedPassword);
			const props: UserProps = {
				...createValidProps(),
				password: hashedPassword,
			};
			user = await User.create(props);

			expect(user.password).toBe(hashedPassword);
			await expect(argon2.verify(user.password, nonhashedPassword)).resolves.toBe(true);
		});

		it("should compare password", async () => {
			const password = "password";
			await user.setPassword(password);

			await expect(comparePassword(password, user.password)).resolves.toBe(true);
			await expect(comparePassword("wrong-password", user.password)).resolves.toBe(false);
		});
	});

	describe("setters", () => {
		beforeEach(async () => {
			user = await User.create(createValidProps());
		});

		it("should set age", async () => {
			const age = 30;
			await user.setAge(age);

			expect(user.age).toBe(age);
		});

		it("should set about", async () => {
			const about = "about";
			await user.setAbout(about);

			expect(user.about).toBe(about);
		});

		it("should set login", async () => {
			const login = "newlogin";
			await user.setLogin(login);

			expect(user.login).toBe(login);
		});

		it("should set email", async () => {
			const email = "newemail@test.com";
			await user.setEmail(email);

			expect(user.email).toBe(email);
		});
	});
});
