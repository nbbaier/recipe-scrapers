import type { MethodAnalysis, ScraperAnalysis } from "./PythonAstParser";

export class TypeScriptTemplateGenerator {
	constructor(private analysis: ScraperAnalysis) {}

	generate(): string {
	const imports = this.generateImports();
	const classDeclaration = this.generateClassDeclaration();
	const hostMethod = this.generateHostMethod();
	const methods = this.generateMethods();
	const requiredMethods = this.generateRequiredAbstractMethods();
	
    return `${imports}

${classDeclaration}
	${hostMethod}
  
${methods}

${requiredMethods}
}
`.trim();
  }

	private generateImports(): string {
		const baseImports = [
			"import { AbstractScraper } from '../core/AbstractScraper';",
			"import { ElementNotFoundError } from '../core/errors';",
		];

		// Add conditional imports based on analysis
		if (this.analysis.complexity === "complex") {
			baseImports.push("import { parseTimeText } from '../utils/time';");
		}

		return baseImports.join("\n");
	}

	private generateClassDeclaration(): string {
		return `export class ${this.analysis.className} extends AbstractScraper {`;
	}

	private generateHostMethod(): string {
		return `static host(): string {
    return '${this.analysis.hostName}';
  }`;
	}

	private generateMethods(): string {
		return this.analysis.methods
			.filter((method) => !method.name.startsWith("_"))
			.map((method) => this.generateMethod(method))
			.join("\n\n  ");
	}

	private generateMethod(method: MethodAnalysis): string {
		switch (method.name) {
			case "title":
				return this.generateTitleMethod(method);
			case "ingredients":
				return this.generateIngredientsMethod(method);
			case "instructions":
				return this.generateInstructionsMethod(method);
			case "total_time":
				return this.generateTimeMethod(method, "totalTime");
			case "cook_time":
				return this.generateTimeMethod(method, "cookTime");
			case "prep_time":
				return this.generateTimeMethod(method, "prepTime");
			case "yields":
				return this.generateYieldsMethod(method);
			case "image":
				return this.generateImageMethod(method);
			case "author":
				return this.generateAuthorMethod(method);
			case "description":
				return this.generateDescriptionMethod(method);
			default:
				return this.generateGenericMethod(method);
		}
	}

	private generateTitleMethod(method: MethodAnalysis): string {
		if (method.schemaProperties.includes("name")) {
			return `title(): string {
    return this.schemaOrg.title() || this.titleFromSelector();
  }

  protected titleFromSelector(): string {
    ${this.generateSelectorLogic(method.selectors, "title")}
  }`;
		} else {
			return `title(): string {
    return this.titleFromSelector();
  }

  protected titleFromSelector(): string {
    ${this.generateSelectorLogic(method.selectors, "title")}
  }`;
		}
	}

	private generateIngredientsMethod(method: MethodAnalysis): string {
		if (method.schemaProperties.includes("recipeIngredient")) {
			return `ingredients(): string[] {
    return this.schemaOrg.ingredients() || this.ingredientsFromSelector();
  }

  protected ingredientsFromSelector(): string[] {
    ${this.generateSelectorLogic(method.selectors, "ingredients")}
  }`;
		} else {
			return `ingredients(): string[] {
    return this.ingredientsFromSelector();
  }

  protected ingredientsFromSelector(): string[] {
    ${this.generateSelectorLogic(method.selectors, "ingredients")}
  }`;
		}
	}

	private generateInstructionsMethod(method: MethodAnalysis): string {
		if (method.schemaProperties.includes("recipeInstructions")) {
			return `instructions(): string[] {
    return this.schemaOrg.instructions() || this.instructionsFromSelector();
  }

  protected instructionsFromSelector(): string[] {
    ${this.generateSelectorLogic(method.selectors, "instructions")}
  }`;
		} else {
			return `instructions(): string[] {
    return this.instructionsFromSelector();
  }

  protected instructionsFromSelector(): string[] {
    ${this.generateSelectorLogic(method.selectors, "instructions")}
  }`;
		}
	}

