import { beforeEach, describe, expect, it } from "vitest";
import { ExampleScraper } from "../src/scrapers/ExampleScraper.js";

describe("ExampleScraper", () => {
	let scraper: ExampleScraper;

	const mockHtml = `
		<html>
			<head>
				<title>Test Recipe</title>
				<script type="application/ld+json">
				{
					"@type": "Recipe",
					"name": "Schema Recipe Title",
					"recipeIngredient": ["Schema ingredient 1", "Schema ingredient 2"],
					"recipeInstructions": [
						{"@type": "HowToStep", "text": "Schema instruction 1"},
						{"@type": "HowToStep", "text": "Schema instruction 2"}
					],
					"totalTime": "PT30M",
					"image": "https://example.com/recipe.jpg",
					"author": {"@type": "Person", "name": "Schema Author"}
				}
				</script>
			</head>
			<body>
				<h1 class="recipe-title">HTML Recipe Title</h1>
				<div class="ingredients">
					<ul>
						<li>HTML ingredient 1</li>
						<li>HTML ingredient 2</li>
					</ul>
				</div>
				<div class="instructions">
					<ol>
						<li>HTML instruction 1</li>
						<li>HTML instruction 2</li>
					</ol>
				</div>
				<div class="cooking-time">30 minutes</div>
				<div class="recipe-yield">4 servings</div>
				<div class="recipe-image">
					<img src="/recipe.jpg" alt="Recipe">
				</div>
				<div class="recipe-author">HTML Author</div>
				<div class="recipe-description">A delicious test recipe</div>
			</body>
		</html>
	`;

	beforeEach(() => {
		scraper = new ExampleScraper(mockHtml, "https://example.com/recipe");
	});

	it("should return the correct host", () => {
		expect(scraper.host()).toBe("example.com");
		expect(ExampleScraper.host()).toBe("example.com");
	});

	it("should extract title from schema.org (preferred)", () => {
		expect(scraper.title()).toBe("Schema Recipe Title");
	});

	it("should extract ingredients from schema.org (preferred)", () => {
		const ingredients = scraper.ingredients();
		expect(ingredients).toHaveLength(2);
		expect(ingredients[0]).toBe("Schema ingredient 1");
		expect(ingredients[1]).toBe("Schema ingredient 2");
	});

	it("should extract instructions from schema.org (preferred)", () => {
		const instructions = scraper.instructions();
		expect(instructions).toHaveLength(2);
		expect(instructions[0]).toBe("Schema instruction 1");
		expect(instructions[1]).toBe("Schema instruction 2");
	});

	it("should parse total time correctly", () => {
		expect(scraper.totalTime()).toBe(30);
	});

	it("should extract image from schema.org", () => {
		expect(scraper.image()).toBe("https://example.com/recipe.jpg");
	});

	it("should extract author from schema.org", () => {
		expect(scraper.author()).toBe("Schema Author");
	});

	it("should convert to JSON correctly", () => {
		const json = scraper.toJSON();
		expect(json.title).toBe("Schema Recipe Title");
		expect(json.ingredients).toHaveLength(2);
		expect(json.instructions).toHaveLength(2);
		expect(json.totalTime).toBe(30);
		expect(json.image).toBe("https://example.com/recipe.jpg");
		expect(json.author).toBe("Schema Author");
	});

	it("should fallback to HTML selectors when schema.org is not available", () => {
		const htmlOnlyContent = `
			<html>
				<body>
					<h1 class="recipe-title">HTML Only Title</h1>
					<div class="ingredients">
						<ul>
							<li>HTML ingredient 1</li>
							<li>HTML ingredient 2</li>
						</ul>
					</div>
					<div class="instructions">
						<ol>
							<li>HTML instruction 1</li>
							<li>HTML instruction 2</li>
						</ol>
					</div>
					<div class="cooking-time">45 minutes</div>
					<div class="recipe-yield">6 servings</div>
					<div class="recipe-image">
						<img src="/html-recipe.jpg" alt="HTML Recipe">
					</div>
					<div class="recipe-author">HTML Author</div>
					<div class="recipe-description">HTML recipe description</div>
				</body>
			</html>
		`;

		const htmlOnlyScraper = new ExampleScraper(
			htmlOnlyContent,
			"https://example.com/html-recipe",
		);

		expect(htmlOnlyScraper.title()).toBe("HTML Only Title");
		expect(htmlOnlyScraper.ingredients()).toHaveLength(2);
		expect(htmlOnlyScraper.instructions()).toHaveLength(2);
		expect(htmlOnlyScraper.totalTime()).toBe(45);
		expect(htmlOnlyScraper.yields()).toBe("6 servings");
		expect(htmlOnlyScraper.image()).toBe("https://example.com/html-recipe.jpg");
		expect(htmlOnlyScraper.author()).toBe("HTML Author");
		expect(htmlOnlyScraper.description()).toBe("HTML recipe description");
	});
});
