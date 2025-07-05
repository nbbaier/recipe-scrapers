import { AbstractScraper } from '../core/AbstractScraper';
import { ElementNotFoundError } from '../core/errors';

export class SeriousEats extends AbstractScraper {
	static host(): string {
    return 'seriouseats.com';
  }
  
host(): string | null {
    const element = this.$('seriouseats.com').first();
    if (!element.length) {
      return null;
    }
    return this.normalize(element.text());
  }

  protected titleFromSelector(): string {
    throw new ElementNotFoundError('title - implement selector logic');
  }

  protected ingredientsFromSelector(): string[] {
    throw new ElementNotFoundError('ingredients - implement selector logic');
  }

  protected instructionsFromSelector(): string[] {
    throw new ElementNotFoundError('instructions - implement selector logic');
  }
}