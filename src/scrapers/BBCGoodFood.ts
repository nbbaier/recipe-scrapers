import { AbstractScraper } from '../core/AbstractScraper';
import { ElementNotFoundError } from '../core/errors';

export class BBCGoodFood extends AbstractScraper {
	static host(): string {
    return 'bbcgoodfood.com';
  }
  
host(): string | null {
    const element = this.$('bbcgoodfood.com').first();
    if (!element.length) {
      return null;
    }
    return this.normalize(element.text());
  }

  ingredient_groups(): string | null {
    const element = this.$('.recipe__ingredients h3', '.recipe__ingredients li').first();
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