import { AbstractScraper } from "@/core/AbstractScraper";
import { ElementNotFoundError } from "@/core/errors";

export class AllRecipes extends AbstractScraper {
	static host(): string {
		return "allrecipes.com";
	}

	host(): string {
		return AllRecipes.host();
	}

	instructions_list(): string[] {
		const value = this.instructions();
		return this.normalizeOutput(value, "instructions_list");
	}

	toJSON() {
		// biome-ignore lint/suspicious/noExplicitAny: temp
		const result: any = {};
		result.author = this.author ? this.author() : null;
		result.canonicalUrl = this.canonicalUrl ? this.canonicalUrl() : null;
		result.siteName = this.siteName ? this.siteName() : null;
		result.host = this.host();
		result.language = this.language ? this.language() : null;
		result.title = this.title();
		result.ingredients = this.ingredients();
		// result.ingredientGroups = this.ingredientGroups();
		result.instructions = this.instructions();
		result.instructions_list = this.instructions_list
			? this.instructions_list()
			: null;
		result.category = this.category ? this.category() : null;
		result.yields = this.yields();
		result.description = this.description ? this.description() : null;
		result.totalTime = this.totalTime ? this.totalTime() : null;
		result.cookTime = this.cookTime ? this.cookTime() : null;
		result.prepTime = this.prepTime ? this.prepTime() : null;
		result.cuisine = this.cuisine ? this.cuisine() : null;
		// result.cookingMethod = this.cookingMethod ? this.cookingMethod() : null;
		result.ratings = this.rating ? this.rating() : null;
		result.ratingsCount = this.reviewCount ? this.reviewCount() : null;
		// result.equipment = this.equipment ? this.equipment() : null;
		// result.reviews = this.reviews ? this.reviews() : null;
		// result.nutrients = this.nutrients ? this.nutrients() : null;
		// result.dietary_restrictions = this.dietary_restrictions
		//    ? this.dietary_restrictions()
		//    : null;
		result.image = this.image();
		// result.keywords = this.keywords ? this.keywords() : null;
		return result;
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
