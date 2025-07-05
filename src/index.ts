export { AbstractScraper } from "./core/AbstractScraper.js";
export * from "./errors.js";
export { OpenGraphParser } from "./parsers/opengraph.js";
export { SchemaOrgParser } from "./parsers/schema-org.js";
export * from "./types.js";
export { parseISO8601Duration, parseTimeText } from "./utils/time.js";

import type { AbstractScraper } from "./core/AbstractScraper.js";

import { ACoupleCooks } from "./scrapers/ACoupleCooks.js";
import { AllRecipes } from "./scrapers/AllRecipes.js";
import { BBCGoodFood } from "./scrapers/BBCGoodFood.js";
import { BonAppetit } from "./scrapers/BonAppetit.js";
import { Delish } from "./scrapers/Delish.js";
import { Epicurious } from "./scrapers/Epicurious.js";
import { ExampleScraper } from "./scrapers/ExampleScraper.js";
import { FoodNetwork } from "./scrapers/FoodNetwork.js";
import { MarthaStewart } from "./scrapers/MarthaStewart.js";
import { SeriousEats } from "./scrapers/SeriousEats.js";
import { SimplyRecipes } from "./scrapers/SimplyRecipes.js";
import { Tasty } from "./scrapers/Tasty.js";

// Scraper registry for dynamic testing
export const SCRAPERS: Record<string, typeof AbstractScraper> = {
	"acoupleofcooks.com": ACoupleCooks,
	"allrecipes.com": AllRecipes,
	"bbcgoodfood.com": BBCGoodFood,
	"bonappetit.com": BonAppetit,
	"delish.com": Delish,
	"epicurious.com": Epicurious,
	"example.com": ExampleScraper,
	"foodnetwork.com": FoodNetwork,
	"marthastewar.com": MarthaStewart,
	"seriouseats.com": SeriousEats,
	"simplyrecipes.com": SimplyRecipes,
	"tasty.co": Tasty,
};

// Export individual scrapers
export {
	ACoupleCooks,
	AllRecipes,
	BBCGoodFood,
	BonAppetit,
	Delish,
	Epicurious,
	ExampleScraper,
	FoodNetwork,
	MarthaStewart,
	SeriousEats,
	SimplyRecipes,
	Tasty,
};
