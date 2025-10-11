# Recipe Scrapers Agent Guide

## Commands

-  **Tests**: `python -m unittest` (sequential), `python -m unittest_parallel --level test` (parallel)
-  **Single test**: `python -m unittest tests.library.test_main_methods.TestMainMethods.test_valid_call_formats`
-  **Coverage**: `coverage run -m unittest && coverage report` (or `coverage html`)
-  **Lint**: `flake8` (uses .flake8 config)
-  **Format**: `black --target-version py39 .`
-  **Type check**: `mypy`
-  **Pre-commit**: `pre-commit run --all-files`

## Architecture

-  **Core**: `recipe_scrapers/` - Main scraper library with 400+ site-specific scrapers
-  **Abstract base**: `_abstract.py` - AbstractScraper class with common methods
-  **Utilities**: `_utils.py`, `_schemaorg.py`, `_opengraph.py` - Helper modules
-  **Factory**: `_factory.py` - Creates scraper instances based on domain
-  **Tests**: `tests/library/` - Unit tests, `tests/test_data/` - Test HTML files

## Code Style

-  **Formatting**: Black (line length 88), flake8 linting
-  **Types**: Type hints required, mypy checking enabled
-  **Imports**: Absolute imports, group stdlib/third-party/local
-  **Naming**: snake_case for functions/variables, PascalCase for classes
-  **Error handling**: Raise NotImplementedError for abstract methods
-  **Docstrings**: Brief function descriptions, especially for public methods
