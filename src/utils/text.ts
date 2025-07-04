/**
 * Normalize text by trimming and collapsing whitespace
 */
export function normalize(text: string): string {
	return text.trim().replace(/\s+/g, " ");
}

/**
 * Clean ingredient text by removing extra whitespace and common prefixes
 */
export function cleanIngredient(ingredient: string): string {
	return normalize(ingredient)
		.replace(/^[-•*]\s*/, "") // Remove bullet points
		.replace(/^\d+\.\s*/, ""); // Remove numbered lists
}

/**
 * Clean instruction text
 */
export function cleanInstruction(instruction: string): string {
	return normalize(instruction)
		.replace(/^step\s*\d+:?\s*/i, "") // Remove "Step 1:" prefixes
		.replace(/^\d+\.\s*/, ""); // Remove numbered lists
}

/**
 * Extract numeric value from text
 */
export function extractNumber(text: string): number | null {
	const match = text.match(/(\d+(?:\.\d+)?)/);
	return match?.[1] ? parseFloat(match[1]) : null;
}

/**
 * Convert text to title case
 */
export function toTitleCase(text: string): string {
	return text.replace(
		/\w\S*/g,
		(txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
	);
}
