    # CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project memory — read this first

**Pets Lighthouse is one system in two repos.** This is the Angular frontend; the .NET 10 backend
lives in a separate checkout, and both repos are indexed into a single graphify knowledge graph,
bridged across the HTTP contract.

Set `$BACKEND` to wherever you cloned the backend — the path is machine-specific, so it is not
hardcoded here. The backend checkout also holds the knowledge graph and the project memory.

- **The HTTP contract:** the endpoint table is `$BACKEND/docs/architecture.md` › Contrato HTTP, and
  every payload change (before → after) is in `$BACKEND/petslighthouse-back-main/FRONTEND_CONTRACT_CHANGES.md`.
- **Work on this repo goes through the harness in `$BACKEND`** (its `AGENTS.md`): the `leader`
  session never edits code; a change is a feature in `$BACKEND/feature_list.json` whose size decides
  the flow (a plan or a spec the owner approves), built by the `implementer` subagent and approved by
  the owner. Pending work and debt live in `$BACKEND/progress/pending.md`; finished work, in git.
- **The unified graph** is `$BACKEND/graphify-out/graph.json`. Run graphify read commands from the
  backend folder, where it is the default graph; or pass `--graph <that path>` from here.

```bash
graphify query "where does the report type filter end up server-side" \
  --graph "$BACKEND/graphify-out/graph.json"
```

> **v2, slice 1 (`PL-X8`) is in as of 2026-11-09.** The backend split `post_pet` into `pet` (the pet's
> ID card) and `report` (the event): `/postpet` is gone, replaced by **`/report`** and **`/pet`**, and
> `PetStatus` became **`ReportType` × `ReportStatus`**. The before → after is in
> `$BACKEND/petslighthouse-back-main/FRONTEND_CONTRACT_CHANGES.md`. If you find `PetStatus`, `postpet`
> model/service names or the values `Buscado`/`EnAdopcion`/`Encontrado`/`NecesitadoDeAyuda`, they are
> leftovers. (The `PostpetComponent`/`PostspetComponent` card and list keep their v1 *names*; they
> render `reportView`.)

After changing code, refresh the graph with `$BACKEND/tools/graphify-kg/refresh.sh` (it re-extracts
both sides and re-merges). Cross-repo findings go to `$BACKEND/progress/pending.md`.

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
- `CacheInterceptor` caches **all GETs** automatically (no opt-in). It implements **stale-while-revalidate**: a fresh entry returns instantly; a stale entry returns the cached value immediately and refreshes in the background (with loading suppressed). TTL is short for `/report` listings (20s) and 5min for everything else. Mutations (POST/PUT/DELETE) trigger **granular invalidation** — only the affected resource (first path segment after `API_URL`) is cleared, e.g. publishing a report clears the `report` cache but not categories/geography — plus the resources listed in `CacheInterceptor.DEPENDENTS` (`report` → `pet`: publishing a lost report with a new pet, or resolving/deleting one, changes `GET /pet/mine`).
- `CacheService` is the in-memory store: per-entry TTL, 60-entry LRU cap, `invalidateResource()` / `invalidateAll()`.

When adding a new service method, decide deliberately whether it needs `checkToken()` and/or `checkLoading()` — see existing services for the pattern.

### Auth & session

- JWT stored in `localStorage` under key `tokenPetL` (`TokenService`).
- `AuthService` holds the current user in a `BehaviorSubject` (`user$`) and **mirrors it to `localStorage` (`pl_cached_user`)** so a page refresh hydrates the nav immediately instead of flashing the logged-out state. Any user-state change must go through `setUser()` to keep the subject and cache in sync. On boot, the cached user is only trusted if a token exists.
- `getCurrentUser()` revalidates the profile in the background and clears everything if the token is rejected.

### Image uploads (S3)

`S3StorageService` does direct-to-S3 uploads **without AWS credentials in the frontend**. Two-step flow: (1) `getPresignedUploadUrl(contentType)` asks the backend for a signed URL — **the backend names the file** and returns it as `key` (never invent a name here); (2) `uploadToPresignedUrl()` PUTs the file directly to S3 — this request deliberately does **not** use `checkToken()` (S3 validates the URL signature).

**Photos travel by name (`key`), never by URL** (`PL-X10`). A signed upload stays *pending* in the user's name for 24 h; forms send the keys (`imageKeys`, `petImageKeys`) and the backend only accepts the caller's own unused pending uploads (30 pending max → 429). `deleteImage(key)` only **discards a pending upload** (a photo uploaded and removed before saving); a saved photo is removed by sending the full list without it.

