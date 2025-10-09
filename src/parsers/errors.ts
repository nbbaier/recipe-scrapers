/**
 * Parser-specific error classes
 */

export class SchemaOrgException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaOrgException';
  }
}

export class OpenGraphException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenGraphException';
  }
}