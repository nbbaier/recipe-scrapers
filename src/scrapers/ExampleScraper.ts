import { AbstractScraper } from "@/core/AbstractScraper.js";
import { ElementNotFoundError } from "@/errors.js";

export class ExampleScraper extends AbstractScraper {
	static host(): string {
		return "example.com";
	}

	host(): string {
		return ExampleScraper.host();
	}

	protected titleFromSelector(): string {
		const title = this.$("h1.recipe-title").text().trim();
		if (!title) {
			throw new ElementNotFoundError("h1.recipe-title");
		}
		return this.normalize(title);
	}

	protected ingredientsFromSelector(): string[] {
		const ingredients: string[] = [];
		this.$(".ingredients li").each((_, el) => {
			const ingredient = this.$(el).text().trim();
			if (ingredient) {
				ingredients.push(this.normalize(ingredient));
			}
		});

		if (ingredients.length === 0) {
			throw new ElementNotFoundError(".ingredients li");
		}

		return ingredients;
	}

	protected instructionsFromSelector(): string[] {
		const instructions: string[] = [];
		this.$(".instructions li, .instructions p").each((_, el) => {
			const instruction = this.$(el).text().trim();
			if (instruction) {
				instructions.push(this.normalize(instruction));
			}
		});

		if (instructions.length === 0) {
			throw new ElementNotFoundError(".instructions li, .instructions p");
		}

		return instructions;
	}

	protected totalTimeFromSelector(): number | null {
		const timeEl = this.$(".cooking-time").first();
		if (!timeEl.length) return null;

		const timeText = timeEl.text().trim();
		return this.getMinutes(timeText);
	}

	protected yieldsFromSelector(): string | null {
		const yieldsEl = this.$(".recipe-yield").first();
		if (!yieldsEl.length) return null;

		return this.normalize(yieldsEl.text());
	}

	protected imageFromSelector(): string | null {
		const imgEl = this.$(".recipe-image img").first();
		if (!imgEl.length) return null;

		const src = imgEl.attr("src");
		return src ? this.makeAbsoluteUrl(src) : null;
	}

	protected authorFromSelector(): string | null {
		const authorEl = this.$(".recipe-author").first();
		if (!authorEl.length) return null;

		return this.normalize(authorEl.text());
	}

	protected descriptionFromSelector(): string | null {
		const descEl = this.$(".recipe-description").first();
		if (!descEl.length) return null;

		return this.normalize(descEl.text());
	}
}
