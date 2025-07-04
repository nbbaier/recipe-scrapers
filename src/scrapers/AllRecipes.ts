import { AbstractScraper } from "../core/AbstractScraper";

export class AllRecipes extends AbstractScraper {
	protected titleFromSelector(): string {
		throw new Error("Method not implemented.");
	}
	protected ingredientsFromSelector(): string[] {
		throw new Error("Method not implemented.");
	}
	protected instructionsFromSelector(): string[] {
		throw new Error("Method not implemented.");
	}
	static host(): string {
		return "allrecipes.com";
	}

	host(): string | null {
		const element = this.$("allrecipes.com").first();
		if (!element.length) {
			return null;
		}
		return this.normalize(element.text());
	}
}
