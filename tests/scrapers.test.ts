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
	"title",
	"ingredients",
	"instructions",
	"host",
] as const;

const OPTIONAL_TESTS = [
	"total_time",
	"cook_time",
	"prep_time",
	"yields",
	"image",
	"author",
	"description",
	"category",
	"cuisine",
] as const;

function createScraperTest(
	hostName: string,
	htmlPath: string,
	expectedPath: string,
) {
	return () => {
		let scraper: AbstractScraper;
		let expected: ExpectedData;
		let html: string;

		beforeEach(() => {
			html = readFileSync(htmlPath, "utf8");
			expected = JSON.parse(readFileSync(expectedPath, "utf8"));

			// Get scraper class from registry
			const ScraperClass = SCRAPERS[hostName];
			if (!ScraperClass) {
				throw new Error(`No scraper found for host: ${hostName}`);
			}

			scraper = new (ScraperClass as any)(
				html,
				`https://${hostName}/recipe/test`,
			);
		});

		// Test mandatory methods
		MANDATORY_TESTS.forEach((method) => {
			it(`should extract ${method}`, () => {
				if (method === "host") {
					// Special handling for static host method
					expect((scraper.constructor as any).host()).toBe(hostName);
					return;
				}

				if (expected && method in expected) {
					const actual = (scraper as any)[method]();
					expect(actual).toEqual(expected[method]);
				} else {
					// Method should throw if no expected value
					expect(() => (scraper as any)[method]()).toThrow();
				}
			});
		});

		// Test optional methods
		OPTIONAL_TESTS.forEach((method) => {
			if (expected && method in expected) {
				it(`should extract ${method}`, () => {
					const actual = (scraper as any)[method]();
					expect(actual).toEqual(expected[method]);
				});
			}
		});

		// Test JSON conversion
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
	} catch (error) {
		console.warn("Test data directory not found:", testDataDir);
		return;
	}

	const hostDirs = readdirSync(testDataDir).filter((item) => {
		try {
			return statSync(join(testDataDir, item)).isDirectory();
		} catch {
			return false;
		}
	});

	hostDirs.forEach((hostName) => {
		const hostDir = join(testDataDir, hostName);
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
			} catch (error) {
				console.warn(`Missing JSON file for ${htmlPath}`);
			}
		});
	});
}

// Generate all tests
generateScraperTests();
