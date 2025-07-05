import { AbstractScraper } from "../core/AbstractScraper";
import { ElementNotFoundError } from "../core/errors";

export class Epicurious extends AbstractScraper {
	static host(): string {
		return "epicurious.com";
	}

	host(): string | null {
		const element = this.$("epicurious.com").first();
		if (!element.length) {
			return null;
		}
		return this.normalize(element.text());
	}

	author(): string | null {
		return this.schemaOrg.author() || this.authorFromSelector();
	}

	private authorFromSelector(): string | null {
		const element = this.$("a", "itemprop", "author").first();
		if (!element.length) {
			return null;
		}
		return this.normalize(element.text());
	}
}
