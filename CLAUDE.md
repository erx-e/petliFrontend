    # CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project memory — read this first

**Pets Lighthouse is one system in two repos.** This is the Angular frontend; the .NET 10 backend
lives in a separate checkout, and both repos are indexed into a single graphify knowledge graph,
bridged across the HTTP contract.

Set `$BACKEND` to wherever you cloned the backend — the path is machine-specific, so it is not
hardcoded here. The backend checkout also holds the knowledge graph and the cross-repo memory.

- **`$BACKEND/PROJECT_STATE.md`** is the cross-repo memory: the full endpoint table, the open
  cross-repo items (`PL-X*`), and the change log.
- **The unified graph** is `$BACKEND/graphify-out/graph.json`. Run graphify read commands from the
  backend folder, where it is the default graph; or pass `--graph <that path>` from here.

```bash
graphify query "where does the pet status filter end up server-side" \
  --graph "$BACKEND/graphify-out/graph.json"
```

> **The contract migration (`PL-X1`-`PL-X3`) is done as of 2026-11-06.** This frontend now speaks
> the backend's current contract: `status`/`sex` as **enum names**, plus `lat`/`lng`; the legacy
> single-letter `stateId` codes and `linkMapSeen` are gone. If you find a stray letter code
> (`'A'`/`'E'`/`'B'`/`'H'`) anywhere, it is a leftover — the mapping is
> `EnAdopcion`/`Encontrado`/`Buscado`/`NecesitadoDeAyuda`.

After changing code, refresh the graph with `$BACKEND/tools/graphify-kg/refresh.sh` (it re-extracts
both sides and re-merges). Record cross-repo findings in `$BACKEND/PROJECT_STATE.md`.

## Commands

- `npm start` / `ng serve` — dev server at `http://localhost:4200/` (development config, no optimization).
- `npm run build` / `ng build` — production-ish build to `dist/pets-lighthouse/`. Default build configuration is `development`; pass `--configuration production` for the optimized bundle (which swaps in `environment.prod.ts` and enforces budgets: 1mb initial error, 4kb per-component-style error).
- `npm run watch` — incremental dev build on file changes.
- `npm test` / `ng test` — Karma + Jasmine. Run a single spec by focusing it with `fdescribe`/`fit`, or via `ng test --include='**/auth.service.spec.ts'`.

No ESLint config is currently present despite the `@angular-eslint` devDependencies, so `ng lint` is not wired up. The TypeScript build itself is the main correctness gate.

## Stack & conventions

- **Angular 20**, but **NgModule-based** (not standalone components). New components are declared in a module (`SharedModule`, a feature module, or `WebsiteModule`) — don't use `standalone: true` unless you intend to change the pattern.
- Templates use the **new control-flow syntax** (`@if`, `@for`) — see `filter.component.html`.
- **Bootstrap 5** is imported selectively in `src/styles.scss` (only `forms`, `buttons`, `button-group` — no Reboot, no grid). Don't rely on Bootstrap grid/utility classes being available globally.
- **Swiper Element** (`<swiper-container>`) is registered once in `src/main.ts` for carousels.
- `tsconfig.json` has `strict: false` and `strictNullChecks: false`, but Angular templates run with `strictTemplates: true`. Type errors surface mostly in templates.
- Most existing code and comments are in **Spanish**; match that when editing.

## Architecture

### HTTP interceptor pipeline (the core of the app's data layer)

Three interceptors registered in `app.module.ts`, executed in order: **Cache → Token → Loading**. All three are **opt-in via `HttpContext`**, not blanket-applied:

- `CHECK_TOKEN` (`checkToken()` from `token.interceptor.ts`) — attaches the `Bearer` token. Authenticated calls must pass `{ context: checkToken() }`.
- `CHECK_LOADING` (`checkLoading()` from `loading.interceptor.ts`) — toggles the global spinner via `LoadingService`. Pass `{ context: checkLoading() }` to show the spinner for a request.
- `CacheInterceptor` caches **all GETs** automatically (no opt-in). It implements **stale-while-revalidate**: a fresh entry returns instantly; a stale entry returns the cached value immediately and refreshes in the background (with loading suppressed). TTL is short for `/postpet` listings (20s) and 5min for everything else. Mutations (POST/PUT/DELETE) trigger **granular invalidation** — only the affected resource (first path segment after `API_URL`) is cleared, e.g. publishing a post clears `postpet` cache but not categories/geography.
- `CacheService` is the in-memory store: per-entry TTL, 60-entry LRU cap, `invalidateResource()` / `invalidateAll()`.

When adding a new service method, decide deliberately whether it needs `checkToken()` and/or `checkLoading()` — see existing services for the pattern.

### Auth & session

