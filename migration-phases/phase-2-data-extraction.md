# Phase 2: Data Extraction Engine

**Goal**: Match Python fallback stack (Schema.org ➜ OpenGraph) and ship first functional scraper that works purely via generic helpers.

## Tasks

### 1. Schema.org Helper (JSON-LD first) ◆
- Parse all `<script type="application/ld+json">` blocks with fast JSON parse + error cage
- Resolve `@graph` arrays and `HowToSection` recursion
- Return normalized `SchemaRecipe` object conforming to `Recipe` interface subset
- Unit tests using real fixtures

**Dependencies**: Phase 1 complete  
**Deliverables**: `schema-org.ts` with JSON-LD parsing

### 2. OpenGraph Helper ⚪︎
- Pull meta tags via Cheerio selectors
- Minimal fields: `title`, `image`, `siteName`
- Map to `Recipe` partial

**Dependencies**: Phase 1 complete  
**Deliverables**: `opengraph.ts` with basic meta tag extraction

### 3. Fill Plugins ◼︎
#### a) `SchemaOrgFillPlugin`
- If scraper.method returns undefined/throws → supply value from helper

#### b) `OpenGraphFillPlugin`
- Last resort fallback
- Maintain plugin ordering priority

**Dependencies**: Task 1, 2  
**Deliverables**: Fill plugins with proper fallback chain

### 4. Transform Plugins (cross-cut) ⚪︎
- `NormalizeStringsPlugin` → trim, collapse whitespace, unicode fractions
- `DurationParsePlugin` → convert ISO string to minutes using util from Phase 1

**Dependencies**: Phase 1 utilities  
**Deliverables**: Transform plugins for data normalization

### 5. Factory/Registry Finalization ◼︎
- Allow wildcard regex host matching
- Provide fallback "GenericSchemaScraper" that only uses helpers + plugins
- HTTP helper (node-fetch) gated behind optional flag; still fixture driven for tests

**Dependencies**: Task 1, 2, 3, 4  
**Deliverables**: Complete factory system with fallback scraper

### 6. Integration Tests ◼︎
- Use 5–10 public recipe pages saved as fixtures
- Assert each field resolved by correct layer (site scraper none yet)
- Coverage on error branches

**Dependencies**: Task 5  
**Deliverables**: Comprehensive test suite with fixtures

## Technical Challenges

### Deeply Nested JSON-LD Graphs
**Challenge**: Complex nested structures in Schema.org data  
**Solution**: Write recursive extractor with max-depth guard

```typescript
function extractFromGraph(data: any, maxDepth = 10): SchemaRecipe {
  if (maxDepth <= 0) throw new Error('Max depth reached');
  
  if (Array.isArray(data)) {
    return data.reduce((acc, item) => 
      mergeRecipes(acc, extractFromGraph(item, maxDepth - 1)), {});
  }
  
  if (data['@type'] === 'Recipe') {
    return normalizeSchemaRecipe(data);
  }
  
  // Handle HowToSection, graph arrays, etc.
  return processNestedTypes(data, maxDepth - 1);
}
```

### Type-narrowing Through Plugin Proxy
**Challenge**: Maintaining type safety through dynamic proxy  
**Solution**: Leverage declaration merging & overloads

### Performance of Cheerio Parse
**Challenge**: DOM parsing overhead  
**Solution**: Lazy-load helpers only when used

## Data Extraction Flow

```
HTML Input
    ↓
Schema.org JSON-LD Parser
    ↓
OpenGraph Meta Parser
    ↓
Plugin Chain (Fill → Transform)
    ↓
Normalized Recipe Output
```

## Success Criteria

✔ For generic fixtures, at least `title`, `ingredients`, `instructions`, `total_time` resolved via Schema.org  
✔ Failover confirmed: when JSON-LD removed, OpenGraph still returns `title`  
✔ >80% Statement coverage for helpers  
✔ GenericSchemaScraper works on 5+ real recipe sites  

## Estimated Timeline

**Total**: 10-14 days  
**Critical Path**: Task 1 → 2 → 3 → 4 → 5 → 6

## Risk Assessment

**High Risk**: Schema.org JSON-LD complexity  
**Medium Risk**: Plugin ordering and fallback logic  
**Low Risk**: OpenGraph implementation

## Test Strategy

- Unit tests for each helper with isolated fixtures
- Integration tests with real HTML samples
- Error path testing for malformed JSON-LD
- Performance benchmarks for large JSON-LD documents
