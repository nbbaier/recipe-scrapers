export class ElementNotFoundError extends Error {
	constructor(selector: string) {
		super(`Element not found: ${selector}`);
		this.name = "ElementNotFoundError";
	}
}

export class SchemaOrgException extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SchemaOrgException";
	}
}

export class OpenGraphException extends Error {
	constructor(message: string) {
		super(message);
		this.name = "OpenGraphException";
	}
}

export class ScraperException extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ScraperException";
	}
}
