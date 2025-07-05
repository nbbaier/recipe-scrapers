import { execSync } from "node:child_process";

export interface ScraperAnalysis {
	className: string;
	hostName: string;
	methods: MethodAnalysis[];
	imports: string[];
	complexity: "simple" | "medium" | "complex";
	parsingStrategy: "schema" | "selectors" | "mixed";
	filePath: string;
}

export interface MethodAnalysis {
	name: string;
	returnType: string;
	selectors: string[];
	schemaProperties: string[];
	complexity: number;
	body: string;
}

export class PythonAstParser {
	analyzePythonScraper(filePath: string): ScraperAnalysis {
		try {
			const result = execSync(
				`python3 src/migration/analyze_scraper.py "${filePath}"`,
				{
					encoding: "utf8",
					timeout: 10000,
				},
			);
			const analysis = JSON.parse(result) as ScraperAnalysis;
			return analysis;
		} catch (error) {
			throw new Error(`Failed to analyze Python scraper: ${error}`);
		}
	}

	analyzeScraperFromContent(
		content: string,
		filePath: string,
	): ScraperAnalysis {
		// Basic regex-based analysis as fallback
		const analysis: ScraperAnalysis = {
			className: this.extractClassName(content),
			hostName: this.extractHostName(content),
			methods: this.extractMethods(content),
			imports: this.extractImports(content),
			complexity: "simple",
			parsingStrategy: "schema",
			filePath,
		};

		// Determine complexity and strategy
		analysis.complexity = this.determineComplexity(analysis);
		analysis.parsingStrategy = this.determineParsingStrategy(content);

		return analysis;
	}

	private extractClassName(content: string): string {
		const match = content.match(/class\s+(\w+)\s*\(/);
		return match?.[1] ? match[1] : "";
	}

	private extractHostName(content: string): string {
		const match = content.match(
			/def\s+host\(\s*\):\s*\n\s*return\s+['"](.*?)['"]/,
		);
		return match?.[1] ? match[1] : "";
	}

	private extractMethods(content: string): MethodAnalysis[] {
		const methodRegex = /def\s+(\w+)\s*\([^)]*\):/g;
		const methods: MethodAnalysis[] = [];
		let match: RegExpExecArray | null;

		while (true) {
			match = methodRegex.exec(content);
			if (match === null) break;
			const methodName = match[1];
			if (
				typeof methodName !== "string" ||
				methodName.startsWith("_") ||
				methodName === "host"
			) {
				continue;
			}
			methods.push({
				name: methodName,
				returnType: this.inferReturnType(methodName),
				selectors: this.extractSelectorsFromMethod(content, methodName),
				schemaProperties: this.extractSchemaPropertiesFromMethod(
					content,
					methodName,
				),
				complexity: 1,
				body: this.extractMethodBody(content, methodName),
			});
		}

		return methods;
	}

	private extractImports(content: string): string[] {
		const imports: string[] = [];
		const importRegex = /(?:from\s+[\w.]+\s+)?import\s+([\w., ]+)/g;
		let match: RegExpExecArray | null;

		while (true) {
			match = importRegex.exec(content);
			if (match === null) break;
			if (match[1]) {
				imports.push(match[1].trim());
			}
		}

		return imports;
	}

	private inferReturnType(methodName: string): string {
		if (["ingredients", "instructions"].includes(methodName)) {
			return "string[]";
		}
		if (["total_time", "cook_time", "prep_time"].includes(methodName)) {
			return "number";
		}
		return "string";
	}

	private extractSelectorsFromMethod(
		content: string,
		methodName: string,
	): string[] {
		const selectors: string[] = [];
		const selectorRegex =
			/['"]([.#][\w-]+|[a-zA-Z][\w-]*(?:\[[\w-]+[=~|^$*]?['"']?[^'"']*['"']?\])?)['"]/g;

		// Extract method body (simplified)
		const methodStart = content.indexOf(`def ${methodName}(`);
		if (methodStart === -1) return selectors;

		const methodEnd = content.indexOf("\n\n", methodStart);
		const methodBody =
			typeof methodStart === "number" && methodStart !== -1
				? content.substring(
						methodStart,
						methodEnd !== -1 ? methodEnd : undefined,
					)
				: "";
		let match: RegExpExecArray | null;
		while (true) {
			match = selectorRegex.exec(methodBody);
			if (match === null) break;
			if (typeof match[1] === "string") {
				selectors.push(match[1]);
			}
		}

		return selectors;
	}

	private extractSchemaPropertiesFromMethod(
		content: string,
		methodName: string,
	): string[] {
		const properties: string[] = [];
		const schemaProps = [
			"recipeIngredient",
			"recipeInstructions",
			"totalTime",
			"cookTime",
			"prepTime",
			"recipeYield",
			"name",
			"description",
			"author",
			"image",
		];

		const methodStart = content.indexOf(`def ${methodName}(`);
		if (methodStart === -1) return properties;

		const methodEnd = content.indexOf("\n\n", methodStart);
		const methodBody =
			typeof methodStart === "number" && methodStart !== -1
				? content.substring(
						methodStart,
						methodEnd !== -1 ? methodEnd : undefined,
					)
				: "";

		for (const prop of schemaProps) {
			if (typeof methodBody === "string" && methodBody.includes(prop)) {
				properties.push(prop);
			}
		}

		return properties;
	}

	private extractMethodBody(content: string, methodName: string): string {
		const methodStart = content.indexOf(`def ${methodName}(`);
		if (methodStart === -1) return "";

		const methodEnd = content.indexOf("\n\n", methodStart);
		return content.substring(
			methodStart,
			methodEnd !== -1 ? methodEnd : undefined,
		);
	}

	private determineComplexity(
		analysis: ScraperAnalysis,
	): "simple" | "medium" | "complex" {
		const methodCount = analysis.methods.length;
		const totalComplexity = analysis.methods.reduce(
			(sum, method) => sum + method.complexity,
			0,
		);

		if (totalComplexity > 20 || methodCount > 15) {
			return "complex";
		} else if (totalComplexity > 10 || methodCount > 8) {
			return "medium";
		} else {
			return "simple";
		}
	}

	private determineParsingStrategy(
		content: string,
	): "schema" | "selectors" | "mixed" {
		const hasSchema = content.includes("schema") || content.includes("json");
		const hasSelectors =
			content.includes("soup.find") || content.includes("soup.select");

		if (hasSchema && hasSelectors) {
			return "mixed";
		} else if (hasSchema) {
			return "schema";
		} else {
			return "selectors";
		}
	}
}
