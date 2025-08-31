# Phase 3: Scraper Implementation

**Goal**: Reach meaningful site coverage by porting concrete scrapers and establishing an automated conversion pipeline.

## Tasks

### 1. Python → TS Stub Generator ◆
- Write Python script (`scripts/gen_ts_stub.py`) that introspects each `*.py` scraper:
  - Derive class name, hostname list, declared methods
  - Emit `.ts` file with class skeleton & TODO comments
- Pre-commit hook to keep parity

**Dependencies**: Phase 2 complete  
**Deliverables**: Automated stub generation script

### 2. Manual Port: Top 20 Sites ◆
- Select sites by traffic (Allrecipes, FoodNetwork, BBCGoodFood …)
- Port selectors & logic; adapt BeautifulSoup CSS to Cheerio
- Handle `:contains` selector differences
- Ensure each scraper throws `ElementNotFoundError` compatibly

**Dependencies**: Task 1  
**Deliverables**: 20 fully functional scrapers with tests

### 3. Full Test Harness & Fixtures ◆
- Convert existing Python fixtures (HTML + expected.json) → drop into `tests/fixtures/<host>/`
- Parametrize Jest: iterate over scraper classes, feed fixture, assert parity with expected JSON
- Snapshot tests for `toJSON()`

**Dependencies**: Task 2  
**Deliverables**: Comprehensive fixture-based test suite

### 4. Auto-Conversion Pipeline (Long Tail) ◼︎
- Use stub generator + minimal AST translation of selectors when possible
- Create GitHub Action that opens PRs with new stubs for human review
- Track progress in coverage dashboard

**Dependencies**: Task 1, 3  
**Deliverables**: Automated conversion pipeline for remaining ~380 sites

### 5. CLI & Programmatic API ◼︎
- `bin/recipe-scraper.js url|file.html` ⇒ prints JSON
- Add ESM entry `import { scrapeURL } from 'recipe-scrapers'`

**Dependencies**: Task 2, 3  
**Deliverables**: CLI tool and public API

## Technical Challenges

### Selector Differences: BeautifulSoup vs Cheerio
**Challenge**: CSS selector compatibility issues  
**Solution**: Create selector shim utilities

```typescript
// Handle :contains() pseudo-selector difference
function adaptSelector(selector: string): string {
  return selector.replace(
    /:contains\(([^)]+)\)/g, 
    (match, content) => `[text*="${content}"]`
  );
}

// Handle nth-of-type differences
function normalizeNthSelectors(selector: string): string {
  // Convert 1-based to 0-based indexing where needed
  return selector.replace(/nth-of-type\((\d+)\)/g, (match, n) => 
    `nth-of-type(${parseInt(n)})`
  );
}
```

### Unicode/Locale Differences
**Challenge**: Handling unicode fractions and locale-specific formatting  
**Solution**: Rely on Phase 2 transform plugins

### Type Safety with Dynamic Scrapers
**Challenge**: Maintaining strict typing across 400+ scrapers  
**Solution**: Allow `unknown` → narrow inside scrapers

## Scraper Conversion Strategy

### Priority Sites (Manual Port)
1. **Allrecipes** - Most popular US recipe site
2. **Food Network** - TV network recipes  
3. **BBC Good Food** - UK recipes
4. **Serious Eats** - Food blog
5. **Epicurious** - Magazine recipes
6. **Taste of Home** - Community recipes
7. **Simply Recipes** - Food blog
8. **Delish** - Magazine recipes
9. **Food52** - Community platform
10. **Bon Appétit** - Magazine recipes

### Auto-Conversion Approach
```python
# scripts/gen_ts_stub.py
def generate_scraper_stub(python_file: Path) -> str:
    """Generate TypeScript stub from Python scraper"""
    
    # Parse Python AST
    tree = ast.parse(python_file.read_text())
    
    # Extract class info
    scraper_class = find_scraper_class(tree)
    host_patterns = extract_host_patterns(scraper_class)
    methods = extract_implemented_methods(scraper_class)
    
    # Generate TS stub
    return generate_ts_template(
        class_name=scraper_class.name,
        host_patterns=host_patterns,
        methods=methods
    )
```

## Test Strategy

### Fixture Management
```
tests/fixtures/
├── allrecipes.com/
│   ├── recipe1.html
│   ├── recipe1.json
│   ├── recipe2.html
│   └── recipe2.json
├── foodnetwork.com/
│   └── ...
└── ...
```

### Parametrized Testing
```typescript
describe.each(getAllScrapers())('Scraper: %s', (ScraperClass) => {
  const fixtures = getFixturesForScraper(ScraperClass);
  
  test.each(fixtures)('should parse %s correctly', (fixture) => {
    const scraper = new ScraperClass(fixture.html);
    const result = scraper.toJSON();
    
    expect(result).toMatchObject(fixture.expected);
  });
});
```

## Success Criteria

✔ Top 20 scrapers pass fixture suite (>= 95% field parity vs Python expectations)  
✔ Stub generator emits compilable code for remaining ~380 sites  
✔ Public CLI returns JSON for a live Allrecipes URL under node 18  
✔ Test suite covers >90% of scraper code  
✔ Performance within 110% of Python version  

## Estimated Timeline

**Total**: 20-25 days  
**Critical Path**: Task 1 → 2 → 3 → 4 → 5

## Risk Assessment

**High Risk**: Selector compatibility issues  
**High Risk**: Volume of manual porting work  
**Medium Risk**: Fixture data accuracy  
**Low Risk**: CLI implementation

## Automation Strategy

- GitHub Actions for stub generation
- Automated PR creation for new scrapers
- Performance regression testing
- Coverage tracking dashboard
- Automated fixture updates from live sites
