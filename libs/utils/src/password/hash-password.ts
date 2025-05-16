import argon2 from "argon2";

export async function hashPassword(password: string) {
	return await argon2.hash(password, {
		type: argon2.argon2id,
	});
}

export async function comparePassword(password: string, hashedPassword: string) {
	return await argon2.verify(hashedPassword, password);
}
