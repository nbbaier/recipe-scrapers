# recipe-scrapers: AI Assistant Guide

This document provides context and guidance for AI assistants (like Claude) working on the recipe-scrapers project.

## Project Overview

**recipe-scrapers** is a comprehensive library for extracting recipe data from cooking websites. It supports **518+ recipe websites** with a consistent API, parsing data from HTML structure, Schema.org markup (JSON-LD, Microdata, RDFa), and OpenGraph metadata.

- **Primary Language:** Python
- **License:** MIT
- **Key Feature:** Data-driven testing with HTML snapshots and expected JSON outputs
- **Architecture:** Plugin-based with Schema.org as primary extraction method

## TypeScript Port (In Progress) 🚧

### Overview

A **TypeScript port** is currently under active development in the `typescript/` directory. This is a significant effort to achieve **100% API parity** with the Python version, bringing recipe-scrapers functionality to the Node.js/TypeScript ecosystem.

**Status:** Phase 0/1 (Foundation) - ~5% complete
**Progress:** Project scaffolding complete, core implementation not yet started
**Approach:** [Hybrid Approach (APPROACH_4_HYBRID.md)](typescript/APPROACH_4_HYBRID.md)
**Goal:** Complete 1:1 functionality port, then extract to separate npm package
**Detailed Status:** See [typescript/STATUS.md](typescript/STATUS.md) for comprehensive progress tracking

### Why Development Happens Here

The TypeScript port is intentionally being developed **within** the Python repository to:

- ✅ Provide easy reference to Python implementations
- ✅ Share test data (`tests/test_data/`) for true parity validation
- ✅ Enable side-by-side comparison of outputs
- ✅ Access git history to understand how issues were resolved
- ✅ Validate 100% parity before extraction to separate repo

### Key TypeScript Documentation

If working on the TypeScript port, review these files in order:

1. **[typescript/STATUS.md](typescript/STATUS.md)** ⭐ **START HERE!** Current implementation status and detailed progress
2. **[typescript/DEVELOPMENT.md](typescript/DEVELOPMENT.md)** - Development guide and workflow
3. **[typescript/README.md](typescript/README.md)** - TypeScript port overview and quick start
4. **[typescript/TYPESCRIPT_PORT_PLAN.md](typescript/TYPESCRIPT_PORT_PLAN.md)** - Overall strategy (reference)

**Note:** The `APPROACH_*.md` files in typescript/ are archived planning documents. The chosen approach is Hybrid (develop here, extract later) as documented in STATUS.md.

### Current TypeScript Structure

```
typescript/
├── src/
│   ├── exceptions.ts       # ✅ Custom error classes (COMPLETE)
│   ├── types/
│   │   └── recipe.ts       # ✅ TypeScript type definitions (COMPLETE)
│   └── index.ts            # ⚠️ Main entry point (placeholder only)
│   # ❌ NOT YET IMPLEMENTED:
│   # ├── scrapers/         # Abstract scraper, parsers (TODO)
│   # ├── plugins/          # Plugin system (TODO)
│   # ├── utils/            # Utility functions (TODO)
│   # └── factory.ts        # Factory pattern (TODO)
├── tests/
│   ├── helpers/
│   │   └── test-data.ts    # ✅ Test data loading (COMPLETE)
│   └── unit/
│       └── test-data.test.ts  # ✅ Helper tests (COMPLETE)
├── scripts/
│   ├── compare-outputs.ts  # ⚠️ Scaffolded but not functional yet
│   └── validate-parity.ts  # ⚠️ Scaffolded but not functional yet
├── docs/                   # Approach documents (for reference)
├── package.json            # ✅ Dependencies and scripts (COMPLETE)
├── tsconfig.json           # ✅ TypeScript configuration (COMPLETE)
├── jest.config.js          # ✅ Test configuration (COMPLETE)
├── STATUS.md               # 📊 Current status tracking (NEW!)
└── README.md               # 📚 Overview
```

### TypeScript Development Workflow

```bash
cd typescript

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Validate parity with Python version
npm run validate-parity

# Compare specific output
npm run compare -- allrecipes.com

# Type check
npm run type-check

# Lint and format
npm run lint:fix
npm run format
```

### Parity Validation Scripts

The TypeScript port includes automated parity validation tools located in `typescript/scripts/`:

- **`validate-parity.ts`** - Compares TypeScript and Python outputs across all scrapers
- **`compare-outputs.ts`** - Compares outputs for specific domains