The uploader (`shared/components/uploader/`) has **one mode**: `[initial]` takes the saved photos (`imgView[]`, `{ key, url }`), and `(keysChange)` emits the full ordered list of keys after every change — that list goes straight into the DTO; the first is the primary. Each photo is an `<app-upload-task>`: a new `file` uploads on init and is discarded on the server if removed or left unsaved; an `existing` one only leaves the list. Set `[published]` to true when the form saves, so the tasks don't discard linked uploads on destroy. The input id is per instance: two uploaders can share a page.

### Routing & module structure

- Root `app-routing.module.ts` lazy-loads `WebsiteModule` and sets `QuicklinkStrategy` preloading plus `scrollPositionRestoration`.
- `website-routing.module.ts` nests page routes under a `LayoutComponent` (shared nav/footer). Feature areas (`adopta`, `encuentra`, `difunde`, `ayuda`, `profile`) and `mapa` are **lazy-loaded feature modules**; `home`, `landpage`, `reporte/:id` (report detail, `PetDetailComponent`; it was `pet/:id`, which slice 2 reserves for the pet's public card) are eager. `login`/`register` sit outside the layout.

### Report domain (v2)

Everything lives in `models/report.model.ts`. A report has a **`type`** (`ReportType`, immutable after
creation) and a **`status`** (`ReportStatus`: `Activo` / `Resuelto`), both string-literal unions sent and
received as the **enum name**:

| `ReportType` | Feature area | Notes |
|---|---|---|
| `Perdida` | `difunde/` | the owner's own pet: points to a **pet** (`idPet`); name required; age is asked as years + months and sent as `birthDate`; the only type with `reward`; requires `lastTimeSeen` |
| `Encontrada` | `encuentra/` | animal data **inline**; no name/age fields (unknown animal); requires `lastTimeSeen` |
| `Adopcion` | `adopta/` | inline; free-text `petAge`; no name field |
| `Ayuda` | `ayuda/` | inline; optional name; free-text `petAge` |

- **`requiresLastSeen(type)` is the single source** of the backend's `RequiresLastSeen()` rule — never
  re-write `type === 'Perdida' || type === 'Encontrada'` in a template.
- Labels come from `REPORT_TYPE_LABELS` (and `RESOLVED_LABELS` once resolved), the edit route from
  `REPORT_TYPE_AREA`; badge classes are `state--<ReportType>` or `state--Resuelto`.
- The feature pages are thin wrappers that pass their `type` into the shared `FilterComponent`,
  `PublishComponent` (`<app-publish>`) and `EditarComponent` (`<app-editar>`).
- **Publishing a `Perdida`**: `<app-publish>` loads `GET /pet/mine` and offers the user's pets that are
  not already lost (`?pet=ID` preselects one: "Reportar como perdida" from "Mis mascotas"); choosing one
  sends `idPet` + the event fields (the backend **rejects** animal data with an existing pet). "Otra
  mascota" creates the pet and its report in one request; its photos go to the pet card (`petImageKeys`).
- **Photos of a report linked to a pet** (a `Perdida`): the shared template offers "Las de la ficha de X"
  / "Otras fotos para este reporte" (`photoMode`). Every report may have its own photos (`imageKeys`); a
  `Perdida` without them shows its pet's card. When publishing, the card photos are a preview only; when
  editing, they are editable too (`petImageKeys`, F9), and switching back to the card clears the
  report's own photos on save (the form warns). Both uploaders stay mounted (`[hidden]`), so switching
  doesn't lose uploads. The form requires at least one *visible* photo (`photosMissing`).
- **Sex** is a form control now (`Unknown` / `Male` / `Female`). **Breed is optional.** The province is a
  UI-only cascade: it is **never sent** (the backend derives it from the canton; `getUpdate` returns a
  read-only `idProvincia` to prefill it).
- **`PUT /report/update` replaces, it does not merge**: a missing field is cleared. `EditarComponent`
  therefore sends the whole form and passes through, unchanged, the fields it has no control for
  (`petSpecialCondition`, `lat`/`lng`, and name/age when the type hides them). Photos go as full lists
  of keys: absent = untouched, `[]` = remove all.
- The feed only shows `Activo` reports (the backend default). The report detail lets the owner
  **resolve** (`PUT /report/resolve/{id}`; "¡Está en casa!" for a `Perdida`) — final, with a confirm
  dialog. "Mis publicaciones" renders two `<app-filter>`: `status="Activo"` and `status="Resuelto"`.
- `lat` and `lng` must be sent together or not at all. The forms hold them as one optional `location`
  control (`GeoPoint | null`) bound to `<app-location-picker>`; editing sends the control's value, so
  "Quitar el punto" clears the stored coordinates.

### Maps (`PL-X4`)

**Leaflet + OpenStreetMap tiles** (free, no API key). Everything shared lives in
`shared/map/leaflet.ts`: `loadLeaflet()`, the Ecuador view constants, `pinIcon()` (a `divIcon` per
`ReportType`), `currentPosition()` (geolocation with Spanish error messages) and `roundCoord()` (the
DB column is `decimal(9, 6)`).

- **Leaflet never enters the initial bundle.** It is loaded with a dynamic `import('leaflet')`, and
  its stylesheet is a non-injected style bundle (`angular.json`: `bundleName: "leaflet"`,
  `inject: false`) that `loadLeaflet()` appends as a `<link>` on first use. Don't `import` from
  `'leaflet'` at runtime anywhere else (`import type` is fine): that would pull ~150 kB into whichever
  chunk imports it.
- Leaflet runs **outside the Angular zone**; handlers re-enter with `zone.run` only when app state
  changes. Pins and popups are created by Leaflet outside Angular's view, so their styles are global
  (`styles/_map.scss`). Each map element gets `.map-surface` (`isolation: isolate`), so Leaflet's
  internal z-indexes (400–1000) never cover the nav.
- **`<app-location-picker>`** (`SharedModule`) is a `ControlValueAccessor`: tap the map, drag the pin
  or "Usar mi ubicación". The wheel does not zoom inside the form. The hint above it comes from
  `locationHint(type)`: the point is public, so adoption/help posts suggest a nearby spot instead of
  one's home.
- **`/mapa`** (`website/pages/mapa`) asks `getMapPoints(filter, viewport)` every time the map stops
  (debounced, `switchMap` drops stale areas), with type chips and a species select. It caps at
  `MAX_MAP_POINTS` (500, mirrors the backend) and says so. Popups are built with DOM nodes and
  `textContent` (the pet name is user input), and navigate with the router. `getMapPoints` does not
  use `checkLoading()`: the page shows its own indicator instead of the global spinner on every pan.
  The last view and filters are kept in memory, so coming back from a report restores the map.
- OSM's tile policy does not allow heavy traffic: if the site grows, swap `TILE_URL` for a provider.

`ReportService` builds query params from a `ReportFilter` object, skipping null/undefined/empty values —
`HttpParams.set(k, undefined)` would otherwise send the literal string `k=undefined`, which the backend
cannot bind to `int?` and answers with 400.

### Data models

DTO conventions in `models/report.model.ts`: `*View` interfaces are read shapes from the API;
`Create*DTO` / `Update*DTO` are write shapes. Request and response never share a type, mirroring the
backend's own rule:

- `reportView` — list and detail (`/report/getByFilter`, `/report/get/{id}`), with the animal data
  already unified (from the pet for a `Perdida`, inline otherwise). Images are `imgView` (`{ key, url }`),
  already the *effective* photos (own, else the pet's card).
- `reportUpdateView` — prefill for `GET /report/getUpdate/{id}`; `reportImages` (own) and `petImages`
  (a `Perdida`'s card) as separate lists.
- `CreateReportDTO` / `UpdateReportDTO` — write bodies. Neither carries `idUser` (the owner comes from
  the JWT) nor `idProvincia`.
- `reportMutationView` — what create / update / resolve return.
- `mapPointView` — map pins from `GET /report/getMapPoints`.
- `petView` — `GET /pet/mine` and the pet create/update response (`PetService`), with the derived
  `isLost` / `lostReportId` and `idProvincia` (to prefill the cascade).
- `PetCardDTO` — body of `POST /pet/create` and `PUT /pet/update` (with `idPet`); `imageKeys` is the full
  list, first = primary.

### My pets (`profile/pets`, ADR-16)

**Private**: only the owner sees their pets; a pet shows up in public only through its report.
`MyPetsComponent` lists the cards (`GET /pet/mine`) with "Editar ficha", "Ver su reporte" (when lost) or
"Reportar como perdida" (→ `difunde/publicar?pet=ID`). `PetFormComponent` serves both `pets/new`
(`POST /pet/create`) and `pets/edit/:id` (`PUT /pet/update`, which **replaces** the card and its zone);
editing finds the pet in `GET /pet/mine` (there is no get-by-id). It is built from two reusable pieces in
`SharedModule`: `<app-animal-fields>` (name, species, breed, sex, age → `birthDate`) and
`<app-zone-fields>` (provincia → cantón → sector), both bound to the parent's `FormGroup`. The report
forms still have their own copy of that markup (migrating them is a separate change).

## Design system

`src/styles.scss` defines an **OKLCH-based token palette** as CSS custom properties (`--blue`, `--yellow`, `--grey`, etc.), each with a hex fallback for browsers lacking `oklch()` support. Headings use the `--font-heading` (Fraunces) family; body uses `--font-body`. A custom reset lives in `src/app/styles/reset.scss` and is imported before Bootstrap components so it doesn't override button/input styling. Prefer these tokens over hardcoded colors.

## Environment

`src/environments/environment.ts` (and `.prod.ts`) hold `API_URL` (backend). There is no bucket URL any more: every photo arrives with its full `url` from the API. AWS credentials live only on the backend, never here.
