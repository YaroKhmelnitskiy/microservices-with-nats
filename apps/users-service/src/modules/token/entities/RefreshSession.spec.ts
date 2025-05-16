import { randomUUID } from "crypto";
import { RefreshSession } from "./RefreshSession";

describe("RefreshSession", () => {
	// Base valid props to use in tests
	const createValidProps = () => ({
		userId: randomUUID(),
		refreshToken: randomUUID(),
		fingerprint: "valid-fingerprint",
		expiresAt: new Date(Date.now() + 3600000), // 1 hour in the future
	});

	describe("Creating valid entity", () => {
		it("should create a valid RefreshSession without optional fields", async () => {
			const validProps = createValidProps();

			const refreshSession = await RefreshSession.create(validProps);

			expect(refreshSession).toBeInstanceOf(RefreshSession);
			expect(refreshSession.userId).toBe(validProps.userId);
			expect(refreshSession.refreshToken).toBe(validProps.refreshToken);
			expect(refreshSession.fingerprint).toBe(validProps.fingerprint);
			expect(refreshSession.expiresAt).toBe(validProps.expiresAt);
			expect(refreshSession.ipAddress).toBeNull();
			expect(refreshSession.userAgent).toBeNull();
			expect(refreshSession.createdAt).toBeNull();
		});

		it("should create a valid RefreshSession with all optional fields", async () => {
			const now = new Date();
			const validProps = {
				...createValidProps(),
				ipAddress: "192.168.1.1",
				userAgent: "Mozilla/5.0 Chrome/91.0.4472.124",
				createdAt: now,
			};

			const refreshSession = await RefreshSession.create(validProps);

			expect(refreshSession).toBeInstanceOf(RefreshSession);
			expect(refreshSession.ipAddress).toBe(validProps.ipAddress);
			expect(refreshSession.userAgent).toBe(validProps.userAgent);
			expect(refreshSession.createdAt).toBe(now);
		});

		it("should calculate expiresInMs correctly based on expiresAt", async () => {
			const now = Date.now();
			jest.spyOn(Date, "now").mockImplementation(() => now);

			const expiresAt = new Date(now + 3600000); // 1 hour in the future
			const validProps = {
				...createValidProps(),
				expiresAt,
			};

			const refreshSession = await RefreshSession.create(validProps);

			// expiresInMs should be negative when not expired (time remaining)
			expect(refreshSession.expiresInMs).toBe(3600000);

			jest.spyOn(Date, "now").mockRestore();
		});
	});

	describe("userId validation", () => {
		it("should reject with validation error for missing userId", async () => {
			const invalidProps = {
				...createValidProps(),
				userId: undefined as any,
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should reject with validation error for empty userId", async () => {
			const invalidProps = {
				...createValidProps(),
				userId: "",
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should reject with validation error for non-UUID userId", async () => {
			const invalidProps = {
				...createValidProps(),
				userId: "not-a-uuid-format",
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should reject with validation error for null userId", async () => {
			const invalidProps = {
				...createValidProps(),
				userId: null as any,
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});
	});

	describe("refreshToken validation", () => {
		it("should reject with validation error for missing refreshToken", async () => {
			const invalidProps = {
				...createValidProps(),
				refreshToken: undefined as any,
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should reject with validation error for empty refreshToken", async () => {
			const invalidProps = {
				...createValidProps(),
				refreshToken: "",
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should reject with validation error for non-UUID refreshToken", async () => {
			const invalidProps = {
				...createValidProps(),
				refreshToken: "not-a-uuid-format",
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should reject with validation error for null refreshToken", async () => {
			const invalidProps = {
				...createValidProps(),
				refreshToken: null as any,
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});
	});

	describe("fingerprint validation", () => {
		it("should reject with validation error for missing fingerprint", async () => {
			const invalidProps = {
				...createValidProps(),
				fingerprint: undefined as any,
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should reject with validation error for empty fingerprint", async () => {
			const invalidProps = {
				...createValidProps(),
				fingerprint: "",
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should reject with validation error for too long fingerprint", async () => {
			const invalidProps = {
				...createValidProps(),
				fingerprint: "a".repeat(256),
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should accept fingerprint at maximum length", async () => {
			const validProps = {
				...createValidProps(),
				fingerprint: "a".repeat(255),
			};

			const refreshSession = await RefreshSession.create(validProps);
			expect(refreshSession.fingerprint).toBe(validProps.fingerprint);
		});

		it("should reject with validation error for null fingerprint", async () => {
			const invalidProps = {
				...createValidProps(),
				fingerprint: null as any,
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});
	});

	describe("expiresAt validation", () => {
		it("should reject with validation error for missing expiresAt", async () => {
			const invalidProps = {
				...createValidProps(),
				expiresAt: undefined as any,
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should reject with validation error for non-Date expiresAt", async () => {
			const invalidProps = {
				...createValidProps(),
				expiresAt: "2023-01-01T00:00:00Z" as any,
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should reject with validation error for null expiresAt", async () => {
			const invalidProps = {
				...createValidProps(),
				expiresAt: null as any,
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should accept expiresAt in the past (already expired)", async () => {
			const validProps = {
				...createValidProps(),
				expiresAt: new Date(Date.now() - 3600000), // 1 hour in the past
			};

			const refreshSession = await RefreshSession.create(validProps);
			expect(refreshSession.expiresAt).toBe(validProps.expiresAt);
			expect(refreshSession.isExpired()).toBe(true);
		});

		it("should accept expiresAt in the future", async () => {
			const validProps = {
				...createValidProps(),
				expiresAt: new Date(Date.now() + 3600000), // 1 hour in the future
			};

			const refreshSession = await RefreshSession.create(validProps);
			expect(refreshSession.expiresAt).toBe(validProps.expiresAt);
			expect(refreshSession.isExpired()).toBe(false);
		});
	});

	describe("ipAddress validation", () => {
		it("should accept valid IPv4 address", async () => {
			const validProps = {
				...createValidProps(),
				ipAddress: "192.168.1.1",
			};

			const refreshSession = await RefreshSession.create(validProps);
			expect(refreshSession.ipAddress).toBe(validProps.ipAddress);
		});

		it("should accept valid IPv6 address", async () => {
			const validProps = {
				...createValidProps(),
				ipAddress: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
			};

			const refreshSession = await RefreshSession.create(validProps);
			expect(refreshSession.ipAddress).toBe(validProps.ipAddress);
		});

		it("should reject with validation error for invalid IP address format", async () => {
			const invalidProps = {
				...createValidProps(),
				ipAddress: "999.999.999.999",
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should accept undefined/null ipAddress (optional field)", async () => {
			const validProps1 = {
				...createValidProps(),
				ipAddress: undefined,
			};

			const validProps2 = {
				...createValidProps(),
				ipAddress: null,
			};

			const refreshSession1 = await RefreshSession.create(validProps1);
			const refreshSession2 = await RefreshSession.create(validProps2);

			expect(refreshSession1.ipAddress).toBeNull();
			expect(refreshSession2.ipAddress).toBeNull();
		});

		it("should reject with validation error for empty string ipAddress", async () => {
			const invalidProps = {
				...createValidProps(),
				ipAddress: "",
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});
	});

	describe("userAgent validation", () => {
		it("should accept valid userAgent", async () => {
			const validProps = {
				...createValidProps(),
				userAgent: "Mozilla/5.0 Chrome/91.0.4472.124",
			};

			const refreshSession = await RefreshSession.create(validProps);
			expect(refreshSession.userAgent).toBe(validProps.userAgent);
		});

		it("should reject with validation error for empty string userAgent", async () => {
			const invalidProps = {
				...createValidProps(),
				userAgent: "",
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should reject with validation error for too long userAgent", async () => {
			const invalidProps = {
				...createValidProps(),
				userAgent: "a".repeat(256),
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should accept userAgent at maximum length", async () => {
			const validProps = {
				...createValidProps(),
				userAgent: "a".repeat(255),
			};

			const refreshSession = await RefreshSession.create(validProps);
			expect(refreshSession.userAgent).toBe(validProps.userAgent);
		});

		it("should accept undefined/null userAgent (optional field)", async () => {
			const validProps1 = {
				...createValidProps(),
				userAgent: undefined,
			};

			const validProps2 = {
				...createValidProps(),
				userAgent: null,
			};

			const refreshSession1 = await RefreshSession.create(validProps1);
			const refreshSession2 = await RefreshSession.create(validProps2);

			expect(refreshSession1.userAgent).toBeNull();
			expect(refreshSession2.userAgent).toBeNull();
		});
	});

	describe("createdAt validation", () => {
		it("should accept valid Date object", async () => {
			const now = new Date();
			const validProps = {
				...createValidProps(),
				createdAt: now,
			};

			const refreshSession = await RefreshSession.create(validProps);
			expect(refreshSession.createdAt).toBe(now);
		});

		it("should reject with validation error for invalid Date format", async () => {
			const invalidProps = {
				...createValidProps(),
				createdAt: "2023-01-01" as any,
			};

			await expect(RefreshSession.create(invalidProps)).rejects.toThrow();
		});

		it("should accept undefined/null createdAt (optional field)", async () => {
			const validProps1 = {
				...createValidProps(),
				createdAt: undefined,
			};

			const validProps2 = {
				...createValidProps(),
				createdAt: null,
			};

			const refreshSession1 = await RefreshSession.create(validProps1);
			const refreshSession2 = await RefreshSession.create(validProps2);

			expect(refreshSession1.createdAt).toBeNull();
			expect(refreshSession2.createdAt).toBeNull();
		});
	});

	describe("expiration functionality", () => {
		it("should correctly report when a session is expired", async () => {
			// Mock the Date.now to return a fixed value
			const now = Date.now();
			const realDateNow = Date.now;

			try {
				Date.now = jest.fn(() => now);

				const refreshSession = await RefreshSession.create({
					...createValidProps(),
					expiresAt: new Date(now - 1000), // 1 second in the past
				});

				expect(refreshSession.isExpired()).toBe(true);
			} finally {
				Date.now = realDateNow; // Restore original implementation
			}
		});

		it("should correctly report when a session is not expired", async () => {
			// Mock the Date.now to return a fixed value
			const now = Date.now();
			const realDateNow = Date.now;

			try {
				Date.now = jest.fn(() => now);

				const refreshSession = await RefreshSession.create({
					...createValidProps(),
					expiresAt: new Date(now + 10000), // 10 seconds in the future
				});

				expect(refreshSession.isExpired()).toBe(false);
			} finally {
				Date.now = realDateNow; // Restore original implementation
			}
		});

		it("should correctly calculate expiresInMs", async () => {
			// Mock the Date.now to return a fixed value
			const now = Date.now();
			const realDateNow = Date.now;

			try {
				Date.now = jest.fn(() => now);

				// Test with future expiration
				const futureExpiry = await RefreshSession.create({
					...createValidProps(),
					expiresAt: new Date(now + 5000), // 5 seconds in the future
				});

				// expiresInMs should be negative when not expired (time remaining)
				expect(futureExpiry.expiresInMs).toBe(5000);

				// Test with past expiration
				const pastExpiry = await RefreshSession.create({
					...createValidProps(),
					expiresAt: new Date(now - 5000), // 5 seconds in the past
				});

				// expiresInMs should be positive when expired (time elapsed)
				expect(pastExpiry.expiresInMs).toBe(-5000);
			} finally {
				Date.now = realDateNow; // Restore original implementation
			}
		});

		it("should report expired for exact current time", async () => {
			const now = Date.now();
			const realDateNow = Date.now;

			try {
				Date.now = jest.fn(() => now);

				const refreshSession = await RefreshSession.create({
					...createValidProps(),
					expiresAt: new Date(now), // Expires exactly now
				});

				expect(refreshSession.isExpired()).toBe(true);
			} finally {
				Date.now = realDateNow;
			}
		});
	});
});
