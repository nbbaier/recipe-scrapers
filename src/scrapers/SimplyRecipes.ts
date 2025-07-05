import { AbstractScraper } from "@/core/AbstractScraper";
import { ElementNotFoundError } from "@/core/errors";

export class SimplyRecipes extends AbstractScraper {
	static host(): string {
		return "simplyrecipes.com";
	}

	host(): string {
		const element = this.$("simplyrecipes.com").first();
		return this.normalize(element.text());
	}

	instructions(): string[] {
		return this.instructionsFromSelector();
	}

	protected instructionsFromSelector(): string[] {
		const elements = this.$("div.structured-project__steps li p");
		if (!elements.length) {
			throw new ElementNotFoundError("instructions");
		}
		return elements.map((_, el) => this.normalize(this.$(el).text())).get();
	}

	protected titleFromSelector(): string {
		throw new ElementNotFoundError("title - implement selector logic");
	}

	protected ingredientsFromSelector(): string[] {
		throw new ElementNotFoundError("ingredients - implement selector logic");
	}
}
