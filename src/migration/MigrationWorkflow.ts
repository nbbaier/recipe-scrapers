import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
	basename,
	dirname,
	join,
	dirname as pathDirname,
	resolve,
} from "node:path";
import { fileURLToPath } from "node:url";
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

	private updateScrapersRegistry(className: string, hostName: string) {
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = pathDirname(__filename);
		const indexPath = resolve(__dirname, "../index.ts");
		let indexContent = readFileSync(indexPath, "utf8");
		let changed = false;

		const importLine = `import { ${className} } from "./scrapers/${className}.js";`;
		if (!indexContent.includes(importLine)) {
			const importRegex = /import \{ [^}]+ \} from ".\/scrapers\/[^"]+";/g;
			const matches = [...indexContent.matchAll(importRegex)];
			const lastScraperImport =
				matches.length > 0 ? matches[matches.length - 1] : undefined;
			if (lastScraperImport && typeof lastScraperImport.index === "number") {
				const insertPos = lastScraperImport.index + lastScraperImport[0].length;
				indexContent =
					indexContent.slice(0, insertPos) +
					"\n" +
					importLine +
					indexContent.slice(insertPos);
				changed = true;
			} else {
				const lastImportPos = indexContent.lastIndexOf("import ");
				const nextLine = indexContent.indexOf("\n", lastImportPos);
				indexContent =
					indexContent.slice(0, nextLine + 1) +
					importLine +
					"\n" +
					indexContent.slice(nextLine + 1);
				changed = true;
			}
		}

		const tldMatch = hostName.match(/^(.*?)(\.[a-z]+)$/i);
		let baseDomain = hostName;
		if (tldMatch?.[1]) {
			baseDomain = tldMatch[1];
		}
		const testDataRoot = resolve(process.cwd(), "tests/test_data");
		let tldDomains: string[] = [];
		try {
			const allDirs = existsSync(testDataRoot)
				? require("node:fs").readdirSync(testDataRoot)
				: [];
			tldDomains = allDirs.filter((dir: string) =>
				dir.startsWith(baseDomain + "."),
			);
		} catch {
			// ignore
		}
		// Filter out invalid hostnames (e.g., .DS_Store, empty strings)
		function isValidHostName(host: string): boolean {
			return !!host && !host.startsWith('.') && host.includes('.') && !/^\s*$/.test(host);
		}

		if (!tldDomains.includes(hostName)) {
			tldDomains.push(hostName);
		}
		tldDomains = Array.from(new Set(tldDomains)).filter(isValidHostName);
		if (tldDomains.length > 1) {
			console.warn(
				`⚠️  Multiple TLDs found for base domain '${baseDomain}': ${tldDomains.join(", ")}. Adding all to SCRAPERS registry.`,
			);
		}

		// Only add host keys that are not already present in the registry
		const registryRegex =
			/export const SCRAPERS: Record<string, typeof AbstractScraper> = \{([\s\S]*?)\n\};/m;
		const registryMatch = indexContent.match(registryRegex);
		let registryBlock = registryMatch && typeof registryMatch[1] === "string" ? registryMatch[1] : "";
		const missingDomains = tldDomains.filter(domain => !registryBlock.includes(`"${domain}": ${className},`));
		if (missingDomains.length === 0) {
			// All valid host keys already present, do not modify registry
			if (changed) {
				writeFileSync(indexPath, indexContent);
			}
			console.log(`SCRAPERS registry already up to date for ${tldDomains.join(", ")}`);
			return;
		}
		missingDomains.forEach((domain) => {
			if (!isValidHostName(domain)) return;
			const hostKey = `  "${domain}": ${className},\n`;
			const closingBraceIndex = indexContent.indexOf(
				"};",
				registryMatch ? registryMatch.index : 0,
			);
			if (closingBraceIndex !== -1) {
				indexContent =
					indexContent.slice(0, closingBraceIndex) +
					hostKey +
					indexContent.slice(closingBraceIndex);
				registryBlock += hostKey;
				changed = true;
			}
		});

		const exportBlockRegex = /export \{([\s\S]*?)\n\};/m;
		const exportBlockMatch = indexContent.match(exportBlockRegex);
		if (exportBlockMatch && typeof exportBlockMatch[1] === "string") {
			const exportBlock = exportBlockMatch[1];
			if (!exportBlock.includes(className)) {
				const closingBraceIndex = indexContent.indexOf(
					"};",
					exportBlockMatch.index,
				);
				if (closingBraceIndex !== -1) {
					const exportLine = `  ${className},\n`;
					indexContent =
						indexContent.slice(0, closingBraceIndex) +
						exportLine +
						indexContent.slice(closingBraceIndex);
					changed = true;
				}
			}
		}

		if (changed && !this.options.dryRun) {
			writeFileSync(indexPath, indexContent);
			console.log(
				`✅ Updated SCRAPERS registry in src/index.ts for ${tldDomains.join(", ")}`,
			);
		} else if (changed && this.options.dryRun) {
			console.warn(
				`⚠️  (dry run) Please add the following to src/index.ts for all TLDs:`,
			);
			tldDomains.forEach((domain) => {
				console.warn(`In SCRAPERS: "${domain}": ${className},`);
			});
			console.warn(importLine);
			console.warn(`In export block: ${className},`);
		} else if (!changed) {
			console.log(
				`SCRAPERS registry already up to date for ${tldDomains.join(", ")}`,
			);
		}
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

			// Step 4: Generate test file if requested (DEPRECATED - tests are now dynamic)
			if (this.options.generateTests) {
				console.log(
					`Note: Test file generation is deprecated. Tests are now dynamically generated from test data.`,
				);
				// Test generation logic removed - tests are now dynamic
				// See tests/scrapers.test.ts for the new dynamic testing approach
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

			// Step 6: Update SCRAPERS registry if migration was successful
			if (result.success) {
				this.updateScrapersRegistry(analysis.className, analysis.hostName);
			}
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
