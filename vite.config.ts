import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import path from "path";

export default defineConfig({
	plugins: [dts()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
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
