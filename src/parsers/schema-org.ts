import * as cheerio from "cheerio";

interface RecipeData {
	"@type": string | string[];
	name?: string;
	recipeIngredient?: string[];
	recipeInstructions?: (string | { text?: string; name?: string })[];
	totalTime?: string;
	prepTime?: string;
	cookTime?: string;
	recipeYield?: string;
	yield?: string;
	image?: string | { url: string } | (string | { url: string })[];
	author?: string | { name: string } | (string | { name: string })[];
	description?: string;
	recipeCategory?: string;
	recipeCuisine?: string;
	[key: string]: unknown;
}

export class SchemaOrgParser {
	private jsonLdData: RecipeData[];
	private microdataData: RecipeData[];

	constructor(html: string) {
		this.jsonLdData = this.extractJsonLd(html);
		this.microdataData = this.extractMicrodata();
	}

	private extractJsonLd(html: string): RecipeData[] {
		const $ = cheerio.load(html);
		const scripts = $('script[type="application/ld+json"]');

		return scripts
			.map((_, el) => {
				try {
					const content = $(el).html();
					return content ? JSON.parse(content) : null;
				} catch {
					return null;
				}
			})
			.get()
			.filter(Boolean);
	}

	private extractMicrodata(): RecipeData[] {
		// TODO: Implement microdata extraction
		return [];
	}

	title(): string | null {
		return this.getRecipeProperty("name") as string | null;
	}

	ingredients(): string[] | null {
		return this.getRecipeProperty("recipeIngredient") as string[] | null;
	}

	instructions(): string[] | null {
		const instructions = this.getRecipeProperty("recipeInstructions") as
			| (string | { text?: string; name?: string })[]
			| null;
		if (!instructions) return null;

		return instructions.map(
			(inst: string | { text?: string; name?: string }) => {
				if (typeof inst === "string") return inst;
				if (inst.text) return inst.text;
				if (inst.name) return inst.name;
				return String(inst);
			},
		);
	}

	totalTime(): number | null {
		const time = this.getRecipeProperty("totalTime") as string | null;
		return time ? this.parseDuration(time) : null;
	}

	prepTime(): number | null {
		const time = this.getRecipeProperty("prepTime") as string | null;
		return time ? this.parseDuration(time) : null;
	}

	cookTime(): number | null {
		const time = this.getRecipeProperty("cookTime") as string | null;
		return time ? this.parseDuration(time) : null;
	}

	yields(): string | null {
		return (this.getRecipeProperty("recipeYield") ||
			this.getRecipeProperty("yield")) as string | null;
	}

	image(): string | null {
		const image = this.getRecipeProperty("image") as
			| string
			| { url: string }
			| (string | { url: string })[]
			| null;
		if (!image) return null;

		if (typeof image === "string") return image;
		if (typeof image === "object" && !Array.isArray(image) && image.url)
			return image.url;
		if (Array.isArray(image))
			return (typeof image[0] === "object" ? image[0]?.url : image[0]) || null;

		return null;
	}

	author(): string | null {
		const author = this.getRecipeProperty("author") as
			| string
			| { name: string }
			| (string | { name: string })[]
			| null;
		if (!author) return null;

		if (typeof author === "string") return author;
		if (
			typeof author === "object" &&
			!Array.isArray(author) &&
			"name" in author
		)
			return author.name;
		if (Array.isArray(author))
			return (
				(typeof author[0] === "object" ? author[0]?.name : author[0]) || null
			);

		return null;
	}

	description(): string | null {
		return this.getRecipeProperty("description") as string | null;
	}

	category(): string | null {
		return this.getRecipeProperty("recipeCategory") as string | null;
	}

	cuisine(): string | null {
		return this.getRecipeProperty("recipeCuisine") as string | null;
	}

	private getRecipeProperty(property: string): unknown {
		for (const data of this.jsonLdData) {
			if (this.isRecipeType(data)) {
				return data[property];
			}
		}
		return null;
	}

	private isRecipeType(data: RecipeData): boolean {
		const type = data["@type"];
		return (
			type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"))
		);
	}

	private parseDuration(duration: string): number | null {
		if (!duration) return null;

		// Handle ISO 8601 duration format (PT30M, PT1H30M, etc.)
		const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
		if (!match) return null;

		const [, hours, minutes, seconds] = match;
		return (
			(hours ? parseInt(hours, 10) * 60 : 0) +
			(minutes ? parseInt(minutes, 10) : 0) +
			(seconds ? Math.round((parseInt(seconds, 10) / 60) * 100) / 100 : 0)
		);
	}
}