These scripts ensure the TypeScript port maintains exact compatibility with the Python version.

## Repository Structure

```
recipe-scrapers/
├── recipe_scrapers/        # Python source code
│   ├── _abstract.py        # Base scraper class
│   ├── _schemaorg.py       # Schema.org parser (JSON-LD, Microdata, RDFa)
│   ├── _opengraph.py       # OpenGraph metadata parser
│   ├── _utils.py           # Utility functions
│   ├── _factory.py         # Scraper registry and factory
│   ├── plugins/            # Plugin system (7 plugins)
│   └── [site].py           # 518+ site-specific scrapers
├── typescript/             # TypeScript port (in progress)
├── tests/
│   └── test_data/          # HTML snapshots + expected JSON (shared)
│       ├── allrecipes.com/
│       ├── bbcgoodfood.com/
│       └── [518+ domains]/
├── docs/                   # Documentation (MkDocs)
├── scripts/                # Build and utility scripts
└── pyproject.toml          # Python package configuration
```

## Key Concepts

### 1. Data-Driven Testing

Both Python and TypeScript use the same test data structure:

```
tests/test_data/[domain]/
├── [recipe-name].testhtml  # HTML snapshot
└── [recipe-name].json      # Expected output
```

This ensures:
- No need to make live HTTP requests in tests
- Consistent expected outputs
- Easy validation of TypeScript parity
- Reproducible tests

### 2. Plugin Architecture

The library uses a plugin system for cross-cutting concerns:

- **ExceptionHandlingPlugin** - Graceful error handling
- **SchemaOrgFillPlugin** - Auto-fill from Schema.org data
- **OpenGraphFillPlugin** - Fallback to OpenGraph metadata
- **HTMLTagStripperPlugin** - Strip HTML tags from text
- **NormalizeStringPlugin** - Normalize whitespace
- **OpenGraphImageFetchPlugin** - Fetch images from OpenGraph
- **StaticValueExceptionHandlingPlugin** - Handle static values

### 3. Site-Specific Scrapers

Most scrapers are minimal (8-40 lines) because they inherit behavior from Schema.org parsing:

```python
# Python example
class AllRecipes(AbstractScraper):
    # Most methods inherited from schema.org via plugins
    # Override only when site needs special handling
    pass
```

```typescript
// TypeScript equivalent
export class AllRecipesScraper extends AbstractScraper {
  host(): string {
    return 'allrecipes.com';
  }
  // Methods inherited from schema.org via plugins
}
```

## Working on Python Code

### Running Python Tests

```bash
# Install in development mode
pip install -e .

# Run all tests
pytest

# Run specific scraper tests
pytest tests/test_allrecipes.py

# Run with coverage
pytest --cov=recipe_scrapers
```

### Adding a New Scraper (Python)

1. Create `recipe_scrapers/[site].py`
2. Extend `AbstractScraper`
3. Add test data in `tests/test_data/[domain]/`
4. Create test file `tests/test_[site].py`
5. Register in `recipe_scrapers/__init__.py`

