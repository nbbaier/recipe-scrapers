# Agent Guidelines for recipe-scrapers

**Context:** Python repo with a TypeScript port in `typescript/`. TS must have 100% API/output parity.

## Python (Primary)
- **Test:** `pytest` (all) or `pytest tests/test_site.py` (single).
- **Lint:** `pre-commit run --all-files` or `black . && flake8 && mypy .`.
- **Style:** PEP8, Black, Type hints (mypy). Scrapers inherit `AbstractScraper`.

## TypeScript (Port)
- **Working Dir:** `cd typescript`
- **Test:** `bun test` (all) or `bun test [file_pattern]` (single).
- **Lint/Format:** `bun run lint:fix` (Biome).
- **Parity:** Run `bun run validate-parity` to ensure JSON output matches Python.

## Rules
- **Scrapers:** Minimal code. Extend `AbstractScraper`. Use plugins/Schema.org.
- **Test Data:** Shared in `tests/test_data/`. Do NOT make network requests in tests.
- **New Scraper:** Create `recipe_scrapers/[site].py`, add test data, register in `__init__.py`.
- **TS Port:** Check `typescript/STATUS.md` first. Reference Python code. Strict types.
