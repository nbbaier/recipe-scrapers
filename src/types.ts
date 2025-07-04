export interface NutritionData {
	calories?: number;
	protein?: string;
	carbohydrates?: string;
	fat?: string;
	fiber?: string;
	sodium?: string;
	sugar?: string;
	cholesterol?: string;
	saturatedFat?: string;
	unsaturatedFat?: string;
	transFat?: string;
}

export interface RecipeData {
	title: string;
	ingredients: string[];
	instructions: string[];
	totalTime?: number;
	cookTime?: number;
	prepTime?: number;
	yields?: string;
	servings?: number;
	image?: string;
	author?: string;
	description?: string;
	category?: string;
	cuisine?: string;
	tags?: string[];
	rating?: number;
	reviewCount?: number;
	nutrition?: NutritionData;
	canonicalUrl?: string;
	siteName?: string;
	datePublished?: string;
	dateModified?: string;
}

export interface ScraperOptions {
	timeout?: number;
	userAgent?: string;
	followRedirects?: boolean;
}
