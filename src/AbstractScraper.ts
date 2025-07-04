import * as cheerio from "cheerio";
import { OpenGraphParser } from "./parsers/opengraph.js";
import { SchemaOrgParser } from "./parsers/schema-org.js";
import type { RecipeData } from "./types.js";
import { parseISO8601Duration, parseTimeText } from "./utils/time.js";

export abstract class AbstractScraper {
	protected html: string;
	protected url: string;
	protected $: cheerio.CheerioAPI;
	protected schemaOrg: SchemaOrgParser;
	protected openGraph: OpenGraphParser;

	constructor(html: string, url: string) {
		this.html = html;
		this.url = url;
		this.$ = cheerio.load(html);
		this.schemaOrg = new SchemaOrgParser(html);
		this.openGraph = new OpenGraphParser(this.$);
	}

	// Abstract methods that must be implemented
	abstract host(): string;

	// Methods with default implementations
	title(): string {
		return (
			this.schemaOrg.title() ||
			this.openGraph.title() ||
			this.titleFromSelector()
		);
	}

	ingredients(): string[] {
		return this.schemaOrg.ingredients() || this.ingredientsFromSelector();
	}

	instructions(): string[] {
		return this.schemaOrg.instructions() || this.instructionsFromSelector();
	}

	totalTime(): number | null {
		return this.schemaOrg.totalTime() || this.totalTimeFromSelector();
	}

	cookTime(): number | null {
		return this.schemaOrg.cookTime() || this.cookTimeFromSelector();
	}

	prepTime(): number | null {
		return this.schemaOrg.prepTime() || this.prepTimeFromSelector();
	}

	yields(): string | null {
		return this.schemaOrg.yields() || this.yieldsFromSelector();
	}

	servings(): number | null {
		return this.servingsFromSelector();
	}

	image(): string | null {
		return (
			this.schemaOrg.image() ||
			this.openGraph.image() ||
			this.imageFromSelector()
		);
	}

	author(): string | null {
		return this.schemaOrg.author() || this.authorFromSelector();
	}

	description(): string | null {
		return (
			this.schemaOrg.description() ||
			this.openGraph.description() ||
			this.descriptionFromSelector()
		);
	}

	category(): string | null {
		return this.schemaOrg.category() || this.categoryFromSelector();
	}

	cuisine(): string | null {
		return this.schemaOrg.cuisine() || this.cuisineFromSelector();
	}

	tags(): string[] | null {
		return this.tagsFromSelector();
	}

	rating(): number | null {
		return this.ratingFromSelector();
	}

	reviewCount(): number | null {
		return this.reviewCountFromSelector();
	}

	canonicalUrl(): string | null {
		return this.canonicalUrlFromSelector();
	}

	siteName(): string | null {
		return this.openGraph.siteName() || this.siteNameFromSelector();
	}

	datePublished(): string | null {
		return this.datePublishedFromSelector();
	}

	dateModified(): string | null {
		return this.dateModifiedFromSelector();
	}

	// Abstract methods for custom parsing
	protected abstract titleFromSelector(): string;
	protected abstract ingredientsFromSelector(): string[];
	protected abstract instructionsFromSelector(): string[];

	// Optional methods with default implementations
	protected totalTimeFromSelector(): number | null {
		return null;
	}

	protected cookTimeFromSelector(): number | null {
		return null;
	}

	protected prepTimeFromSelector(): number | null {
		return null;
	}

	protected yieldsFromSelector(): string | null {
		return null;
	}

	protected servingsFromSelector(): number | null {
		return null;
	}

	protected imageFromSelector(): string | null {
		return null;
	}

	protected authorFromSelector(): string | null {
		return null;
	}

	protected descriptionFromSelector(): string | null {
		return null;
	}

	protected categoryFromSelector(): string | null {
		return null;
	}

	protected cuisineFromSelector(): string | null {
		return null;
	}

	protected tagsFromSelector(): string[] | null {
		return null;
	}

	protected ratingFromSelector(): number | null {
		return null;
	}

	protected reviewCountFromSelector(): number | null {
		return null;
	}

	protected canonicalUrlFromSelector(): string | null {
		const canonical = this.$('link[rel="canonical"]').attr("href");
		return canonical || null;
	}

	protected siteNameFromSelector(): string | null {
		return null;
	}

	protected datePublishedFromSelector(): string | null {
		return null;
	}

	protected dateModifiedFromSelector(): string | null {
		return null;
	}

	// Utility methods
	protected normalize(text: string): string {
		return text.trim().replace(/\s+/g, " ");
	}

	protected getMinutes(timeStr: string): number | null {
		return parseISO8601Duration(timeStr) || parseTimeText(timeStr);
	}

	protected makeAbsoluteUrl(url: string): string {
		if (url.startsWith("http")) {
			return url;
		}
		const baseUrl = new URL(this.url);
		return new URL(url, baseUrl.origin).toString();
	}

	// Convert to JSON
	toJSON(): RecipeData {
		const result: RecipeData = {
			title: this.title(),
			ingredients: this.ingredients(),
			instructions: this.instructions(),
		};

		// Add optional fields only if they have values
		const totalTime = this.totalTime();
		if (totalTime !== null) result.totalTime = totalTime;

		const cookTime = this.cookTime();
		if (cookTime !== null) result.cookTime = cookTime;

		const prepTime = this.prepTime();
		if (prepTime !== null) result.prepTime = prepTime;

		const yields = this.yields();
		if (yields !== null) result.yields = yields;

		const servings = this.servings();
		if (servings !== null) result.servings = servings;

		const image = this.image();
		if (image !== null) result.image = image;

		const author = this.author();
		if (author !== null) result.author = author;

		const description = this.description();
		if (description !== null) result.description = description;

		const category = this.category();
		if (category !== null) result.category = category;

		const cuisine = this.cuisine();
		if (cuisine !== null) result.cuisine = cuisine;

		const tags = this.tags();
		if (tags !== null) result.tags = tags;

		const rating = this.rating();
		if (rating !== null) result.rating = rating;

		const reviewCount = this.reviewCount();
		if (reviewCount !== null) result.reviewCount = reviewCount;

		const canonicalUrl = this.canonicalUrl();
		if (canonicalUrl !== null) result.canonicalUrl = canonicalUrl;

		const siteName = this.siteName();
		if (siteName !== null) result.siteName = siteName;

		const datePublished = this.datePublished();
		if (datePublished !== null) result.datePublished = datePublished;

		const dateModified = this.dateModified();
		if (dateModified !== null) result.dateModified = dateModified;

		return result;
	}
}
