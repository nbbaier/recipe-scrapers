import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { AbstractScraper } from "@/core/AbstractScraper";
import { SCRAPERS } from "@/index";

interface ExpectedData {
	title?: string;
	ingredients?: string[];
	instructions?: string[];
	instructions_list?: string[];
	total_time?: number;
	yields?: string;
	image?: string;
	author?: string;
	description?: string;
	category?: string;
	cuisine?: string;
	prep_time?: number;
	cook_time?: number;
	// Add other expected fields as needed
}

const MANDATORY_TESTS = [
	"author",
	"canonicalUrl",
	"host",
	"image",
	"ingredients",
	"instructions_list",
	"language",
	"siteName",
	"title",
	"total_time",
	"yields",
] as const;

const OPTIONAL_TESTS = [
	"ingredient_groups",
	"instructions",
	"category",
	"description",
	"cook_time",
	"cuisine",
	"nutrients",
	"prep_time",
	"cooking_method",
	"keywords",
	"ratings",
	"reviews",
	"equipment",
	"ratings_count",
	"dietary_restrictions",
] as const;

const NUTRITION_KEYS = [
	"servingSize",
	"calories",
	"fatContent",
	"saturatedFatContent",
	"unsaturatedFatContent",
	"transFatContent",
	"carbohydrateContent",
	"sugarContent",
	"proteinContent",
	"sodiumContent",
	"fiberContent",
	"cholesterolContent",
];

const JSON_KEY_ORDER = [
	"author",
	"canonicalUrl",
	"siteName",
	"host",
	"language",
	"title",
	"ingredients",
	"ingredient_groups",
	"instructions",
	"instructions_list",
	"category",
	"yields",
	"description",
	"total_time",
	"cook_time",
	"prep_time",
	"cuisine",
	"cooking_method",
	"ratings",
	"ratings_count",
	"equipment",
	"reviews",
	"nutrients",
	"dietary_restrictions",
	"image",
	"keywords",
];

function normalizeInstructionsList(list: string[] | undefined): string[] {
	if (!list) return [];
	return list.map((line) => line.trim()).filter((line) => line);
}

function normalizeInstructionsString(instr: string | undefined): string[] {
	if (!instr) return [];
	return instr
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line);
}

function flattenIngredientGroups(groups: any[]): string[] {
	if (!groups) return [];
	return groups.flatMap((g) => g.ingredients || []);
}

// Utility to recursively convert all object keys to snake_case
function toSnakeCaseKeys(obj: any): any {
	if (Array.isArray(obj)) {
		return obj.map(toSnakeCaseKeys);
	} else if (obj && typeof obj === 'object' && obj.constructor === Object) {
		return Object.fromEntries(
			Object.entries(obj).map(([k, v]) => [
				k.replace(/([A-Z])/g, '_$1').toLowerCase(),
				toSnakeCaseKeys(v),
			])
		);
	}
	return obj;
}