- JWT stored in `localStorage` under key `tokenPetL` (`TokenService`).
- `AuthService` holds the current user in a `BehaviorSubject` (`user$`) and **mirrors it to `localStorage` (`pl_cached_user`)** so a page refresh hydrates the nav immediately instead of flashing the logged-out state. Any user-state change must go through `setUser()` to keep the subject and cache in sync. On boot, the cached user is only trusted if a token exists.
- `getCurrentUser()` revalidates the profile in the background and clears everything if the token is rejected.

### Image uploads (S3)

`S3StorageService` does direct-to-S3 uploads **without AWS credentials in the frontend**. Two-step flow: (1) `getPresignedUploadUrl()` asks the backend (which holds the credentials) for a signed URL; (2) `uploadToPresignedUrl()` PUTs the file directly to S3 — this request deliberately does **not** use `checkToken()` (S3 validates the URL signature). Deletion also goes through the backend. The uploader UI lives in `shared/components/uploader/`.

### Routing & module structure

- Root `app-routing.module.ts` lazy-loads `WebsiteModule` and sets `QuicklinkStrategy` preloading plus `scrollPositionRestoration`.
- `website-routing.module.ts` nests page routes under a `LayoutComponent` (shared nav/footer). Feature areas (`adopta`, `encuentra`, `difunde`, `ayuda`, `profile`) are **lazy-loaded feature modules**; `home`, `landpage`, `pet/:id` are eager. `login`/`register` sit outside the layout.

### Pet status domain

Posts are categorized by `status`, a `PetStatus` string-literal union declared in
`models/postpet.model.ts` and sent/received as the **enum name** — the same value the backend's
`PetStatus` enum serializes:

| `PetStatus` | Feature area | Notes |
|---|---|---|
| `EnAdopcion` | `adopta/` | no pet name/age fields |
| `Encontrado` | `encuentra/` | no name/age (unknown animal); requires `lastTimeSeen` |
| `Buscado` | `difunde/` | the only status with a reward field; requires `lastTimeSeen` |
| `NecesitadoDeAyuda` | `ayuda/` | — |
| `SanoYSalvo` | *none* | backend-only; no UI to publish or display it |

The feature pages are thin wrappers that pass their `status` into the shared `FilterComponent`,
`PublishComponent` (`<app-publish>`) and `EditarComponent` (`<app-editar>`); conditional fields in
those components branch on `status`. Badge CSS classes are `state--<PetStatus>` (e.g.
`.state--Buscado`), and the Spanish display label comes from the shared `PET_STATUS_LABELS` map —
the backend no longer sends a status *text* (the old `petState` came from the dropped `pet_state`
table), so the UI derives it.

**`status` is immutable after creation.** `UpdatePostCommand` has no `status` field, so
`UpdatePostpetDTO` deliberately omits it (`Omit<…, "status">`); sending it would be a silent no-op.

`PostpetService.GetByFilter()` builds query params through a `withParam` guard that skips
null/undefined/empty — `HttpParams.set(k, undefined)` would otherwise send the literal string
`k=undefined`, which the backend cannot bind to `int?` and answers with 400.

Two backend rules to respect when the map UI lands: **`lat` and `lng` must be sent together or not
at all** (the validator enforces `lat.HasValue == lng.HasValue`, ranges ±90 / ±180), and omitting
`sex` on update *preserves* the stored value rather than resetting it (`c.sex ?? post.Sex`). There is
still no sex control in the publish form, so new posts are created as `Unknown`.

### Data models

DTO conventions in `models/postpet.model.ts`: `*View` interfaces are read shapes from the API;
`Create*DTO` / `Update*DTO` are write shapes. Request and response never share a type, mirroring the
backend's own rule:

- `postpetView` — full read view (`/get`, `/get/{id}`, `/getByState`, `/getByFilter`). Images are
  `imgView` (`{ url }` only): `idImage` exists **only** on the edit prefill, so reading it here
  always gave `undefined`.
- `UpdatePostpetView` — prefill for `GET /postpet/getUpdate/{id}`; carries `status` (display-only)
  and `idImage` per image.
- `CreatePostpetDTO` / `UpdatePostpetDTO` — write bodies. Neither carries `idUser`: the owner comes
  from the JWT (`AuthenticatedUserId`) and the backend ignores any `idUser` in the body.
- `mapPointView` — lightweight map pins from `GET /postpet/getMapPoints`.

`updateImg` images carry an optional `file` for newly added uploads vs. existing `idImage`/`url`.

## Design system

`src/styles.scss` defines an **OKLCH-based token palette** as CSS custom properties (`--blue`, `--yellow`, `--grey`, etc.), each with a hex fallback for browsers lacking `oklch()` support. Headings use the `--font-heading` (Fraunces) family; body uses `--font-body`. A custom reset lives in `src/app/styles/reset.scss` and is imported before Bootstrap components so it doesn't override button/input styling. Prefer these tokens over hardcoded colors.

## Environment

`src/environments/environment.ts` (and `.prod.ts`) hold `API_URL` (backend) and `BUCKET_URL` (public S3 bucket). AWS credentials live only on the backend, never here.
