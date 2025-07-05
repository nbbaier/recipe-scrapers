import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { BBCGoodFood } from "@/scrapers/BBCGoodFood";

describe("BBCGoodFood", () => {
	let scraper: BBCGoodFood;
	let html: string;

	beforeEach(() => {
		html = readFileSync(
			"tests/test_data/bbcgoodfood.com/bbcgoodfood.test.html",
			"utf8",
		);
		scraper = new BBCGoodFood(html, "bbcgoodfood.com/recipe/test");
	});

	it("should have correct host", () => {
		expect(BBCGoodFood.host()).toBe("bbcgoodfood.com");
	});

	it("should extract title", () => {
		const title = scraper.title();
		expect(title).toBeDefined();
		expect(typeof title).toBe("string");
		expect(title.length).toBeGreaterThan(0);
	});

	it("should extract ingredients", () => {
		const ingredients = scraper.ingredients();
		expect(Array.isArray(ingredients)).toBe(true);
		expect(ingredients.length).toBeGreaterThan(0);
	});

	it("should extract instructions", () => {
		const instructions = scraper.instructions();
		expect(Array.isArray(instructions)).toBe(true);
		expect(instructions.length).toBeGreaterThan(0);
	});

	it("should convert to JSON", () => {
		const json = scraper.toJSON();
		expect(json).toHaveProperty("title");
		expect(json).toHaveProperty("ingredients");
		expect(json).toHaveProperty("instructions");
		expect(json.title).toBeDefined();
		expect(json.ingredients.length).toBeGreaterThan(0);
		expect(json.instructions.length).toBeGreaterThan(0);
	});

	// TODO: Add cross-validation test with Python implementation
	// it('should match Python output', async () => {
	//   const pythonOutput = await runPythonScraper(html);
	//   const tsOutput = scraper.toJSON();
	//   expect(tsOutput.title).toBe(pythonOutput.title);
	//   expect(tsOutput.ingredients).toEqual(pythonOutput.ingredients);
	//   expect(tsOutput.instructions).toEqual(pythonOutput.instructions);
	// });
});
