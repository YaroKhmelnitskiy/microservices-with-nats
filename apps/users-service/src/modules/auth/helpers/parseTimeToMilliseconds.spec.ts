import { parseTimeToMilliseconds } from "./parseTimeToMilliseconds";

describe("parseTimeToMilliseconds", () => {
	it("should throw error if unknown time unit", () => {
		expect(() => parseTimeToMilliseconds("10l")).toThrow("Unknown time unit");
	});

	it("should return correct time with input in second", () => {
		expect(parseTimeToMilliseconds("10s")).toBe(10000);
	});

	it("should return correct time with input in minutes", () => {
		expect(parseTimeToMilliseconds("10m")).toBe(10 * 1000 * 60);
	});

	it("should return correct time with input in hours", () => {
		expect(parseTimeToMilliseconds("10h")).toBe(10 * 1000 * 60 * 60);
	});

	it("should return correct time with input in days", () => {
		expect(parseTimeToMilliseconds("10d")).toBe(10 * 1000 * 60 * 60 * 24);
	});

	it("should return correct time with input in second", () => {
		expect(parseTimeToMilliseconds("10w")).toBe(10 * 1000 * 60 * 60 * 24 * 7);
	});

	it("should return correct value if have spaces", () => {
		expect(parseTimeToMilliseconds("10w   ")).toBe(10 * 1000 * 60 * 60 * 24 * 7);
		expect(parseTimeToMilliseconds("   10w")).toBe(10 * 1000 * 60 * 60 * 24 * 7);
	});
});