See [Python Contributing Guide](https://docs.recipe-scrapers.com/contributing/home/)

## Working on TypeScript Code

### Current Development Phase

The TypeScript port is in **Phase 0/1: Foundation** (~5% complete). Current status:

**Completed ✅**
- [x] Project scaffolding and build tooling
- [x] Type definitions (Recipe, IngredientGroup, Nutrients)
- [x] Exception classes (all 5 custom exceptions)
- [x] Test data helpers (load HTML and JSON from shared test data)
- [x] Development environment setup (TypeScript, Jest, ESLint, Prettier)

**Next Up (Priority Order) 🚧**
- [ ] Core utilities (duration parsing, normalization, yield parsing)
- [ ] Schema.org parser (starting with JSON-LD only)
- [ ] OpenGraph parser
- [ ] Abstract scraper base class
- [ ] Plugin system architecture
- [ ] First 10 priority scrapers (allrecipes, foodnetwork, etc.)

**Not Started ❌**
- All 518 site-specific scrapers
- Factory pattern and scraper registry
- Functional parity validation scripts
- Complete documentation

**See [typescript/STATUS.md](typescript/STATUS.md) for detailed breakdown of progress.**

### Adding TypeScript Functionality

When porting Python features to TypeScript:

1. **Reference the Python implementation** - It's right there in `recipe_scrapers/`
2. **Check test data** - Use existing HTML snapshots in `../tests/test_data/`
3. **Validate parity** - Run `npm run validate-parity` to ensure outputs match
4. **Follow TypeScript patterns** - Use strict types, prefer immutability
5. **Document differences** - Note any intentional API differences

### TypeScript Port Principles

- **Strict type safety** - Enable strict mode, no `any` types
- **1:1 API parity** - Match Python API exactly
- **Shared test data** - Use same HTML and JSON as Python version
- **Modern JavaScript** - Use ES2020+ features, async/await
- **Comprehensive tests** - Aim for 90%+ code coverage

## Testing Philosophy

### Python Testing

- **Framework:** pytest
- **Parallel execution:** Yes (pytest-xdist)
- **Coverage:** High coverage required
- **Data-driven:** All scrapers tested against HTML snapshots

### TypeScript Testing

- **Framework:** Jest
- **Coverage:** Minimum 90%
- **Validation:** Compare outputs with Python version
- **Shared data:** Uses `../tests/test_data/`

## Common Tasks

### Compare Python and TypeScript Outputs

```bash
cd typescript
npm run build
npm run compare -- [domain]
```

This compares the JSON output of both implementations.

### Add Test Data for New Site

```bash
# Structure
mkdir -p tests/test_data/example.com
# Add HTML snapshot
echo "[HTML content]" > tests/test_data/example.com/recipe.testhtml
# Add expected JSON
echo '{...}' > tests/test_data/example.com/recipe.json
```

### Run Full Validation

```bash
# Python tests
pytest

# TypeScript tests
cd typescript && npm test

# Parity validation
cd typescript && npm run validate-parity
```

## Documentation

- **Python Docs:** [https://docs.recipe-scrapers.com](https://docs.recipe-scrapers.com)
- **Supported Sites:** [List of 518+ supported websites](https://docs.recipe-scrapers.com/getting-started/supported-sites/)
- **Contributing Guide:** [How to contribute](https://docs.recipe-scrapers.com/contributing/home/)

## Future: TypeScript Extraction

Once the TypeScript port reaches 100% parity:

1. Extract to separate repository: `recipe-scrapers-ts`
2. Publish to npm as standalone package
3. Set up automated test data sync from Python repo
4. Maintain cross-references in both repositories

**Target Timeline:** See [TYPESCRIPT_PORT_PLAN.md](typescript/TYPESCRIPT_PORT_PLAN.md) - estimated 13-14 weeks for complete port

## Tips for AI Assistants

### When Working on Python Code

- Look for similar scrapers to use as templates
- Check `recipe_scrapers/_schemaorg.py` for Schema.org parsing logic
- Most scrapers inherit all functionality from plugins
- Test data is the source of truth for expected behavior

### When Working on TypeScript Port

- **Always reference the Python version first** before implementing
- **Run `npm run validate-parity`** after major changes
- **Check existing test data** before creating new tests
- **Use strict types** - the Python version has type hints to reference
- **Document intentional differences** if any are needed

### When Comparing Implementations

The Python implementation is the source of truth. The TypeScript port should:
- Match exact API signatures (accounting for language differences)
- Produce identical JSON outputs for the same HTML input
- Implement same plugin behavior
- Handle same edge cases and errors

### Useful File Paths

| Component | Python | TypeScript |
|-----------|--------|------------|
| Base scraper | `recipe_scrapers/_abstract.py` | `typescript/src/scrapers/abstract.ts` (planned) |
| Schema.org parser | `recipe_scrapers/_schemaorg.py` | `typescript/src/scrapers/schema-org.ts` (planned) |
| Utilities | `recipe_scrapers/_utils.py` | `typescript/src/utils/` (planned) |
| Plugins | `recipe_scrapers/plugins/` | `typescript/src/plugins/` (planned) |
| Test data | `tests/test_data/` | Same (shared) |
| Site scrapers | `recipe_scrapers/[site].py` | `typescript/src/scrapers/sites/[site].ts` (planned) |

## Questions or Issues?

- **Python version:** [GitHub Issues](https://github.com/hhursev/recipe-scrapers/issues)
- **TypeScript port:** File issue mentioning "TypeScript port"
- **Documentation:** [Official docs](https://docs.recipe-scrapers.com)

---

**Last Updated:** 2025-11-12
**Python Version:** Active development (stable, 518+ scrapers)
**TypeScript Version:** 0.1.0-alpha (Foundation phase, ~5% complete)
