import { AbstractScraper } from "@/core/AbstractScraper";
import { ElementNotFoundError } from "@/core/errors";

export class Delish extends AbstractScraper {
	static host(): string {
		return "delish.com";
	}

	host(): string {
		const element = this.$("delish.com").first();
		return this.normalize(element.text());
	}

	ingredient_groups(): string | null {
		const element = this.$(
			".ingredients-body h3",
			".ingredient-lists li",
		).first();
		if (!element.length) {
			return null;
		}
		return this.normalize(element.text());
	}

	protected titleFromSelector(): string {
		throw new ElementNotFoundError("title - implement selector logic");
	}

	protected ingredientsFromSelector(): string[] {
		throw new ElementNotFoundError("ingredients - implement selector logic");
	}

	protected instructionsFromSelector(): string[] {
		throw new ElementNotFoundError("instructions - implement selector logic");
	}
}