	private generateTimeMethod(method: MethodAnalysis, timeType: string): string {
		const schemaProperty =
			timeType === "totalTime"
				? "totalTime"
				: timeType === "cookTime"
					? "cookTime"
					: "prepTime";

		if (method.schemaProperties.includes(schemaProperty)) {
			return `${method.name.replace("_", "")}(): number | null {
    return this.schemaOrg.${timeType}() || this.${method.name.replace("_", "")}FromSelector();
  }

  private ${method.name.replace("_", "")}FromSelector(): number | null {
    ${this.generateSelectorLogic(method.selectors, "time")}
  }`;
		} else {
			return `${method.name.replace("_", "")}(): number | null {
    return this.${method.name.replace("_", "")}FromSelector();
  }

  private ${method.name.replace("_", "")}FromSelector(): number | null {
    ${this.generateSelectorLogic(method.selectors, "time")}
  }`;
		}
	}

	private generateYieldsMethod(method: MethodAnalysis): string {
		if (method.schemaProperties.includes("recipeYield")) {
			return `yields(): string | null {
    return this.schemaOrg.yields() || this.yieldsFromSelector();
  }

  private yieldsFromSelector(): string | null {
    ${this.generateSelectorLogic(method.selectors, "yields")}
  }`;
		} else {
			return `yields(): string | null {
    return this.yieldsFromSelector();
  }

  private yieldsFromSelector(): string | null {
    ${this.generateSelectorLogic(method.selectors, "yields")}
  }`;
		}
	}

	private generateImageMethod(method: MethodAnalysis): string {
		if (method.schemaProperties.includes("image")) {
			return `image(): string | null {
    return this.schemaOrg.image() || this.openGraph.image() || this.imageFromSelector();
  }

  private imageFromSelector(): string | null {
    ${this.generateSelectorLogic(method.selectors, "image")}
  }`;
		} else {
			return `image(): string | null {
    return this.openGraph.image() || this.imageFromSelector();
  }

  private imageFromSelector(): string | null {
    ${this.generateSelectorLogic(method.selectors, "image")}
  }`;
		}
	}

	private generateAuthorMethod(method: MethodAnalysis): string {
		if (method.schemaProperties.includes("author")) {
			return `author(): string | null {
    return this.schemaOrg.author() || this.authorFromSelector();
  }

  private authorFromSelector(): string | null {
    ${this.generateSelectorLogic(method.selectors, "author")}
  }`;
		} else {
			return `author(): string | null {
    return this.authorFromSelector();
  }

  private authorFromSelector(): string | null {
    ${this.generateSelectorLogic(method.selectors, "author")}
  }`;
		}
	}

	private generateDescriptionMethod(method: MethodAnalysis): string {
		if (method.schemaProperties.includes("description")) {
			return `description(): string | null {
    return this.schemaOrg.description() || this.openGraph.description() || this.descriptionFromSelector();
  }

  private descriptionFromSelector(): string | null {
    ${this.generateSelectorLogic(method.selectors, "description")}
  }`;
		} else {
			return `description(): string | null {
    return this.openGraph.description() || this.descriptionFromSelector();
  }

  private descriptionFromSelector(): string | null {
    ${this.generateSelectorLogic(method.selectors, "description")}
  }`;
		}
	}

	private generateGenericMethod(method: MethodAnalysis): string {
		return `${method.name}(): ${method.returnType} | null {
    ${this.generateSelectorLogic(method.selectors, "generic")}
  }`;
	}

