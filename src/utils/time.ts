/**
 * Parse ISO 8601 duration format (PT30M, PT1H30M, etc.)
 */
export function parseISO8601Duration(duration: string): number | null {
	if (!duration) return null;

	// Parse ISO 8601 duration format
	const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return null;

	const [, hours, minutes, seconds] = match;
	return (
		(hours ? parseInt(hours, 10) * 60 : 0) +
		(minutes ? parseInt(minutes, 10) : 0) +
		(seconds ? parseInt(seconds, 10) / 60 : 0)
	);
}

/**
 * Parse natural language time text
 */
export function parseTimeText(text: string): number | null {
	if (!text) return null;

	// Handle various time formats
	const timeRegex =
		/(?:(\d+)\s*(?:hours?|hrs?|h))?(?:(\d+)\s*(?:minutes?|mins?|m))?/i;
	const match = text.match(timeRegex);

	if (!match) return null;

	const [, hours, minutes] = match;
	return (
		(hours ? parseInt(hours, 10) * 60 : 0) +
		(minutes ? parseInt(minutes, 10) : 0)
	);
}
