# Recipe-Scrapers TypeScript Porting Guide

## Overview

This document provides a comprehensive architectural analysis of the Python recipe-scrapers library to guide its port to TypeScript. The library is a sophisticated recipe extraction system supporting 400+ cooking websites through a unified abstraction layer.

## Core Architecture

### Design Philosophy

The library follows a **"uniform façade" pattern** where all external interactions go through a single `AbstractScraper` interface. This design provides:

-  **Convention over configuration**: Scrapers are auto-discovered by hostname patterns
-  **Layered extraction**: Three-tier fallback system (site-specific → Schema.org → OpenGraph)
-  **Plugin-driven extensibility**: Runtime method decoration for data transformation and fallbacks

### Key Components

1. **AbstractScraper** (`_abstract.py`)

   -  Base class defining ~25 public methods (title, ingredients, instructions, etc.)
   -  Manages HTML parsing, plugin initialization, and data extraction coordination
   -  Provides uniform API regardless of underlying site complexity

2. **Site-Specific Scrapers** (400+ files)

   -  Each inherits from AbstractScraper
   -  Implements subset of methods using CSS selectors and site-specific logic
   -  Named by convention: `allrecipes.py` → `AllRecipes` class

3. **Schema.org Helper** (`_schemaorg.py`)

   -  Parses JSON-LD and microdata using `extruct` library
   -  Handles complex nested structures (HowToSection, graph arrays)
   -  Provides fallback data when site scrapers fail

4. **OpenGraph Helper** (`_opengraph.py`)

   -  Minimal fallback for basic metadata (site name, image)
   -  Last resort in the extraction hierarchy

5. **Plugin System** (`plugins/`)
   -  Runtime method decoration for cross-cutting concerns
   -  Types: Fill plugins (Schema.org, OpenGraph), Transform plugins (normalize strings, strip HTML)
   -  Configured via `settings.PLUGINS`

## Data Flow

```
Client Call → Factory Selection → Scraper Construction → Plugin Wrapping → Method Calls → Result
```

1. **Factory Selection**: `scrape_html()` picks scraper class from `SCRAPERS` registry or creates generic Schema.org scraper
2. **Construction**: Parses HTML with BeautifulSoup, initializes helpers, wraps methods with plugins
3. **Method Calls**: Site-specific logic → Plugin fallbacks → Schema.org → OpenGraph
4. **Result**: Normalized data via `to_json()` or individual field accessors

## Plugin System Deep Dive

### Architecture

-  Plugins declare `run_on_hosts` and `run_on_methods` class variables
-  During first instantiation, constructor uses reflection to wrap applicable methods
-  Runtime decoration happens once per class, not per instance

### Plugin Categories

-  **Fill Plugins**: Provide fallback data (Schema.org, OpenGraph)
-  **Transform Plugins**: Normalize strings, strip HTML, parse durations
-  **Extension Point**: External users can implement custom plugins

## Error Handling Strategy

Hierarchical exception system:

-  `WebsiteNotImplementedError`: Unsupported site
-  `RecipeSchemaNotFound`: Missing structured data
-  `ElementNotFoundInHtml`: Specific field not found
-  `StaticValueWarning`: Known missing fields (soft errors)

## Testing Approach

-  **Fixture-based**: Each scraper has HTML sample + expected values
-  **Parametrized tests**: Loop over all scrapers validating core fields
-  **Utility isolation**: Separate tests for parsing functions
-  **Plugin validation**: Mock scrapers for behavior testing

## Critical Dependencies

| Python           | Purpose                         | TypeScript Equivalent                    |
| ---------------- | ------------------------------- | ---------------------------------------- |
| `beautifulsoup4` | HTML parsing                    | `cheerio`, `jsdom`, `node-html-parser`   |
| `extruct`        | Schema.org/microdata extraction | Custom JSON-LD parser + `microdata-node` |
| `isodate`        | ISO duration parsing            | `iso8601-duration`, `dayjs`              |
| `requests`       | HTTP client                     | `node-fetch`, `axios` (optional)         |

## TypeScript Porting Challenges

### 1. Dynamic Method Decoration

**Challenge**: Python's monkey-patching doesn't translate directly to TypeScript
**Solution**: Use Proxy-based decoration or instance method mutation

```typescript
const scraperProxy = createPluginProxy(scraperInstance, plugins);
return scraperProxy as T; // preserves typing
```

### 2. Reflection & Method Enumeration

**Challenge**: Python's `dir(self)` for method discovery
**Solution**: `Object.getOwnPropertyNames(Object.getPrototypeOf(instance))`

### 3. Schema.org Extraction

**Challenge**: No direct `extruct` equivalent
**Solution**:

-  JSON-LD: Parse `<script type="application/ld+json">` tags
-  Microdata: Use `microdata-node` library
-  Focus on JSON-LD first (covers majority of sites)

### 4. Unicode & Regex Handling

**Challenge**: Unicode fraction characters and complex regex patterns
**Solution**: Ensure ICU support, test Unicode handling thoroughly

### 5. Type Safety

**Challenge**: Dynamic nature of scrapers vs static typing
**Solution**:

-  Define comprehensive `Recipe` interface with optional fields
-  Use union types for error handling
-  Implement custom Error subclasses

## Recommended Migration Path

### Phase 1: Core Infrastructure

1. Port `AbstractScraper` with Cheerio integration
2. Implement basic utility functions (`_utils.py`)
3. Create plugin system with Proxy-based decoration
4. Port exception hierarchy

### Phase 2: Data Extraction

1. Port Schema.org helper (JSON-LD only initially)
2. Port OpenGraph helper
3. Implement core plugins (normalize strings, Schema.org fill)
4. Create factory system and scraper registry

### Phase 3: Scraper Implementation

1. Auto-generate TypeScript scraper stubs from Python files
2. Port high-priority scrapers (top 10-20 sites)
3. Implement testing framework with fixtures
4. Create automated conversion tools for remaining scrapers

### Phase 4: Optimization & Polish

1. Performance optimization (memory usage, parsing speed)
2. Browser compatibility build
3. ESM/CJS dual packaging
4. Documentation and examples

## Implementation Notes

### Plugin Proxy Pattern

```typescript
function createPluginProxy<T extends AbstractScraper>(
   instance: T,
   plugins: Plugin[]
): T {
   return new Proxy(instance, {
      get(target, prop) {
         const method = target[prop];
         if (typeof method === "function") {
            return plugins.reduce((fn, plugin) => {
               return plugin.shouldRun(target.host(), prop as string)
                  ? plugin.run(fn)
                  : fn;
            }, method);
         }
         return method;
      },
   });
}
```

### Type-Safe Recipe Interface

```typescript
interface Recipe {
   title?: string;
   ingredients?: string[];
   instructions?: string[];
   total_time?: number;
   yields?: string;
   author?: string;
   image?: string;
   // ... other fields
}
```

## Success Metrics

-  **API Parity**: 100% method compatibility with Python version
-  **Site Coverage**: Support for top 50+ recipe sites initially
-  **Performance**: Comparable parsing speed to Python version
-  **Type Safety**: Full TypeScript coverage with strict mode
-  **Testing**: >90% code coverage with fixture-based tests

## Conclusion

The recipe-scrapers library is a well-architected system with clear separation of concerns and extensible design. The TypeScript port should maintain these architectural principles while adapting to the JavaScript ecosystem's constraints and opportunities. The plugin system and layered extraction approach are the most complex aspects requiring careful design in TypeScript, but the overall structure translates well to a typed language.
