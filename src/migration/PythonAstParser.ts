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
	private pythonScript: string;

	constructor() {
		this.pythonScript = `
import ast
import json
import sys
import re

def analyze_scraper(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    tree = ast.parse(content)

    analysis = {
        'className': '',
        'hostName': '',
        'methods': [],
        'imports': [],
        'complexity': 'simple',
        'parsingStrategy': 'schema',
        'filePath': file_path
    }

    # Extract imports
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                analysis['imports'].append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                for alias in node.names:
                    analysis['imports'].append(f"{node.module}.{alias.name}")

    # Find class definition
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            analysis['className'] = node.name

            # Extract methods
            for item in node.body:
                if isinstance(item, ast.FunctionDef):
                    method_analysis = analyze_method(item, content)
                    analysis['methods'].append(method_analysis)

                    # Extract host name from host() method
                    if item.name == 'host':
                        host_name = extract_host_name(item)
                        if host_name:
                            analysis['hostName'] = host_name

    # Determine complexity and parsing strategy
    analysis['complexity'] = determine_complexity(analysis)
    analysis['parsingStrategy'] = determine_parsing_strategy(analysis, content)

    return analysis

def analyze_method(method_node, content):
    method_analysis = {
        'name': method_node.name,
        'returnType': 'string',
        'selectors': [],
        'schemaProperties': [],
        'complexity': 0,
        'body': ''
    }

    # Extract method body as string
    if method_node.lineno and method_node.end_lineno:
        lines = content.split('\\n')
        method_body = '\\n'.join(lines[method_node.lineno-1:method_node.end_lineno])
        method_analysis['body'] = method_body

    # Extract CSS selectors
    for node in ast.walk(method_node):
        if isinstance(node, ast.Str):
            selector = extract_css_selector(node.s)
            if selector:
                method_analysis['selectors'].append(selector)

    # Extract schema.org properties
    for node in ast.walk(method_node):
        if isinstance(node, ast.Str):
            schema_prop = extract_schema_property(node.s)
            if schema_prop:
                method_analysis['schemaProperties'].append(schema_prop)

    # Calculate complexity
    method_analysis['complexity'] = calculate_method_complexity(method_node)

    # Determine return type
    if method_node.name in ['ingredients', 'instructions']:
        method_analysis['returnType'] = 'string[]'
    elif method_node.name in ['total_time', 'cook_time', 'prep_time']:
        method_analysis['returnType'] = 'number'

    return method_analysis

def extract_host_name(method_node):
    for node in ast.walk(method_node):
        if isinstance(node, ast.Return) and isinstance(node.value, ast.Str):
            return node.value.s
    return None

def extract_css_selector(text):
    # Common CSS selector patterns
    css_patterns = [
        r'[.#][\w-]+',  # Class or ID selectors
        r'[a-zA-Z][\w-]*(?:\[[\w-]+[=~|^$*]?["\']?[^"\']*["\']?\])?',  # Element selectors with attributes
        r'[a-zA-Z][\w-]*:[\w-]+',  # Pseudo selectors
    ]

    for pattern in css_patterns:
        if re.search(pattern, text):
            return text
    return None

def extract_schema_property(text):
    # Schema.org property patterns
    schema_patterns = [
        r'recipeIngredient',
        r'recipeInstructions',
        r'totalTime',
        r'cookTime',
        r'prepTime',
        r'recipeYield',
        r'name',
        r'description',
        r'author',
        r'image',
        r'datePublished',
        r'nutrition'
    ]

    for pattern in schema_patterns:
        if pattern in text:
            return pattern
    return None

def calculate_method_complexity(method_node):
    complexity = 0

    for node in ast.walk(method_node):
        if isinstance(node, (ast.If, ast.While, ast.For)):
            complexity += 1
        elif isinstance(node, ast.Try):
            complexity += 1
        elif isinstance(node, ast.Call):
            complexity += 0.5

    return int(complexity)

def determine_complexity(analysis):
    total_complexity = sum(method['complexity'] for method in analysis['methods'])
    method_count = len(analysis['methods'])

    if total_complexity > 20 or method_count > 15:
        return 'complex'
    elif total_complexity > 10 or method_count > 8:
        return 'medium'
    else:
        return 'simple'

def determine_parsing_strategy(analysis, content):
    schema_count = sum(len(method['schemaProperties']) for method in analysis['methods'])
    selector_count = sum(len(method['selectors']) for method in analysis['methods'])

    if 'schema' in content.lower() or 'json' in content.lower():
        if selector_count > 0:
            return 'mixed'
        else:
            return 'schema'
    else:
        return 'selectors'

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python analyze_scraper.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]
    try:
        analysis = analyze_scraper(file_path)
        print(json.dumps(analysis, indent=2))
    except Exception as e:
        print(f"Error analyzing {file_path}: {e}", file=sys.stderr)
        sys.exit(1)
`;
	}

	analyzePythonScraper(filePath: string): ScraperAnalysis {
		try {
			// Create temporary Python script
			const tempScript = "/tmp/analyze_scraper.py";
			require("node:fs").writeFileSync(tempScript, this.pythonScript);

			// Execute Python script
			const result = execSync(`python3 ${tempScript} "${filePath}"`, {
				encoding: "utf8",
				timeout: 10000,
			});

			const analysis = JSON.parse(result) as ScraperAnalysis;

			// Clean up temp file
			require("node:fs").unlinkSync(tempScript);

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
		let match;

		while ((match = methodRegex.exec(content)) !== null) {
			const methodName = match[1];

			// Skip private methods and special methods
			if (methodName.startsWith("_") || methodName === "host") {
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
		let match;

		while ((match = importRegex.exec(content)) !== null) {
			imports.push(match[1].trim());
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
		const methodBody = content.substring(
			methodStart,
			methodEnd !== -1 ? methodEnd : undefined,
		);

		let match;
		while ((match = selectorRegex.exec(methodBody)) !== null) {
			selectors.push(match[1]);
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
		const methodBody = content.substring(
			methodStart,
			methodEnd !== -1 ? methodEnd : undefined,
		);

		for (const prop of schemaProps) {
			if (methodBody.includes(prop)) {
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
