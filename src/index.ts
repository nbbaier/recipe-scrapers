export * from "./errors.js";
export { OpenGraphParser } from "./parsers/opengraph.js";
export { SchemaOrgParser } from "./parsers/schema-org.js";
export * from "./types.js";
export { parseISO8601Duration, parseTimeText } from "./utils/time.js";

import type { AbstractScraper } from "./core/AbstractScraper.js";
import { AllRecipes } from "./scrapers/AllRecipes.js";

export const SCRAPERS: Record<string, typeof AbstractScraper> = {
	"allrecipes.com": AllRecipes,
};

export { AbstractScraper } from "./core/AbstractScraper.js";
export { AllRecipes } from "./scrapers/AllRecipes.js";
