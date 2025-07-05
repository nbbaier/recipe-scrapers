import { AbstractScraper } from "@/core/AbstractScraper";
import { ElementNotFoundError } from "@/core/errors";

export class BonAppetit extends AbstractScraper {
	static host(): string {
		return "bonappetit.com";
	}

	host(): string {
		const element = this.$("bonappetit.com").first();
		return this.normalize(element.text());
	}

	totaltime(): number | null {
		return this.totaltimeFromSelector();
	}

	private totaltimeFromSelector(): number | null {
		return null; // No selectors found
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
