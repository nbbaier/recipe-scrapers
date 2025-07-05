import { AbstractScraper } from '../core/AbstractScraper';
import { ElementNotFoundError } from '../core/errors';

export class Tasty extends AbstractScraper {
	static host(): string {
    return 'tasty.co';
  }
  
host(): string | null {
    const element = this.$('tasty.co').first();
    if (!element.length) {
      return null;
    }
    return this.normalize(element.text());
  }

  ingredient_groups(): string | null {
    const element = this.$('.ingredient-section-name', '.ingredient').first();
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