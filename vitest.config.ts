import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		environment: "node",
		coverage: {
			reporter: ["text", "html", "lcov"],
			exclude: ["**/*.test.ts", "**/*.d.ts", "dist/**"],
		},
	},
});
