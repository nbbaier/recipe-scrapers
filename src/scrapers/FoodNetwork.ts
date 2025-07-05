import { AbstractScraper } from "@/core/AbstractScraper";
import { ElementNotFoundError } from "@/core/errors";

export class FoodNetwork extends AbstractScraper {
	static hostDomain(domain: string = "co.uk"): string {
		return `foodnetwork.${domain}`;
	}

	static host(domain: string = "co.uk"): string {
		return `foodnetwork.${domain}`;
	}

	host(): string {
		return FoodNetwork.hostDomain();
	}

	author(): string | null {
		// TODO: Need to add method to access copyrightNotice from schema.org data
		// For now, just return the schema.org author
		return this.schemaOrg.author();
	}

	site_name(): string | null {
		return this.schemaOrg.author();
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
