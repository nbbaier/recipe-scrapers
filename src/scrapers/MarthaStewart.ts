import { AbstractScraper } from "@/core/AbstractScraper";
import { ElementNotFoundError } from "@/core/errors";

export class MarthaStewart extends AbstractScraper {
	static host(): string {
		return "marthastewart.com";
	}

	host(): string {
		const element = this.$("marthastewart.com").first();
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
