import type * as cheerio from "cheerio";

export class OpenGraphParser {
	constructor(private $: cheerio.CheerioAPI) {}

	title(): string | null {
		return this.getMetaContent("og:title");
	}

	image(): string | null {
		return this.getMetaContent("og:image");
	}

	description(): string | null {
		return this.getMetaContent("og:description");
	}

	siteName(): string | null {
		return this.getMetaContent("og:site_name");
	}

	url(): string | null {
		return this.getMetaContent("og:url");
	}

	type(): string | null {
		return this.getMetaContent("og:type");
	}

	private getMetaContent(property: string): string | null {
		const meta = this.$(`meta[property="${property}"]`).first();
		return meta.attr("content") || null;
	}
}