	private generateSelectorLogic(selectors: string[], type: string): string {
		if (selectors.length === 0) {
			return this.generateFallbackLogic(type);
		}

		const selectorList = selectors.map((s) => `'${s}'`).join(", ");

		switch (type) {
			case "title":
				return `const element = this.$(${selectorList}).first();
    if (!element.length) {
      throw new ElementNotFoundError('title');
    }
    return this.normalize(element.text());`;

			case "ingredients":
				return `const elements = this.$(${selectorList});
    if (!elements.length) {
      throw new ElementNotFoundError('ingredients');
    }
    return elements.map((_, el) => this.normalize(this.$(el).text())).get();`;

			case "instructions":
				return `const elements = this.$(${selectorList});
    if (!elements.length) {
      throw new ElementNotFoundError('instructions');
    }
    return elements.map((_, el) => this.normalize(this.$(el).text())).get();`;

			case "time":
				return `const element = this.$(${selectorList}).first();
    if (!element.length) {
      return null;
    }
    const timeText = this.normalize(element.text());
    return parseTimeText(timeText);`;

			case "yields":
				return `const element = this.$(${selectorList}).first();
    if (!element.length) {
      return null;
    }
    return this.normalize(element.text());`;

			case "image":
				return `const element = this.$(${selectorList}).first();
    if (!element.length) {
      return null;
    }
    return element.attr('src') || element.attr('data-src') || null;`;

			case "author":
				return `const element = this.$(${selectorList}).first();
    if (!element.length) {
      return null;
    }
    return this.normalize(element.text());`;

			case "description":
				return `const element = this.$(${selectorList}).first();
    if (!element.length) {
      return null;
    }
    return this.normalize(element.text());`;

			default:
				return `const element = this.$(${selectorList}).first();
    if (!element.length) {
      return null;
    }
    return this.normalize(element.text());`;
		}
	}

	private generateFallbackLogic(type: string): string {
		switch (type) {
			case "title":
				return `throw new ElementNotFoundError('title - no selectors found');`;
			case "ingredients":
				return `throw new ElementNotFoundError('ingredients - no selectors found');`;
			case "instructions":
				return `throw new ElementNotFoundError('instructions - no selectors found');`;
			default:
				return `return null; // No selectors found`;
		}
	}

	private generateRequiredAbstractMethods(): string {
		const requiredMethods = ['title', 'ingredients', 'instructions'];
		const implementedMethods = this.analysis.methods.map(m => m.name);
		const missingMethods = requiredMethods.filter(method => !implementedMethods.includes(method));

		if (missingMethods.length === 0) {
			return '';
		}

		return missingMethods.map(methodName => {
			switch (methodName) {
				case 'title':
					return `  protected titleFromSelector(): string {
    throw new ElementNotFoundError('title - implement selector logic');
  }`;
				case 'ingredients':
					return `  protected ingredientsFromSelector(): string[] {
    throw new ElementNotFoundError('ingredients - implement selector logic');
  }`;
				case 'instructions':
					return `  protected instructionsFromSelector(): string[] {
    throw new ElementNotFoundError('instructions - implement selector logic');
  }`;
				default:
					return '';
			}
		}).join('\n\n');
	}

	generateTestFile(): string {
		return `import { ${this.analysis.className} } from '../../src/scrapers/${this.analysis.className}';
import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeEach } from 'vitest';

describe('${this.analysis.className}', () => {
  let scraper: ${this.analysis.className};
  let html: string;

  beforeEach(() => {
    html = readFileSync('tests/test_data/${this.analysis.className.toLowerCase()}.html', 'utf8');
    scraper = new ${this.analysis.className}(html, '${this.analysis.hostName}/recipe/test');
  });

  it('should have correct host', () => {
    expect(${this.analysis.className}.host()).toBe('${this.analysis.hostName}');
  });

  it('should extract title', () => {
    const title = scraper.title();
    expect(title).toBeDefined();
    expect(typeof title).toBe('string');
    expect(title.length).toBeGreaterThan(0);
  });

  it('should extract ingredients', () => {
    const ingredients = scraper.ingredients();
    expect(Array.isArray(ingredients)).toBe(true);
    expect(ingredients.length).toBeGreaterThan(0);
  });

  it('should extract instructions', () => {
    const instructions = scraper.instructions();
    expect(Array.isArray(instructions)).toBe(true);
    expect(instructions.length).toBeGreaterThan(0);
  });

  it('should convert to JSON', () => {
    const json = scraper.toJSON();
    expect(json).toHaveProperty('title');
    expect(json).toHaveProperty('ingredients');
    expect(json).toHaveProperty('instructions');
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
`;
	}
}
