import { AbstractScraper } from "../core/AbstractScraper";
import { ElementNotFoundError } from "../core/errors";

export class ACoupleCooks extends AbstractScraper {
	static host(): string {
		return "acouplecooks.com";
	}

	host(): string | null {
		const element = this.$("acouplecooks.com").first();
		if (!element.length) {
			return null;
		}
		return this.normalize(element.text());
	}

	ingredient_groups(): string | null {
		const element = this.$(
			".tasty-recipes-ingredients-body p b",
			".tasty-recipes-ingredients-body ul li",
		).first();
		if (!element.length) {
			return null;
		}
		return this.normalize(element.text());
	}

	ingredients(): string[] {
		return this.ingredientsFromSelector();
	}

	protected ingredientsFromSelector(): string[] {
		const elements = this.$(".tasty-recipes-ingredients-body ul li");
		if (!elements.length) {
			throw new ElementNotFoundError("ingredients");
		}
		return elements.map((_, el) => this.normalize(this.$(el).text())).get();
	}

	protected titleFromSelector(): string {
		throw new ElementNotFoundError("title - implement selector logic");
	}

	protected instructionsFromSelector(): string[] {
		throw new ElementNotFoundError("instructions - implement selector logic");
	}
}
