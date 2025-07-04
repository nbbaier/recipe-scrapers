import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { PythonAstParser, type ScraperAnalysis } from "./PythonAstParser";
import { TypeScriptTemplateGenerator } from "./TypeScriptTemplateGenerator";

export interface MigrationOptions {
	pythonScrapersPath: string;
	typescriptScrapersPath: string;
	testDataPath: string;
	generateTests: boolean;
	validateOutput: boolean;
	dryRun: boolean;
}

export interface MigrationResult {
	scraper: string;
	success: boolean;
	analysis?: ScraperAnalysis;
	generatedFiles: string[];
	errors: string[];
	warnings: string[];
}

export interface BatchMigrationResult {
	totalScrapers: number;
	successful: number;
	failed: number;
	results: MigrationResult[];
	duration: number;
}

export class MigrationWorkflow {
	private parser: PythonAstParser;
	private options: MigrationOptions;

	constructor(options: MigrationOptions) {
		this.parser = new PythonAstParser();
		this.options = options;
	}

	async migrateScraper(pythonFilePath: string): Promise<MigrationResult> {
		const scraperName = basename(pythonFilePath, ".py");
		const result: MigrationResult = {
			scraper: scraperName,
			success: false,
			generatedFiles: [],
			errors: [],
			warnings: [],
		};

		try {
			// Step 1: Analyze Python scraper
			console.log(`Analyzing ${scraperName}...`);
			const analysis = this.parser.analyzePythonScraper(pythonFilePath);
			result.analysis = analysis;

			// Step 2: Generate TypeScript scraper
			console.log(`Generating TypeScript for ${scraperName}...`);
			const generator = new TypeScriptTemplateGenerator(analysis);
			const typeScriptCode = generator.generate();

			// Step 3: Write TypeScript file
			const tsFilePath = join(
				this.options.typescriptScrapersPath,
				`${analysis.className}.ts`,
			);

			if (!this.options.dryRun) {
				this.ensureDirectoryExists(dirname(tsFilePath));
				writeFileSync(tsFilePath, typeScriptCode);
				result.generatedFiles.push(tsFilePath);
			}

			// Step 4: Generate test file if requested
			if (this.options.generateTests) {
				console.log(`Generating test for ${scraperName}...`);
				const testCode = generator.generateTestFile();
				const testFilePath = join(
					this.options.testDataPath,
					`${analysis.className}.test.ts`,
				);

				if (!this.options.dryRun) {
					this.ensureDirectoryExists(dirname(testFilePath));
					writeFileSync(testFilePath, testCode);
					result.generatedFiles.push(testFilePath);
				}
			}

			// Step 5: Validate output if requested
			if (this.options.validateOutput && !this.options.dryRun) {
				console.log(`Validating ${scraperName}...`);
				const validation = await this.validateGeneratedScraper(
					tsFilePath,
					analysis,
				);
				result.warnings.push(...validation.warnings);
				if (validation.errors.length > 0) {
					result.errors.push(...validation.errors);
				}
			}

			result.success = result.errors.length === 0;
			console.log(
				`${result.success ? "✅" : "❌"} ${scraperName} migration ${result.success ? "completed" : "failed"}`,
			);
		} catch (error) {
			result.errors.push(`Migration failed: ${error}`);
			console.error(`❌ ${scraperName} migration failed:`, error);
		}

		return result;
	}

	async migrateBatch(pythonFiles: string[]): Promise<BatchMigrationResult> {
		const startTime = Date.now();
		const results: MigrationResult[] = [];

		console.log(
			`Starting batch migration of ${pythonFiles.length} scrapers...`,
		);

		for (const pythonFile of pythonFiles) {
			const result = await this.migrateScraper(pythonFile);
			results.push(result);
		}

		const duration = Date.now() - startTime;
		const successful = results.filter((r) => r.success).length;
		const failed = results.filter((r) => !r.success).length;

		console.log(`\n📊 Migration Summary:`);
		console.log(`Total: ${pythonFiles.length}`);
		console.log(`Successful: ${successful}`);
		console.log(`Failed: ${failed}`);
		console.log(`Duration: ${duration}ms`);

		return {
			totalScrapers: pythonFiles.length,
			successful,
			failed,
			results,
			duration,
		};
	}

	async migrateTopScrapers(count: number = 50): Promise<BatchMigrationResult> {
		const topScrapers = this.getTopScrapers(count);
		const pythonFiles = topScrapers
			.map((scraper) => join(this.options.pythonScrapersPath, `${scraper}.py`))
			.filter((file) => existsSync(file));

		console.log(`Found ${pythonFiles.length} of ${count} top scrapers`);

		return this.migrateBatch(pythonFiles);
	}

