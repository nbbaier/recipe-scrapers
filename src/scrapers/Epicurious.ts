import { AbstractScraper } from "@/core/AbstractScraper";
import { ElementNotFoundError } from "@/core/errors";

export class Epicurious extends AbstractScraper {
	static host(): string {
		return "epicurious.com";
	}

	host(): string {
		const element = this.$("epicurious.com").first();
		return this.normalize(element.text());
	}

	author(): string | null {
		return this.schemaOrg.author() || this.authorFromSelector();
	}

	protected authorFromSelector(): string | null {
		const element = this.$("a", "itemprop", "author").first();
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
