import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		coverage: {
			reporter: ["text", "html", "lcov"],
			exclude: ["**/*.test.ts", "**/*.d.ts", "dist/**"],
		},
	},
});
