# Recipe Scrapers Agent Guide

## Commands

-  **Test all**: `python -m unittest` or `python -m unittest_parallel --level test` (parallel)
-  **Test single**: `python -m unittest tests.library.test_main_methods.TestMainMethods.test_valid_call_formats`
-  **Coverage**: `coverage run -m unittest && coverage report`
-  **Lint**: `pre-commit run --all-files` or `flake8`, `black`, `mypy`
-  **Docs**: `mkdocs serve` (local dev server at http://127.0.0.1:8000)
-  **Generate scraper**: `python generate.py ClassName https://example.com/recipe`

## Architecture

-  **Core**: `recipe_scrapers/` - Main package with 500+ site-specific scrapers
-  **Base**: `_abstract.py` - AbstractScraper base class, all scrapers inherit from this
-  **Utils**: `_utils.py`, `_schemaorg.py`, `_opengraph.py` - Parsing utilities
-  **Tests**: `tests/library/` - Unit tests, `tests/test_data/` - Test HTML/JSON data
-  **Generation**: `generate.py` - Creates new scrapers from templates

## Code Style

-  **Formatting**: Black with 88 char line length, target Python 3.9+
-  **Imports**: Standard library, third-party, local imports (use `from ._abstract import AbstractScraper`)
-  **Classes**: PascalCase, inherit from AbstractScraper, implement `host()` classmethod
-  **Methods**: snake_case, follow AbstractScraper interface (title, ingredients, etc.)
-  **Types**: Use type hints, mypy enabled with union-attr disabled for scrapers
-  **Exceptions**: Use `ElementNotFoundInHtml` for missing elements
-  **Dependencies**: BeautifulSoup4, extruct, isodate (requests for online mode)

## TypeScript Migration Plan

See `typescript-migration-plan/` directory for comprehensive migration documentation:

-  **[Overview](typescript-migration-plan/README.md)** - Project overview and timeline
-  **[Phase 1: Foundation](typescript-migration-plan/phase1-foundation.md)** - Core architecture setup
-  **[Phase 2: Core Implementation](typescript-migration-plan/phase2-core-implementation.md)** - Top 50 scrapers migration
-  **[Phase 3: Bulk Migration](typescript-migration-plan/phase3-bulk-migration.md)** - 450+ scrapers migration
-  **[Phase 4: Advanced Features](typescript-migration-plan/phase4-advanced-features.md)** - Plugin system & enhancements
-  **[Phase 5: Infrastructure](typescript-migration-plan/phase5-infrastructure.md)** - Packaging & deployment
-  **[Technical Considerations](typescript-migration-plan/technical-considerations.md)** - Library mappings & challenges
-  **[Timeline & Metrics](typescript-migration-plan/timeline-and-metrics.md)** - Detailed schedule & success criteria
-  **[Architecture Overview](typescript-migration-plan/architecture-overview.md)** - TypeScript system design
