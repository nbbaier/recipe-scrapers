# Phase 1: Core Infrastructure

**Goal**: Execute a "vertical slice" - one scraper instance can be constructed, proxied by plugins, and queried for mock data under a strict TypeScript build.

## Tasks

### 1. Repo & Build Scaffolding ⚪︎

-  Init monorepo or single-package layout with pnpm / npm-workspaces
-  `tsconfig.json` (strict, target ES2020, module=ESNext)
-  ESLint + Prettier, Husky pre-commit hooks
-  Jest/Vitest with ts-jest / ts-node for tests
-  CI job: type-check, lint, unit tests

**Dependencies**: None
**Deliverables**: Working build pipeline

### 2. Error Hierarchy Port ⚪︎

-  Map Python exceptions ⇒ TS `class … extends Error`
-  Encode error unions: `type ScraperError = WebsiteNotImplementedError | …`
-  Export in `errors.ts` for reuse everywhere

**Dependencies**: Task 1
**Deliverables**: `errors.ts` with complete exception hierarchy

### 3. Utility Layer ◼︎

-  Port helpers from `_utils.py` (string normalize, time helpers, text cleanup)
-  Replace `isodate` with `iso8601-duration` or wrapper utils
-  Comprehensive unit tests

**Dependencies**: Task 1, 2
**Deliverables**: `utils.ts` with test coverage >90%

### 4. AbstractScraper Base ◆

#### a) Data Model

-  Define `Recipe` interface with optional fields (strictNullChecks on)
-  Add generic `<T extends Recipe = Recipe>` if needed

#### b) HTML Parsing

-  Integrate Cheerio (DOM-agnostic), expose `protected $: CheerioAPI`
-  Provide `ingredients()`, `instructions()`, … as abstract stubs

#### c) Metadata

-  `host(): string`, `language(): string`, `toJSON()`

**Dependencies**: Task 1, 2, 3
**Deliverables**: `AbstractScraper` base class with type-safe interface

### 5. Plugin System v1 ◆

-  Interfaces: `interface Plugin { shouldRun(host: string, method: string): boolean; run(fn: Fn): Fn }`
-  Implement `createPluginProxy` using ES Proxy (from guide)
-  Maintain per-host cache so decoration happens once/class
-  Demonstrate with a NO-OP mock plugin in tests

**Dependencies**: Task 4
**Deliverables**: Plugin system with proxy-based decoration

### 6. Scraper Registry & Factory (skeleton) ◼︎

-  `const SCRAPERS: Record<string, ScraperCtor>`
-  `function scrapeHtml(html: string, url: string)` → choose scraper, build, proxy, return
-  For Phase 1, only a DummyScraper registered manually

**Dependencies**: Task 4, 5
**Deliverables**: Factory system with basic scraper registry

### 7. Docs & Examples ⚪︎

-  README snippet: "hello world" usage
-  ADR documenting proxy design vs Python monkey-patching

**Dependencies**: Task 6
**Deliverables**: Basic documentation and examples

## Technical Challenges

### Dynamic Method Decoration

**Challenge**: Python's monkey-patching doesn't translate directly to TypeScript
**Solution**: Use Proxy-based decoration with type preservation

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

### Type Safety vs Dynamic Nature

**Challenge**: Maintaining strict typing while supporting dynamic scraper behavior
**Solution**: Comprehensive interface design with union types for errors

## Success Criteria

✔ `DummyScraper` can be instantiated through factory, plugin proxy fires, `title()` returns hard-coded value under Jest
✔ No `any` in core packages; `npm run build` emits ESM & passes `tsc --noEmit`
✔ All tasks completed with >90% test coverage
✔ CI pipeline passes all checks

## Estimated Timeline

**Total**: 8-12 days
**Critical Path**: Tasks 1 → 2 → 3 → 4 → 5 → 6 → 7

## Risk Assessment

**High Risk**: Plugin system proxy implementation
**Medium Risk**: TypeScript strict mode compatibility
**Low Risk**: Build tooling setup
