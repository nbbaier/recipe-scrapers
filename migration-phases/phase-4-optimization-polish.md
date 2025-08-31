# Phase 4: Optimization & Polish

**Goal**: Ship production-ready package with competitive performance, dual-module support, documentation, and CI/CD.

## Tasks

### 1. Performance Profiling & Tuning ◼︎

-  Benchmark against Python version using 100-URL corpus
-  Replace Cheerio with `node-html-parser` or `linkedom` in browser build if faster
-  Pool `cheerio.load` calls; reuse DOM for multi-field extraction
-  Memory audit with `clinic.js`

**Dependencies**: Phase 3 complete  
**Deliverables**: Performance benchmarks and optimizations

### 2. Browser & Edge Build ◼︎

-  Use Rollup/Tsup to emit:
   -  ESM (browser, no node built-ins)
   -  CJS (node)
-  Conditional exports in package.json `"exports"` field
-  Ponyfill `fetch` for node <=18

**Dependencies**: Task 1  
**Deliverables**: Multi-target build system

### 3. Tree-Shaking & Lazy Loading ⚪︎

-  Mark scraper classes with `export const` and sideEffects:false for optimisation
-  Dynamic `import()` only the scraper needed by host → reduces bundle size for browser users

**Dependencies**: Task 2  
**Deliverables**: Optimized bundle with tree-shaking

### 4. Docs & DX ⚪︎

-  Typedoc site + MkDocs recipe examples
-  Migration guide for Python users: "How to call TS package from Python via node-subprocess or HTTP"
-  Public plugin authoring guide

**Dependencies**: Phase 3 complete  
**Deliverables**: Comprehensive documentation

### 5. CI/CD & Release Automation ⚪︎

-  GitHub Actions matrix (node 18/20, ubuntu/macos/windows)
-  Release-please for semver tagging & changelog
-  Codecov integration
-  Publish dry-run, then `npm publish --access public`

**Dependencies**: Task 1, 2, 3  
**Deliverables**: Complete CI/CD pipeline

### 6. Quality Gates ⚪︎

-  > 90% line coverage
-  Lighthouse size check (<250 kB gzipped browser bundle)
-  Dependabot alerts zero open for prod deps

**Dependencies**: Task 5  
**Deliverables**: Quality assurance metrics

## Technical Challenges

### Performance Optimization

**Challenge**: Matching Python's performance while adding TypeScript overhead  
**Solution**: Strategic optimizations

```typescript
// DOM parsing pool
class DOMPool {
   private pool: CheerioAPI[] = [];

   acquire(html: string): CheerioAPI {
      const instance = this.pool.pop() || cheerio.load("");
      instance.html(html);
      return instance;
   }

   release(instance: CheerioAPI): void {
      instance.html(""); // Clear DOM
      this.pool.push(instance);
   }
}

// Lazy scraper loading
export async function scrapeURL(url: string): Promise<Recipe> {
   const host = new URL(url).hostname;
   const ScraperClass = await import(`./scrapers/${host}.js`);
   return new ScraperClass.default(html);
}
```

### Browser Compatibility

**Challenge**: Node.js APIs in browser environment  
**Solution**: Conditional exports and ponyfills

```json
// package.json
{
   "exports": {
      ".": {
         "browser": "./dist/browser.js",
         "node": "./dist/node.js",
         "default": "./dist/index.js"
      }
   }
}
```

### Bundle Size Optimization

**Challenge**: 400+ scrapers creating large bundle  
**Solution**: Dynamic imports and tree-shaking

```typescript
// Only import needed scraper
const scraperMap = {
   "allrecipes.com": () => import("./scrapers/allrecipes"),
   "foodnetwork.com": () => import("./scrapers/foodnetwork"),
   // ...
};

export async function createScraper(url: string) {
   const host = new URL(url).hostname;
   const scraperImport = scraperMap[host];

   if (!scraperImport) {
      return new GenericScraper();
   }

   const { default: ScraperClass } = await scraperImport();
   return new ScraperClass();
}
```

## Build System Configuration

### Rollup Configuration

```javascript
// rollup.config.js
export default [
   // Node.js CJS build
   {
      input: "src/index.ts",
      output: { file: "dist/node.cjs", format: "cjs" },
      external: ["cheerio", "node-fetch"],
      plugins: [typescript(), resolve(), commonjs()],
   },
   // Browser ESM build
   {
      input: "src/index.ts",
      output: { file: "dist/browser.js", format: "es" },
      plugins: [
         typescript(),
         resolve({ browser: true }),
         replace({
            "node-fetch": "fetch",
            cheerio: "cheerio/lib/slim",
         }),
      ],
   },
];
```

### TypeScript Configuration

```json
// tsconfig.json
{
   "compilerOptions": {
      "target": "ES2020",
      "module": "ESNext",
      "lib": ["ES2020", "DOM"],
      "moduleResolution": "node",
      "strict": true,
      "declaration": true,
      "sideEffects": false
   }
}
```

## Documentation Strategy

### API Documentation

-  TypeDoc for auto-generated API docs
-  Interactive examples with RunKit
-  Migration guide from Python version

### Developer Experience

```typescript
// Clear, typed API
interface ScraperOptions {
   timeout?: number;
   userAgent?: string;
   plugins?: Plugin[];
}

export async function scrapeURL(
   url: string,
   options?: ScraperOptions
): Promise<Recipe> {
   // Implementation
}

// Plugin authoring
export interface Plugin {
   name: string;
   shouldRun(host: string, method: string): boolean;
   run<T>(originalFn: () => T): () => T;
}
```

## Quality Assurance

### Performance Benchmarks

-  Memory usage comparison with Python
-  Parse time benchmarks across 100 URLs
-  Bundle size analysis
-  Tree-shaking effectiveness

### Testing Strategy

-  Unit tests (>90% coverage)
-  Integration tests with real URLs
-  Browser compatibility testing
-  Performance regression tests

## Success Criteria

✔ End-to-end scrape of 100 URL suite within 110% of Python average runtime  
✔ Package installs via `npm i recipe-scrapers` and works in both node and Vite browser build out-of-the-box  
✔ Documentation site live, CI green, 1.0.0 tag published  
✔ Bundle size <250 kB gzipped for browser  
✔ >90% test coverage maintained  
✔ Zero high-severity security vulnerabilities

## Estimated Timeline

**Total**: 12-15 days  
**Critical Path**: Task 1 → 2 → 3 → 4 → 5 → 6

## Risk Assessment

**Medium Risk**: Performance optimization complexity  
**Medium Risk**: Browser compatibility issues  
**Low Risk**: Documentation and CI/CD setup  
**Low Risk**: Bundle optimization

## Release Strategy

### Pre-release Checklist

-  [ ] All tests passing
-  [ ] Performance benchmarks meet criteria
-  [ ] Documentation complete
-  [ ] Security audit clean
-  [ ] Browser compatibility verified

### Release Process

1. Bump version with release-please
2. Generate changelog
3. Create GitHub release
4. Publish to npm
5. Update documentation site
6. Announce on relevant channels

## Monitoring & Maintenance

### Post-Release Monitoring

-  Bundle size tracking
-  Performance regression monitoring
-  Error rate monitoring
-  Usage analytics

### Maintenance Plan

-  Monthly dependency updates
-  Quarterly performance reviews
-  Annual security audits
-  Community feedback integration