	private getTopScrapers(count: number): string[] {
		// Based on the tier lists from Phase 2 plan
		const tier1Scrapers = [
			"allrecipes",
			"foodnetwork",
			"bbcgoodfood",
			"seriouseats",
			"bonappetit",
			"epicurious",
			"delish",
			"tasty",
			"marthastewart",
			"simplyrecipes",
		];

		const tier2Scrapers = [
			"thepioneerwoman",
			"minimalistbaker",
			"cookieandkate",
			"halfbakedharvest",
			"gimmesomeoven",
			"pinchofyum",
			"budgetbytes",
			"skinnytaste",
			"twopeasandtheirpod",
			"sallysbakingaddiction",
			"therecipecritic",
			"damndelicious",
			"cafedelites",
			"dinneratthezoo",
			"dinnerthendessert",
			"natashaskitchen",
			"jessicainthekitchen",
			"cookingclassy",
			"themediterraneandish",
			"loveandlemons",
		];

		const tier3Scrapers = [
			"ambitiouskitchen",
			"averiecooks",
			"bakingmischief",
			"carlsbadcravings",
			"chelseamessyapron",
			"cookinglight",
			"eatingwell",
			"food52",
			"foodandwine",
			"foodrepublic",
			"inspiredtaste",
			"kingarthurbaking",
			"livelypeople",
			"myrecipes",
			"recipetineats",
			"spendwithpennies",
			"tasteofhome",
			"thespruceeats",
			"thekitchn",
			"wellplated",
		];

		const allScrapers = [...tier1Scrapers, ...tier2Scrapers, ...tier3Scrapers];
		return allScrapers.slice(0, count);
	}

	private async validateGeneratedScraper(
		tsFilePath: string,
		analysis: ScraperAnalysis,
	): Promise<{ errors: string[]; warnings: string[] }> {
		const errors: string[] = [];
		const warnings: string[] = [];

		try {
			// Check if TypeScript file compiles
			execSync(`npx tsc --noEmit ${tsFilePath}`, { stdio: "pipe" });
		} catch (error) {
			errors.push(`TypeScript compilation failed: ${error}`);
		}

		// Check for missing required methods
		const requiredMethods = ["title", "ingredients", "instructions"];
		const generatedCode = readFileSync(tsFilePath, "utf8");

		for (const method of requiredMethods) {
			if (!generatedCode.includes(`${method}()`)) {
				errors.push(`Missing required method: ${method}`);
			}
		}

		// Check for potential issues
		if (analysis.complexity === "complex" && analysis.methods.length > 15) {
			warnings.push(
				"Complex scraper with many methods - may need manual review",
			);
		}

		if (analysis.parsingStrategy === "mixed" && analysis.methods.length > 10) {
			warnings.push(
				"Mixed parsing strategy with many methods - verify schema.org fallbacks",
			);
		}

		return { errors, warnings };
	}

	private ensureDirectoryExists(dirPath: string): void {
		if (!existsSync(dirPath)) {
			mkdirSync(dirPath, { recursive: true });
		}
	}

	generateMigrationReport(result: BatchMigrationResult): string {
		const report = `
# Migration Report

**Date**: ${new Date().toISOString()}
**Duration**: ${result.duration}ms
**Total Scrapers**: ${result.totalScrapers}
**Successful**: ${result.successful}
**Failed**: ${result.failed}

## Successful Migrations

${result.results
	.filter((r) => r.success)
	.map(
		(r) =>
			`- ✅ ${r.scraper} (${r.analysis?.complexity || "unknown"} complexity, ${r.analysis?.parsingStrategy || "unknown"} strategy)`,
	)
	.join("\n")}

## Failed Migrations

${result.results
	.filter((r) => !r.success)
	.map((r) => `- ❌ ${r.scraper}: ${r.errors.join(", ")}`)
	.join("\n")}

## Warnings

${result.results
	.flatMap((r) => r.warnings.map((w) => `- ⚠️ ${r.scraper}: ${w}`))
	.join("\n")}

## Summary by Complexity

${this.generateComplexitySummary(result)}

## Summary by Parsing Strategy

${this.generateStrategySummary(result)}
`;

		return report;
	}

	private generateComplexitySummary(result: BatchMigrationResult): string {
		const complexity = result.results.reduce(
			(acc, r) => {
				if (r.analysis?.complexity) {
					acc[r.analysis.complexity] = (acc[r.analysis.complexity] || 0) + 1;
				}
				return acc;
			},
			{} as Record<string, number>,
		);

		return Object.entries(complexity)
			.map(([level, count]) => `- ${level}: ${count} scrapers`)
			.join("\n");
	}

	private generateStrategySummary(result: BatchMigrationResult): string {
		const strategies = result.results.reduce(
			(acc, r) => {
				if (r.analysis?.parsingStrategy) {
					acc[r.analysis.parsingStrategy] =
						(acc[r.analysis.parsingStrategy] || 0) + 1;
				}
				return acc;
			},
			{} as Record<string, number>,
		);

		return Object.entries(strategies)
			.map(([strategy, count]) => `- ${strategy}: ${count} scrapers`)
			.join("\n");
	}
}
