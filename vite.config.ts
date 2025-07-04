import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	plugins: [dts()],
	build: {
		lib: {
			entry: "src/index.ts",
			name: "RecipeScrapers",
			fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
		},
		rollupOptions: {
			external: ["cheerio", "dayjs", "jsonld", "node-fetch"],
			output: {
				globals: {
					cheerio: "cheerio",
					dayjs: "dayjs",
					jsonld: "jsonld",
					"node-fetch": "fetch",
				},
			},
		},
	},
});
