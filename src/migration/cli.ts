#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { Command } from "commander";
import { type MigrationOptions, MigrationWorkflow } from "./MigrationWorkflow";

const program = new Command();

program
	.name("migration-tool")
	.description("CLI tool for migrating Python scrapers to TypeScript")
	.version("1.0.0");

program
	.command("migrate")
	.description("Migrate Python scrapers to TypeScript")
	.option(
		"-s, --source <path>",
		"Path to Python scrapers directory",
		"recipe_scrapers",
	)
	.option(
		"-t, --target <path>",
		"Path to TypeScript scrapers directory",
		"src/scrapers",
	)
	.option(
		"-d, --test-data <path>",
		"Path to test data directory",
		"tests/scrapers",
	)
	.option("--generate-tests", "Generate test files", false)
	.option("--validate", "Validate generated output", false)
	.option("--dry-run", "Run without creating files", false)
	.option("-c, --count <number>", "Number of top scrapers to migrate", "50")
	.option("-f, --file <path>", "Migrate specific Python file")
	.option("-r, --report <path>", "Generate migration report file")
	.action(async (options) => {
		const migrationOptions: MigrationOptions = {
			pythonScrapersPath: options.source,
			typescriptScrapersPath: options.target,
			testDataPath: options.testData,
			generateTests: options.generateTests,
			validateOutput: options.validate,
			dryRun: options.dryRun,
		};

		const workflow = new MigrationWorkflow(migrationOptions);

		try {
			let result: Awaited<ReturnType<typeof workflow.migrateTopScrapers>>;

			if (options.file) {
				// Migrate single file
				if (!existsSync(options.file)) {
					console.error(`Error: File not found: ${options.file}`);
					process.exit(1);
				}

				console.log(`Migrating single file: ${options.file}`);
				const singleResult = await workflow.migrateScraper(options.file);

				if (singleResult.success) {
					console.log("✅ Migration completed successfully");
					console.log(
						`Generated files: ${singleResult.generatedFiles.join(", ")}`,
					);
				} else {
					console.log("❌ Migration failed");
					console.log(`Errors: ${singleResult.errors.join(", ")}`);
					process.exit(1);
				}
			} else {
				// Migrate batch of top scrapers
				const count = parseInt(options.count, 10);
				console.log(`Migrating top ${count} scrapers...`);

				result = await workflow.migrateTopScrapers(count);

				console.log(`\n📊 Final Results:`);
				console.log(
					`✅ Successful: ${result.successful}/${result.totalScrapers}`,
				);
				console.log(`❌ Failed: ${result.failed}/${result.totalScrapers}`);
				console.log(`⏱️  Duration: ${result.duration}ms`);

				// Generate report if requested
				if (options.report) {
					const reportContent = workflow.generateMigrationReport(result);
					writeFileSync(options.report, reportContent);
					console.log(`📝 Report saved to: ${options.report}`);
				}
			}
		} catch (error) {
			console.error("Migration failed:", error);
			process.exit(1);
		}
	});

program
	.command("analyze")
	.description("Analyze Python scrapers without migrating")
	.option(
		"-s, --source <path>",
		"Path to Python scrapers directory",
		"recipe_scrapers",
	)
	.option("-f, --file <path>", "Analyze specific Python file")
	.option("-c, --count <number>", "Number of top scrapers to analyze", "10")
	.action(async (options) => {
		const { PythonAstParser } = await import("./PythonAstParser");
		const parser = new PythonAstParser();

		try {
			if (options.file) {
				// Analyze single file
				if (!existsSync(options.file)) {
					console.error(`Error: File not found: ${options.file}`);
					process.exit(1);
				}

				console.log(`Analyzing: ${options.file}`);
				const analysis = parser.analyzePythonScraper(options.file);

				console.log("\n📊 Analysis Results:");
				console.log(`Class: ${analysis.className}`);
				console.log(`Host: ${analysis.hostName}`);
				console.log(`Complexity: ${analysis.complexity}`);
				console.log(`Strategy: ${analysis.parsingStrategy}`);
				console.log(`Methods: ${analysis.methods.length}`);
				console.log(`Imports: ${analysis.imports.length}`);

				console.log("\n🔍 Methods:");
				analysis.methods.forEach((method) => {
					console.log(`  - ${method.name} (${method.returnType})`);
					console.log(`    Selectors: ${method.selectors.length}`);
					console.log(`    Schema Props: ${method.schemaProperties.length}`);
					console.log(`    Complexity: ${method.complexity}`);
				});
			} else {
				// Analyze multiple files
				const _workflow = new MigrationWorkflow({
					pythonScrapersPath: options.source,
					typescriptScrapersPath: "",
					testDataPath: "",
					generateTests: false,
					validateOutput: false,
					dryRun: true,
				});

				console.log(`Analyzing top ${options.count} scrapers...`);
				// This would need to be implemented in the workflow
				console.log("Batch analysis not yet implemented");
			}
		} catch (error) {
			console.error("Analysis failed:", error);
			process.exit(1);
		}
	});

program
	.command("setup")
	.description("Set up migration environment")
	.action(() => {
		console.log("Setting up migration environment...");

		// Create necessary directories
		const dirs = ["src/scrapers", "tests/scrapers", "tests/test_data"];

		dirs.forEach((dir) => {
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
				console.log(`Created directory: ${dir}`);
			}
		});

		// Create sample migration config
		const config = {
			pythonScrapersPath: "recipe_scrapers",
			typescriptScrapersPath: "src/scrapers",
			testDataPath: "tests/scrapers",
			generateTests: true,
			validateOutput: true,
			dryRun: false,
		};

		writeFileSync("migration.config.json", JSON.stringify(config, null, 2));
		console.log("Created migration.config.json");

		console.log("\n✅ Migration environment set up successfully!");
		console.log("\nNext steps:");
		console.log("1. Review migration.config.json");
		console.log("2. Run: npm run migrate -- migrate --count 10");
		console.log("3. Test the migrated scrapers");
	});

// Check if this is the main module (ESM compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
	program.parse();
}

export { program };