function createScraperTest(
	hostName: string,
	htmlPath: string,
	expectedPath: string,
) {
	return () => {
		let scraper: AbstractScraper;
		let expected: any;
		let html: string;

		beforeEach(() => {
			html = readFileSync(htmlPath, "utf8");
			expected = JSON.parse(readFileSync(expectedPath, "utf8"));
			const ScraperClass = SCRAPERS[hostName];
			if (!ScraperClass) {
				throw new Error(`No scraper found for host: ${hostName}`);
			}
			scraper = new (ScraperClass as any)(
				html,
				`https://${hostName}/recipe/test`,
			);
		});

		MANDATORY_TESTS.forEach((method) => {
			it(`should extract ${method}`, () => {
				if (method === "host") {
					expect((scraper.constructor as any).host()).toBe(hostName);
					return;
				}
				if (expected && (method in expected)) {
					const actual = (scraper as any)[method]();
					// Normalize both actual and expected to snake_case for comparison
					expect(toSnakeCaseKeys(actual)).toEqual(toSnakeCaseKeys(expected[method]));
				} else {
					expect(() => (scraper as any)[method]()).toThrow();
				}
			});
		});

		OPTIONAL_TESTS.forEach((method) => {
			if (expected && method in expected) {
				it(`should extract ${method}`, () => {
					const actual = (scraper as any)[method]();
					// Normalize both actual and expected to snake_case for comparison
					expect(toSnakeCaseKeys(actual)).toEqual(toSnakeCaseKeys(expected[method]));
				});
			}
		});

		it("ingredient_groups should flatten to ingredients", () => {
			if (typeof (scraper as any)["ingredient_groups"] === "function") {
				const groups = (scraper as any)["ingredient_groups"]();
				const flat = flattenIngredientGroups(groups);
				const ingredients = (scraper as any)["ingredients"]();
				expect(flat.sort()).toEqual((ingredients || []).sort());
			}
		});

		it("instructions_list and instructions should be consistent", () => {
			if (
				expected.instructions_list &&
				typeof (scraper as any)["instructions"] === "function"
			) {
				const instrList = normalizeInstructionsList(expected.instructions_list);
				const instrString = normalizeInstructionsString(
					(scraper as any)["instructions"](),
				);
				expect(instrString).toEqual(instrList);
			}
		});

		it("should have correct JSON key order", () => {
			const json = scraper.toJSON();
			const actualKeys = Object.keys(json);
			const expectedKeys = JSON_KEY_ORDER.filter((k) => k in json);
			expect(actualKeys).toEqual(expectedKeys);
		});

		it("should have correct nutrition key order", () => {
			const json = scraper.toJSON();
			const nutrients = (json as any).nutrients;
			if (nutrients) {
				const actualKeys = Object.keys(nutrients);
				const expectedKeys = NUTRITION_KEYS.filter((k) => k in nutrients);
				const otherKeys = actualKeys.filter((k) => !NUTRITION_KEYS.includes(k));
				expect(actualKeys).toEqual([...expectedKeys, ...otherKeys]);
			}
		});

		it("should convert to JSON correctly", () => {
			const json = scraper.toJSON();
			expect(json).toBeDefined();
			expect(json.title).toBeDefined();
			expect(Array.isArray(json.ingredients)).toBe(true);
			expect(Array.isArray(json.instructions)).toBe(true);
		});
	};
}

function generateScraperTests() {
	const testDataDir = join(process.cwd(), "tests/test_data");

	try {
		if (!statSync(testDataDir).isDirectory()) {
			return;
		}
	} catch (_error) {
		console.warn("Test data directory not found:", testDataDir);
		return;
	}

	// Get list of scrapers to test from environment variables
	const getScrapersToTest = (): string[] => {
		// Check for SCRAPER (single scraper)
		if (process.env.SCRAPER) {
			return [process.env.SCRAPER];
		}

		// Check for SCRAPERS_TO_TEST (comma-separated list)
		if (process.env.SCRAPERS_TO_TEST) {
			return process.env.SCRAPERS_TO_TEST.split(",").map((s) => s.trim());
		}

		// Default: test all scrapers
		return Object.keys(SCRAPERS);
	};

	const scrapersToTest = getScrapersToTest();

	// Filter scrapers based on environment variables
	const filteredScrapers = scrapersToTest.filter((hostName) => {
		if (!SCRAPERS[hostName]) {
			console.warn(`Scraper not found in registry: ${hostName}`);
			return false;
		}
		return true;
	});

	console.log(`Testing ${filteredScrapers.length} scrapers:`, filteredScrapers);

	// Instead of scanning all directories, iterate through implemented scrapers
	filteredScrapers.forEach((hostName) => {
		const hostDir = join(testDataDir, hostName);

		// Check if test data directory exists for this scraper
		try {
			if (!statSync(hostDir).isDirectory()) {
				return;
			}
		} catch {
			// No test data directory for this scraper, skip it
			return;
		}

		let testFiles: string[];

		try {
			testFiles = readdirSync(hostDir).filter((file) =>
				file.endsWith(".test.html"),
			);
		} catch {
			return;
		}

		testFiles.forEach((htmlFile) => {
			const baseName = htmlFile.replace(".test.html", "");
			const jsonFile = `${baseName}.json`;

			const htmlPath = join(hostDir, htmlFile);
			const jsonPath = join(hostDir, jsonFile);

			// Check if corresponding JSON file exists
			try {
				statSync(jsonPath);

				// Create test suite for this scraper
				describe(
					`${hostName} - ${baseName}`,
					createScraperTest(hostName, htmlPath, jsonPath),
				);
			} catch (_error) {
				console.warn(`Missing JSON file for ${htmlPath}`);
			}
		});
	});
}

// Generate all tests
generateScraperTests();
