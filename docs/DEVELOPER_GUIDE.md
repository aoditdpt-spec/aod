# AOD website: developer guide

Everything a developer needs to work on the AOD (Artists on Demand) website: what it is, how it
is built, where every file lives and what it does, how data moves, how to change things, and what
the common errors mean.

- **Live sites:** `www.aod.co.in` (customers), `artists.aod.co.in` (artist portal),
  `admin.aod.co.in` (staff admin panel), `resolve.aod.co.in` (Dispute Desk).
- **Code:** GitHub `aoditdpt-spec/aod`, branch `main`. Every push to `main` deploys to production
  on Vercel.
- **Passwords and keys are not in this repo.** They live in `E:\Projects\Internship\aod docs\`
  (outside the repo) together with `backend-setup.md` (switching the backend on, step by step) and
  `testing.md` (how to test everything). Never commit keys or move those guides into the repo.
- `CLAUDE.md` at the repo root is the same knowledge written for the AI assistant; it is kept up
  to date with every change and is a good second reference.

---

## Contents

1. [What the website does](#1-what-the-website-does)
2. [Quick start](#2-quick-start)
3. [Tech stack](#3-tech-stack)
4. [How it fits together](#4-how-it-fits-together)
5. [Folder structure](#5-folder-structure)
6. [Every folder in detail](#6-every-folder-in-detail)
7. [How the main flows work](#7-how-the-main-flows-work)
8. [Database](#8-database)
9. [Environment variables](#9-environment-variables)
10. [Design system](#10-design-system)
11. [Where to change what (cookbook)](#11-where-to-change-what-cookbook)
12. [Commands and checks](#12-commands-and-checks)
13. [Deploying](#13-deploying)
14. [Errors and how to fix them](#14-errors-and-how-to-fix-them)
15. [Rules and gotchas](#15-rules-and-gotchas)

---

## 1. What the website does

AOD is an Ahmedabad marketplace for booking event talent: photographers, cinematographers, drone
pilots, anchors, editors, DJs, comedians, singers, makeup artists, models and content creators.
The site is a from-scratch rebuild of the old aod.co.in (which had no backend and only opened
WhatsApp). It has four parts:

| Part | Address | Who uses it | What it does |
| --- | --- | --- | --- |
| Customer site | `www.aod.co.in` | Customers and businesses | Browse categories, search, send a booking request, follow bookings in **My bookings**, read policies |
| Artist portal | `artists.aod.co.in` | Artists and applicants | Apply to join, sign in, see onboarding status, edit profile, upload portfolio, set days off, quote or decline booking requests |
| Admin panel | `admin.aod.co.in` | AOD staff | Review applications, manage artists and bookings, record and verify payments, handle cases, messages, reports, team, settings |
| Dispute Desk | `resolve.aod.co.in` | Artists and clients with a dispute, about an AOD booking or one made outside AOD | Raise a formal case, track it, escalate it |

WhatsApp stays the main contact channel (click-to-chat links only, no WhatsApp API). Payments are
taken by UPI or bank transfer outside the site; staff record them in the admin. There is no
payment gateway yet.

### Two modes: live and preview

The whole site runs in one of two modes, chosen by `backendEnabled` in `src/lib/backend.ts`:

- **Live** (the Supabase URL and publishable key are set): forms save to the database, sign-in
  sends real emailed codes, the admin works on shared data, emails and sheet rows are sent.
- **Preview** (no Supabase keys): the site still works as a demo. Forms hand off to WhatsApp, My
  bookings shows samples, the admin runs on sample data kept in the browser (`localStorage`), and
  sign-in accepts any code.

Every live feature keeps its preview fallback, so a deployment never breaks because a key is
missing. When you add a feature, make it work in both modes.

---

## 2. Quick start

**You need:** Node.js 24 (the check scripts use Node's built-in TypeScript support; the site
itself needs Node 20.9 or newer), npm, Git.

```bash
git clone https://github.com/aoditdpt-spec/aod.git
cd aod
npm install
cp .env.example .env.local      # then fill it in (section 9); leave it empty for the preview
npm run dev                     # http://localhost:3000
```

Opening the separate sites locally:

| Site | Local address |
| --- | --- |
| Customer site | `http://localhost:3000` |
| Artist portal | `http://localhost:3000/artists` or `http://artists.localhost:3000` |
| Admin panel | `http://localhost:3000/admin` or `http://admin.localhost:3000` |
| Dispute Desk | `http://localhost:3000/resolve` or `http://resolve.localhost:3000` |

In `.env.local` for development, set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` so links stay
on your machine.

Before pushing, run:

```bash
npm run build && npm run lint && npm run check:search && npm run check:links && npm run check:db && npm run check:orders && npm run check:markdown
```

---

## 3. Tech stack

| Layer | Technology | Version | Notes |
| --- | --- | --- | --- |
| Framework | **Next.js** (App Router, `src/` folder) | 16.3 | Breaking changes from older Next.js: `middleware` is now `proxy` (`src/proxy.ts`). Read `node_modules/next/dist/docs/` before using an API you're unsure of. |
| UI | **React** | 19.2 | Server Components by default; client components only where there is interaction. |
| Language | **TypeScript** | 5 | Strict. `npm run build` also type-checks. |
| Styling | **Tailwind CSS** | 4 | No `tailwind.config`. Design tokens live in the `@theme` block of `src/app/globals.css`. |
| Animation | **Motion** (`motion/react`) | 14 | Loaded lazily (`LazyMotion strict`): use `m.*` components from `motion/react-m`, never `motion.*`. |
| Icons | **lucide-react** | 1.x | Mapped by name in `src/components/ui/Icon.tsx`. |
| Fonts | **Bricolage Grotesque** (headings) + **Montserrat** (text) | — | Through `next/font/google` in `src/app/layout.tsx`; served from the site itself. |
| Database, sign-in, files, live updates | **Supabase** (Postgres, Auth, Storage, Realtime) | `@supabase/supabase-js` 2, `@supabase/ssr` 0.12 | Project in Mumbai (`ap-south-1`). |
| Email | **Resend** | HTTP API | Sign-in codes go through Supabase's SMTP set to Resend; site emails call the Resend API directly (`src/server/notify.ts`). |
| Orders spreadsheet | **Google Sheets API** with a service account | HTTP API | No Google SDK; the JWT is signed by hand in `src/server/notify.ts`. |
| Hosting | **Vercel** | — | Server functions in Mumbai (`bom1`, `vercel.json`). |
| Domain and DNS | **GoDaddy** | — | `aod.co.in` and the subdomain records. |
| Retries scheduler | **cron-job.org** | — | Calls `/api/jobs/retry` every 15 minutes. |
| Database checks | **PGlite** (Postgres in WebAssembly) | 0.5 | Dev only: `npm run check:db`. |
| Lint | **ESLint** 9 + `eslint-config-next` | — | `npm run lint`. |

Some things are hand-written instead of using a library: the Excel export (`src/lib/xlsx.ts`),
fuzzy search (`src/lib/fuzzy.ts`), photo shrinking (`src/lib/image-resize.ts`) and the Google
service-account sign-in.

---

## 4. How it fits together

```
                       Browser (customer, artist, staff)
                                     │
                 www / artists. / admin. / resolve.aod.co.in
                                     │
                         Vercel (Next.js, Mumbai)
   ┌───────────────────────────────────────────────────────────────────────┐
   │ src/proxy.ts      picks the site from the host name (artists./admin./  │
   │                   resolve.) and rewrites to /artists, /admin, /resolve │
   │ src/app/...       pages (prerendered static HTML + client components)  │
   │ src/server/...    server actions: validate, check who's signed in,     │
   │                   save with Supabase, then after() → emails + sheet    │
   │ /api/jobs/retry   retries failed emails and sheet rows (outbox)        │
   └───────────────────────────────────────────────────────────────────────┘
          │                      │                       │
     Supabase               Resend API           Google Sheets API
 (Postgres + RLS,         (emails from         (orders sheet: "All orders"
  Auth codes, Storage,     connect@aod.co.in)   + one tab per category)
  Realtime channels)
```

- **Pages are static.** Every route is prerendered at build time. Data that changes (bookings,
  the admin, the portal) is loaded in the browser by calling server actions after the page loads.
- **Server actions are the only way in to the data** for customers and artists. They check who is
  signed in and return only what that person may see. Staff read the database directly from the
  browser, and Postgres row-level security (RLS) decides what they may read and change.
- **After a save**, notifications run with Next's `after()`, so the visitor gets their answer
  first. A notification that fails is queued in the `outbox` table and retried later.
- **Live updates:** a database trigger sends a small "changed" message over Supabase Realtime on
  private channels; open pages reload their own data when one arrives.

---

## 5. Folder structure

```
aod/
├── AGENTS.md                 Note for AI agents: this Next.js version has breaking changes
├── CLAUDE.md                 Project knowledge for the AI assistant (keep it current)
├── docs/
│   └── DEVELOPER_GUIDE.md    This guide
├── context/                  Owner's notes and design references (not used by the site)
│   ├── brief.md              The owner's raw notes for the redesign
│   ├── brands/               Original client logos the owner sent
│   └── *.txt, *.docx, *.pdf  Old-site copy and the platform plan
├── public/                   Files served as-is at the site root
│   ├── aod-wordmark.png      The orange "AOD." logo (pages show aod-wordmark-sm.png, unoptimized: Next's small AVIF copy turned it brown)
│   ├── brands/               Client logos for the brand strip (transparent PNGs)
│   ├── categories/           One photo per category (mock photos for now)
│   └── media/                Hero video cuts (AV1 + H.264, laptop + phone) and posters
├── scripts/                  Plain Node checks (npm run check:*)
│   ├── db-check.mts          Runs the migrations on PGlite and tests who can read/change what
│   ├── links-check.mts       Tests the portfolio-link rules
│   ├── order-check.mts       Tests reading the booking form's WhatsApp message back into its fields
│   └── search-check.mts      Tests search results for common queries and misspellings
├── supabase/
│   └── migrations/           SQL files, run once each, in date order, in Supabase's SQL Editor
├── src/
│   ├── proxy.ts              Host-based routing for the artists./admin./resolve. subdomains
│   ├── app/                  Routes (pages, layouts, the retry API, icons, global CSS)
│   ├── components/           React components, grouped by area
│   ├── content/              All copy and data (text, categories, questions, sample data)
│   ├── lib/                  Shared helpers and browser-side state (client + server safe)
│   └── server/               Server-only code: server actions, notifications, row mapping
├── next.config.ts            Security headers, caching, image formats, redirects
├── vercel.json               Vercel region (Mumbai)
├── eslint.config.mjs         Lint rules
├── postcss.config.mjs        Tailwind's PostCSS plugin
├── tsconfig.json             TypeScript settings; "@/..." means "src/..."
├── .env.example              Every environment variable, with comments
└── package.json              Dependencies and npm scripts
```

Files that are generated or local only (ignored by Git): `node_modules/`, `.next/` (build
output), `.env.local` (your keys), `next-env.d.ts`, `tsconfig.tsbuildinfo`.

---

## 6. Every folder in detail

### 6.1 `src/app/`: routes

Next.js App Router: each folder is a URL segment, `page.tsx` is the page, `layout.tsx` wraps the
pages below it. Folders in brackets like `(site)` are **route groups**: they share a layout but
don't appear in the URL. `[slug]` is a dynamic segment.

```
src/app/
├── layout.tsx            Root: <html>, the two fonts, site metadata, MotionProvider, <noscript> rule
├── globals.css           Tailwind import, design tokens (@theme), base styles, custom utilities
├── favicon.ico, icon.png, apple-icon.png    App icons (picked up by Next automatically)
├── manifest.ts           The customer site's web app manifest (/manifest.webmanifest), from src/lib/pwa.ts
├── manifests/[file]/     The artist portal's, admin's and Dispute Desk's manifests (/manifests/admin.webmanifest…)
├── not-found.tsx         404 page (renders its own navbar and footer)
├── sitemap.ts, robots.ts SEO files (sitemap lists the customer site only)
├── (site)/               THE CUSTOMER SITE
│   ├── layout.tsx        Adds Navbar, Footer, WhatsAppFab, ScrollProgress
│   ├── page.tsx          Homepage: only composes sections (order explained in comments)
│   ├── categories/page.tsx          Every category as photo tiles (the phone tab bar's Categories tab), then Most booked
│   ├── categories/[slug]/page.tsx   One page per category, built from `categories` in site.ts, with the booking quiz (its category already picked)
│   ├── book/page.tsx              "Personal or business?" choice
│   ├── book/[audience]/page.tsx   The booking quiz (MatchQuiz) for personal / business
│   ├── my-bookings/page.tsx       My bookings (MyBookings component)
│   ├── business/, for-artists/, about/   Marketing pages
│   └── privacy/, terms/, refund-policy/  Policies (render src/content/legal.ts)
├── artists/              THE ARTIST PORTAL (artists.aod.co.in)
│   ├── layout.tsx        Portal header/footer (PortalChrome), noindex
│   ├── page.tsx          Sign-in
│   ├── apply/page.tsx    The six-step application (ApplyForm)
│   └── (portal)/         Signed-in pages; layout.tsx wraps them in PortalGate + PortalNav
│       └── dashboard/, profile/, portfolio/, bookings/, availability/, documents/
├── admin/                THE ADMIN PANEL (admin.aod.co.in)
│   ├── layout.tsx        noindex
│   ├── page.tsx          Staff sign-in (AdminSignIn)
│   └── (panel)/          Signed-in pages; layout.tsx wraps them in AdminShell
│       └── dashboard/, applications/, artists/, bookings/, calendar/, payments/,
│           resolution/, messages/, reports/, team/, activity/, settings/
├── resolve/              THE RESOLUTION CENTRE (resolve.aod.co.in)
│   ├── layout.tsx        Its own small header and footer
│   ├── page.tsx          How a case works, promises, grievance officer
│   ├── new/page.tsx      Raise a case (CaseForm)
│   └── track/page.tsx    Track and escalate a case (TrackCase)
└── api/jobs/retry/route.ts   GET with "Authorization: Bearer <CRON_SECRET>": retries the outbox
```

Page files are thin: they set metadata (title, description, Open Graph) and render components.
The admin and portal pages are mostly one component each from `src/components/admin/pages/` or
`src/components/artists/`.

### 6.2 `src/proxy.ts`: subdomains

Next 16 calls middleware "proxy". This one looks at the host name: a host starting with
`artists.`, `admin.` or `resolve.` is rewritten to `/artists`, `/admin` or `/resolve`, so
`admin.aod.co.in/bookings` serves `/admin/bookings`. An old address that still has the prefix
(`admin.aod.co.in/admin/bookings`) gets a 308 redirect to the clean one. Every other host passes
through untouched. The `matcher` skips `_next/` and any path with a file extension.

### 6.3 `src/components/`: React components

| Folder | What's in it |
| --- | --- |
| `home/` | One file per homepage section: `Hero` (phones: `ExploreGrid`, "What are you looking for?"; laptops: the full-screen hero with `HeroDemo` from `HeroMotion`; both use `HeroVideo`), `Stats`, `BrandStrip`, `CategoryCoverflow`, `CategoryGrid`, `MostBooked`, `VerifiedSection`, `Portals`, `ResolutionFlow` (the Dispute Desk's steps, in place of the old How it works), `Features`, `GetMatched`, `MatchQuiz` (the booking quiz), `BookingOptions`, `FinalCta` |
| `layout/` | `Navbar` (client: category dropdown, search, city; on phones an app-style top bar with a back arrow and the city pill), `AppTabBar` (the bottom tab bar on phones and tablets and its More sheet), `Footer`, `AnnouncementBar`, `WhatsAppFab`, `InstallPrompt` |
| `ui/` | Shared pieces: `Container` (page width), `Button` (`buttonClasses()`, `ButtonLink`), `Icon` (icon names → lucide + brand SVGs), `PhotoPlaceholder`, `Rating`, `StepFlow` (numbered steps), `VerifiedArtists`, `CopyButton`, `CountPicker` ("How many?": 1–4, then "More" up to 20), `Sheet` (the phone bottom sheet used for menus and pickers), `ScrollRow` (Headout-style sideways card row with See all and ← → buttons), `Spinner` / `PageLoader` (in `Spinner.tsx`: a small turning ring for buttons that wait; the AOD loader for areas loading their data), `LoadingBar` (the orange bar at the top while a page loads or the app moves to another page, and a "Loading…" pill when that's slow; started by `src/instrumentation-client.ts`) |
| `motion/` | `MotionProvider` (LazyMotion + reduced-motion), `features.ts` (the lazily loaded animation code), `Reveal` / `StaggerList` / `StaggerItem` (scroll-in), `TiltCard` (tilt, pop up and zoom for cards that don't open anything), `Coverflow` (the 3D carousel), `ScrollProgress` |
| `search/` | `SearchBox`: navbar search with suggestions, keyboard navigation, typed placeholder |
| `location/` | `CityPicker`, `CitySheetButton` (phones) and `CityChips`: the visitor's city |
| `categories/` | `CategoryTiles` (a photo tile per category, used on `/categories` and in a category page's "You can also book"), `StickyBookBar` (a category page's Book bar on phones) |
| `bookings/` | `MyBookings`: sign-in, list of the customer's bookings, progress, reviews |
| `artists/` | The artist portal: `ApplyForm`, `SignIn`, `PortalGate`, `PortalChrome`, `PortalNav`, `AccountMenu`, `Dashboard`, `OnboardingTimeline`, `ProfileEditor`, `PortfolioManager`, `FileDrop`, `LinkEditor`, `AvailabilityCalendar`, `BookingsBoard`, `BookingCard`, `DocumentsPanel`, `DigiLockerCard`, `form.tsx` (Field, ChipGroup, CheckRow, input styles) |
| `admin/` | `AdminShell` (sidebar, header, Live dot), `AdminSignIn`, `DataTable` (sortable/filterable table), `ui.tsx` (drawer, badges, sections), `useOpen.ts` (`?open=<id>` drawers), `pages/` (one component per admin page) |
| `resolve/` | `CaseForm`, `TrackCase` |
| `legal/` | `LegalPage`: renders a policy from `src/content/legal.ts` |

Interactive components start with `"use client"`. Everything else is a Server Component.

### 6.4 `src/content/`: all copy and data

Change words here, not in JSX.

| File | Holds |
| --- | --- |
| `site.ts` | Brand details (phone, email, socials), **categories** (name, icon, photo, services, search keywords), cities, homepage copy (hero, stats, how it works, features, portals, get-matched), occasions for the quiz, client brands, About page, For Artists and Business copy. Ratings and counts in it are sample data (flagged at the top). |
| `artist-portal.ts` | Portal copy, languages, `experienceLevels`, **`workQuestions`** (the application's "Your work details" questions per category), `bothLinksCategories`, application steps, onboarding stages, upload limits, sample artist and booking requests |
| `admin.ts` | Admin pipelines (application and booking stages), roles and permissions, WhatsApp message templates (the admin menu itself is `nav` in `AdminShell.tsx`) |
| `admin-sample.ts` | Sample data for the admin preview (phones start with 55, emails use example.com) |
| `my-bookings.ts` | Sample bookings for the My bookings preview |
| `resolution.ts` | Dispute Desk copy, promises, case types, statuses, grievance officer (draft) |
| `legal.ts` | Privacy policy, terms, cancellation & refund policy (drafts) |

### 6.5 `src/lib/`: shared helpers and browser state

These can run in the browser (and most also on the server). Files with **no imports** are kept
that way on purpose so the check scripts can test them alone.

| File | What it does |
| --- | --- |
| `backend.ts` | `backendEnabled`: live or preview mode |
| `supabase/server.ts` | Supabase client for Server Components / Actions, acting **as the signed-in user** (RLS applies). Create one per request. |
| `supabase/client.ts` | Supabase client for client components (browser) |
| `supabase/admin.ts` | Supabase client with the **secret key**: skips RLS. Server code only, and only after checking the input or the caller. |
| `admin-store.ts` | The admin's data layer: types for every record, loading the whole `Db`, `update()` (every change goes through it and writes the activity log), saving only what changed, live reloads, session |
| `artist-live.ts` | The artist portal's data layer: same interface in live and preview (`usePortalState`, `useArtistProfile`, `saveProfile`, `setBlockedDates`, `answerRequest`…) |
| `artist-store.ts` | Preview-mode portal data in `localStorage`; `ArtistProfile` and `WorkDetails` types |
| `customer-store.ts` | Preview-mode "requests this browser sent" for My bookings |
| `local-store.ts` | `createStore()`: a small `localStorage` store read with `useSyncExternalStore` |
| `city.ts` | The visitor's city (`localStorage` key `aod-city`) |
| `live.ts` | `listenLive()` / `useLiveRefresh()`: join Realtime channels, reload on change, poll every minute when disconnected |
| `site-url.ts` | Addresses: `siteUrl`, `siteHref()`, `sectionUrl()`, `portalHref()`, `sectionLink()`, `sectionPath()` (see section 15) |
| `whatsapp.ts` | `whatsappUrl()` (chat with AOD) and `whatsappShareUrl()`. Build every `wa.me` link here. |
| `whatsapp-order.ts` | `parseOrderMessage()`: reads the booking form's WhatsApp message back into its fields (including how many of each category) for the admin's "Paste a WhatsApp message" box; `pickService()` guesses the service (no imports, tested by `check:orders`) |
| `booking-needs.ts` | How many artists of each category a booking needs (`MAX_ARTISTS` = 20, `quickCounts`, `clampCount()`, `withCount()` → "Photographers × 3", `needsText()`), and an artist's categories (`allCategories()`, `worksIn()`) (no imports) |
| `event-time.ts` | Event times: "8:00 PM – 1:00 AM (5 hours, ends next day)" (no imports) |
| `fuzzy.ts` | Search ranking and typo tolerance (no imports, tested by `check:search`) |
| `search.ts` | Builds the search index from `site.ts` |
| `portfolio-links.ts` | Checks portfolio links (no imports, tested by `check:links`) |
| `image-resize.ts` | Shrinks photos in the browser to WebP, max 2560px, before upload |
| `xlsx.ts` | Writes .xlsx and CSV files for Reports & exports |
| `swipe.ts`, `motion-safe.ts` | Carousel swipe handling; reduced-motion helpers |
| `xlsx-encrypt.ts` | `encryptXlsx(bytes, password)`: password-protects an .xlsx the way Excel does (AES-256, SHA-512 × 100,000, HMAC), in the browser; the admin's Excel buttons use it through `useExcelExport()` (tested by `check:xlsx`) |
| `markdown.ts` | The blog and newsletter's simple Markdown: `parse()` into blocks, `toHtml()` / `toText()` for emails, `safeHref()` / `safeImage()`, `slugify()`, `readingMinutes()` (no imports, tested by `check:markdown`) |
| `pwa.ts` | The web app manifests: `siteManifest()` and `sectionManifest()` (names, icons, start page, shortcuts), so each site installs as its own app (see 7.9) |

### 6.6 `src/server/`: server-only code

| File | What it does |
| --- | --- |
| `actions/public.ts` | `createBookingRequest`, `createApplication`: validate, save with the secret key, then emails and sheet rows in `after()`. A filled hidden spam-trap field (`website`) doesn't drop the request: it's saved with an internal "check this one" note (`spamNote` in `notify.ts`), the team email is marked "[Check: possible spam]" and no confirmation is sent. |
| `actions/auth.ts` | `requestCode`, `verifyCode`: emailed 6-digit codes. Staff only if their email is in `staff`; artists only if AOD knows their email. |
| `actions/customer.ts` | My bookings: `myOrders` (the signed-in customer's bookings), `submitReview`, `cancelMyBooking` (within 2 hours of booking) |
| `actions/artist.ts` | Artist portal: load, profile, availability, replies to requests, portfolio uploads (signed upload links) |
| `actions/admin.ts` | `adminSession`, `loadAdminDb`, `saveAdminChanges`: checks the staff role, then saves the changed records |
| `actions/newsletter.ts` | `subscribe` (double opt-in: saves a pending sign-up, emails a confirmation link), `confirmSubscription`, `unsubscribe`, `sendNewsletter` (staff: a test to yourself, or every confirmed subscriber through Resend's batch API) |
| `actions/blog.ts` | `startBlogUpload`: a one-time upload link to the `blog` bucket, staff only |
| `actions/resolution.ts` | Raise, track and escalate a case: about an AOD booking (its number) or one made outside AOD (who it's with, `other_party`). Tracking needs the case number plus the email; never returns internal notes. |
| `notify.ts` | Emails (Resend), sheet rows (Google Sheets), `runOrQueue()` (try now, queue failures in `outbox`), `runJob()` (used by the retry route), team email list, notify settings |
| `rows.ts` | `fromRow` / `toRow`: database rows (snake_case) ↔ admin types (camelCase) |
| `staff.ts` | `currentStaff()`: the signed-in, active staff member (the admin's actions, blog uploads and the newsletter check it) |
| `blog.ts` | `publishedPosts()`, `postBySlug()`: published posts for the public pages, read without signing in (preview: the sample posts) |
| `email-layout.ts` | The look of AOD's HTML emails (newsletter, confirmation): `emailLayout()`, `emailButton()`, `emailStyles` |
| `ids.ts` | `insertWithNextId()`: readable IDs (APP-201, PAY-3101…), and `insertOrder()`: a new booking's order ID (AOD-PH-102601, `src/lib/order-id.ts`); both retry on a duplicate |
| `live.ts` | Realtime channel names (`customer:<sha256 email>`, `artist:<id>`…) |

Files in `src/server/actions/` start with `"use server"`: each exported function can be called
from the browser and runs on the server. Treat every argument as untrusted input.

### 6.7 `supabase/migrations/`: the database

| File | Adds |
| --- | --- |
| `20261009000000_init.sql` | All tables, row-level security, settings, outbox |
| `20261010000000_live_and_artists.sql` | Live-update trigger and Realtime policy, artist replies, portfolio storage bucket, artist access |
| `20261013000000_no_pay_page.sql` | Removes the old "Payment reported" alert |
| `20261014000000_details_and_developers.sql` | Application `details`, owner/developer roles, access checks moved to a `private` schema, fixed search paths |
| `20261014010000_outbox_rule.sql` | A "server only" policy on `outbox` |
| `20261016000000_team_bookings.sql` | Several artists per booking (`artists_needed` 1–20, `artist_ids`; `artist_id` stays as the first), artists in several categories (`other_categories` on artists and applications), live updates for every assigned artist |
| `20261016010000_one_order_per_request.sql` | One booking per request with a line per category (`items`), `artists_needed` may go above 20 in all, the "Customer cancelled a booking" alert; repeats the sixth step, so it works without it |
| `20261019000000_blog_and_newsletter.sql` | The blog and newsletter: `posts`, `subscribers`, `newsletters`, the public `blog` bucket |
| `20261019010000_artist_brief.sql` | The booking's `brief` column ("Brief for the artists") |
| `20261023000000_order_ids.sql` | A unique index so no two orders share a year and number under different category codes (AOD-PH-102605 and AOD-DJ-102605) |
| `20261023010000_disputes_outside_aod.sql` | `cases.other_party`: who a dispute is with, for a booking made outside AOD (no booking number). Until it's run, the server writes that into `booking_ref` |

Each file is run **once**, in date order, in Supabase's SQL Editor. Never edit a file that may
already have been run: add a new dated file instead, and add a case to `scripts/db-check.mts`.

### 6.8 `scripts/`, `public/`, `context/`

- `scripts/*.mts` are plain Node scripts (Node runs TypeScript directly). Each prints a result
  and exits non-zero on failure.
- `public/` is served at the site root (`/aod-wordmark.png`). Files in `/media`, `/brands` and
  `/categories` are cached by browsers for 30 days, so **replace a file under a new name**.
- `public/sw.js` is the service worker, `public/offline.html` the page it shows offline, and
  `public/icons/` the app icons (see 7.9).
- `context/` holds references for designers and planners only; nothing in it is used by the site.

### 6.9 Root config files

| File | What to know |
| --- | --- |
| `next.config.ts` | Security headers including a **Content Security Policy** (production only), 30-day caching for `/media`, `/brands`, `/categories`, AVIF/WebP images, and redirects: every `*.vercel.app` address → `www.aod.co.in`, and `/artists`, `/admin`, `/resolve` on the main domain → their subdomains |
| `vercel.json` | `"regions": ["bom1"]` (Mumbai) |
| `tsconfig.json` | `@/` is `src/` |
| `eslint.config.mjs` | `next/core-web-vitals` + TypeScript rules |
| `.env.example` | Every environment variable, with comments |

---

## 7. How the main flows work

### 7.1 A customer sends a booking request

1. `/book` → personal or business → `/book/personal` runs `MatchQuiz` (`src/components/home/MatchQuiz.tsx`):
   occasion, who they need (any number of categories, and how many of each: 1–4, or "More" for
   up to 20, through `CountPicker`), then event details and contact. Every field is required.
   Each category page runs the same quiz in its "Book …" section with that category already
   picked (`initialNeeds`), so a visitor sets how many and adds other artists for the same event.
2. **The email is confirmed first**, so bots can't order: the send button emails a 6-digit code
   (`requestCode(email, "customer")`, the same sign-in as My bookings) and shows a code box;
   "Confirm & send" checks it (`verifyCode`), which signs the visitor in as that email (and so into
   My bookings). Someone already signed in with that email skips the code. `createBookingRequest()`
   refuses a request whose email isn't the signed-in one (`verify: true`, and the quiz asks for a
   new code). If the code can't be sent, the visitor can still send the request on WhatsApp,
   marked `Ref: not saved on the website`. Preview: no email; any 6 digits pass.
3. Live: the quiz calls `createBookingRequest()` (`src/server/actions/public.ts`). It validates
   everything again, then inserts **one booking for the whole request** with a line in `items`
   for each category and how many artists of it (`insertOrder()` in `src/server/ids.ts`). Its ID,
   which is also the customer's reference, is AOD-<category code>-<MMYY><number>: AOD-PH-102601
   for photographers only, AOD-MIX-102602 for several categories (see **IDs** in section 8).
   Photographers × 2, a model and an anchor are one order with three lines, one quote and one
   payment; the team assigns artists to each line.
4. Only after the save succeeds does the visitor see "received" with the reference. WhatsApp then
   opens with the reference in the message. If saving fails, the visitor is told and WhatsApp
   carries the request instead.
5. In `after()`: a row on the sheet's "All orders" tab and on each category's tab, a team email,
   and a confirmation email to the customer (`src/server/notify.ts`). Failures go to `outbox`.
6. Preview: no save; the request is kept in this browser (`customer-store.ts`) and sent on WhatsApp.

**Making sure every order that reaches WhatsApp also reaches the admin:**

- The send control is a `<button>`, not a `wa.me` link (a link could be opened in a new tab and
  skip the save).
- A dropped connection gets one retry before the quiz gives up.
- If saving still fails, the WhatsApp message ends `Ref: not saved on the website`, and the server
  emails the team the whole request directly through Resend (not through the database, which may
  be what failed).
- The WhatsApp message carries every field, including the phone number, so the team can paste it
  into the admin: Bookings → New booking → "Paste a WhatsApp message" fills the form in
  (`src/lib/whatsapp-order.ts`), including how many of each ("Photographers × 3"). Several
  categories become one booking with a line for each, with a note saying it came from WhatsApp.
- A hidden spam-trap field never drops a request (it's saved with a "check this one" note).
- Chats started with the floating WhatsApp button never touch the site; the team adds those with
  New booking (only the WhatsApp Business API could capture them automatically).

### 7.2 An artist applies

1. `artists.aod.co.in/apply` runs `ApplyForm` (`src/components/artists/ApplyForm.tsx`): About you,
   Your craft (what they mainly do, and optionally the other categories they also work in),
   Your work details (questions from `workQuestions` in `src/content/artist-portal.ts`, a section
   for each chosen category through `workSections()`; questions asked the same way by two
   categories are asked once, and another category's own questions are saved as
   `<category>.<id>`), Portfolio, Verification, Review.
2. Live: `createApplication()` validates every required question (a follow-up question counts only
   when `workQuestionShown()` says it's on screen), saves the application (APP-201…) with the
   answers in `details`, then emails the team and the applicant.
3. The applicant signs in to the portal with an emailed code and sees their real onboarding step.
4. Staff move the application through review → meeting → trial → approve in the admin; approving
   creates the artist record (ART-101…) with the same categories. Staff can change an artist's
   other categories in the artist's drawer; matching offers an artist for bookings in any of them.

### 7.3 Signing in (customers, artists, staff)

1. The page calls `requestCode(email, who)` (`src/server/actions/auth.ts`). Staff must be in the
   `staff` table; artists must be a known artist or applicant.
2. Supabase emails a 6-digit code (through Resend SMTP; template set in the Supabase dashboard).
3. `verifyCode()` checks it and sets the session cookie.

### 7.4 Staff change something in the admin

1. Every change calls `update(area, text, fn)` in `src/lib/admin-store.ts`. `fn` edits a copy of
   the data; `update()` writes an activity-log line.
2. Live: the page shows the change at once, then `saveAdminChanges()` (`src/server/actions/admin.ts`)
   sends only the records added, changed or removed, and for changed records only the columns
   that differ. So two people editing different fields of one record don't undo each other.
3. The server checks the staff role; row-level security checks it again. If the save is refused,
   the page shows why and reloads the data.
4. New records are inserted, never upserted, so two people taking the same number get an error
   instead of overwriting each other.

### 7.5 Live updates

A trigger on every table (`live_changed()`) sends a small "changed" message (table and id, never
the record) on private Realtime channels: `staff` (every change), `customer:<sha256 of email>`,
`artist:<id>` and `applicant:<sha256 of email>`. A policy on `realtime.messages` lets each
signed-in person join only their own channels. Pages reload their own data through their server
actions when a message arrives, when the tab comes back into view, and every minute while
disconnected. The admin header shows a green **Live** dot when connected.

### 7.6 Emails and sheet rows that fail

`runOrQueue()` tries each job; a failure (or a missing key) inserts it into `outbox` with the
error. `GET /api/jobs/retry` with `Authorization: Bearer <CRON_SECRET>` retries pending jobs, up to
6 attempts, then marks them `failed` with the last error. cron-job.org calls it every 15 minutes.

### 7.7 Artist portfolio uploads

The browser shrinks photos (`image-resize.ts`), asks the server for a one-time signed upload link
(`actions/artist.ts`), uploads straight to the `portfolio` storage bucket (bypassing the server's
request size limit), then tells the server, which checks the stored file (type and size) before
listing it on the artist's record. Limits: photos 15 MB, videos 50 MB, 30 files.

### 7.8 Payments

No gateway. Staff send payment details on WhatsApp (templates in the admin fill in the amount),
the customer pays by UPI or bank transfer, staff record the amount and UTR on the booking
(**Record payment**), and verifying it in **Payments** confirms the booking.

### 7.9 Installing as an app (PWA)

Every site can be installed as an app: "Add to Home screen" on phones, the install button in the
address bar on laptops. The customer site's manifest is `src/app/manifest.ts`; the artist portal,
admin and Dispute Desk each link their own from their `layout.tsx` (`/manifests/<section>.webmanifest`,
built from `src/lib/pwa.ts`), so each installs under its own name and opens at its own front page.
Icons are in `public/icons/`: the rounded "A." tile (`icon-*`) and, for Android's shaped icons,
a full-bleed orange square with "AOD." inside the safe zone (`maskable-*`). iPhones use
`apple-icon.png` and the `appleWebApp` metadata.

The service worker, `public/sw.js`, is registered by `src/instrumentation-client.ts` in production
only (never under `npm run dev`; test it with `npm run build && npm start`). It touches only GET
requests to the same domain: pages are network first with a copy kept, so a page seen before
opens offline and an unseen one shows `public/offline.html`; `/_next/static` is cache first; images
and fonts show the cached copy and refresh in the background. Page data (RSC), `/api`, `/media`,
anything marked `no-store`, Supabase and server actions always go to the network. `next.config.ts`
serves `/sw.js` with `no-cache`, so a deploy reaches installed apps on their next visit.

**The "Get the AOD app" popup** (`src/components/layout/InstallPrompt.tsx`, in the customer site's
layout; copy in `installApp` in `site.ts`) shows on phones and tablets 4 seconds after a page opens,
never inside the installed app, on laptops or on the `/book` pages. On Android, Chrome sends an
install offer (`beforeinstallprompt`), which `src/instrumentation-client.ts` catches early and keeps
(`src/lib/install-app.ts`); the popup only shows once it has arrived, and "Install app" opens the
browser's own install dialog with it (one more tap: no website can install itself without it).
iPhones have no such offer, so the popup lists the Share → Add to Home Screen steps. "Not now"
hides it for a week, the iPhone "Got it" for four (`aod-install-later` in localStorage).

**Phones and tablets work like an app** (below 1024px, in a browser tab and in the installed app
alike): a bottom tab bar, `src/components/layout/AppTabBar.tsx` (copy in `appMenu` in `site.ts`):
Explore, Categories, Book, Bookings and More, a sheet with every other place, including the artist
portal, the Dispute Desk and the team's admin sign-in, since the app has no address bar. The navbar
becomes an app-style top bar (back arrow, logo, city pill, search), the homepage hero is a
Headout-style banner with "What are you looking for?", and the WhatsApp button and footer make room
for the tab bar. Links to the separate sites open their own domains; each of those installs as its
own app.

**Laptops keep the desktop design** (1024px and up, `lg:`): the full-screen video hero (`HeroDesktop`
in `Hero.tsx`, with the booking walk-through from `HeroMotion.tsx`, copy in `hero.desktop`), the
"Book from these services" under the coverflow (the phone hero's photo tiles, bigger, 6 above and
5 below: `ExploreTiles variant="panel"`), Most booked as the phone's photo list in two columns
(service photos from `public/services/` where `mostBooked` gives one), the /book choices
and booking options without photos, text-only category menu and search suggestions, and the smaller
newsletter box. The two designs are meant to stay different: put app-only changes behind `max-lg:` /
`lg:hidden` and leave the laptop layout as it is unless asked. Where a whole section differs, the
component renders both versions and hides one with CSS (the hero's video only plays in the one shown).

The manifest's `screenshots` (`public/screenshots/`: three phone shots of the app with its tab bar,
780×1688, and one wide, 1366×768, WebP) show in Android's install dialog like a store listing.
Retake them when the pages change a lot, and keep sample ratings out of them. **Changing
how `sw.js` caches? Bump `VERSION` at its top**: the next visit deletes the old caches.

### 7.9a The brief for the artists

The booking quiz's optional section after the event details (`ArtistBrief`, questions in
`src/content/artist-brief.ts`): quick questions for each kind of artist picked, then preferences,
reference links and anything else. `cleanBrief()` keeps only known questions and choices (the form
and the server both run it); `briefRows()` / `briefCommonRows()` / `briefLines()` turn it into rows
and lines. It's saved in `bookings.brief` (jsonb, ninth migration) and shown or sent in: the
WhatsApp message (after the details, so a pasted message keeps it with the notes), the emails, the
sheet's "Brief" column, the admin drawer, each artist's "new request" WhatsApp message and their
portal card (their category plus the shared answers). To change a question, edit
`briefQuestions`; answers saved before keep their old wording, and answers to a removed question
stop showing.

### 7.10 The blog and the newsletter

**Writing a post** (admin → Blog): New post makes a draft (P-101) and opens the editor: title (the
address is made from it, `slugify()`, and can be edited), summary, cover photo, the text, tags,
author and a publish date. The text is simple Markdown (`src/lib/markdown.ts`); the toolbar types
headings, bold, lists, links and photos in for you, and Preview shows it as the site will.
Photos are shrunk in the browser and uploaded to the public `blog` bucket through a one-time link
(`startBlogUpload`, staff only). **Publish** sets the status and date; a future date schedules it.
Saving goes through `saveAdminChanges`, which calls `revalidatePath("/blog", "layout")`, so the
site shows the change on the next visit.

**On the site:** `/blog` and `/blog/<address>` read published posts through `src/server/blog.ts`
with the publishable key and nobody signed in: row-level security only ever returns published posts
whose date has passed, and the pages stay cached (`revalidate = 3600`). A post page has Open
Graph tags (its cover is the WhatsApp preview), article data for search engines, a WhatsApp share
button, a booking prompt and the newsletter sign-up. `/blog/rss.xml` is the feed; `sitemap.ts`
lists the posts. Until the eighth migration is run, the blog shows as empty and the admin's Blog
and Newsletter lists are empty (nothing else breaks).

**Signing up** (`NewsletterSignup`, in the footer and on the blog): `subscribe()` saves the email
as pending and emails a confirmation link; only a click on it makes the person subscribed, so a bot
or someone typing another person's address can't sign anyone up. It answers the same whatever the
address, sends at most one confirmation per address every 10 minutes, and ignores the hidden
spam-trap field. `/newsletter/confirm` and `/newsletter/unsubscribe` ask with a button, because
some mail filters open every link in an email by themselves.

**Sending an issue** (admin → Newsletter): write it (or add a blog post's title, summary and link),
**Send me a test**, then **Send to N**. `sendNewsletter` sends one email per confirmed subscriber
through Resend's batch API (100 per call), each with its own unsubscribe link and the
List-Unsubscribe header (Gmail's own Unsubscribe button calls `/api/newsletter/unsubscribe`). The
issue is marked sent with how many it reached; if Resend stops part-way (its free plan sends 100
emails a day), the admin says how many got it.

---

## 8. Database

**Tables** (all in `public`): `applications`, `artists`, `bookings`, `payments`, `payouts`,
`leads`, `cases`, `staff`, `activity`, `settings`, `artist_replies` (an artist's quote or decline),
`posts`, `subscribers`, `newsletters` (the blog and newsletter, eighth migration), `outbox` (retries).
Storage buckets: `portfolio` (public; artists' photos and videos) and `blog` (public; the blog's photos).

**IDs** are readable references: `APP-201` (application), `ART-101` (artist), `PAY-3101`
(payment), `L-401` (lead), `RC-1001` (case), `U-1` (staff member); the next number is the highest
existing one plus one.

**Order IDs** (`src/lib/order-id.ts`, no imports, tested by `check:orders`): a booking is
`AOD-<category code>-<MMYY><number>`, such as `AOD-PH-102601`: the two-letter code of its category
(`categoryCodes`: PH, CN, DR, AH, ED, DJ, CO, SI, MU, MO, CC; add one for a new category), the
month and year it was made (India time), and its number in the year. The number counts every
order of the year whatever its category (01 … 99, then 100 …) and starts again at 01 each January.
An order of several categories is `AOD-MIX-…`; each of its lines has the same number with its own
code (`lineId()`: `AOD-DR-102602` of `AOD-MIX-102602`), shown on the line's block in the admin
drawer, the category tabs of the orders sheet, the artist's WhatsApp messages and the artist
portal. `sameOrder()` matches a line ID to its order (the Dispute Desk). The ID is also the
customer's reference (`request_ref`). The website takes the next number with `insertOrder()`, the
admin with `newOrderId()`; the tenth migration's unique index refuses a second order with the same
year and number, and the website then tries the next one. Orders made before keep `B-1201` with
the customer's reference `AOD-1201`. An order that gets another category later keeps its ID.

**Who can do what (row-level security):**

- Active staff (listed in `staff`, matched by the signed-in email) read everything. Writes need one
  of the two roles: `owner` (shown as "Admin") or `developer`.
- Customers and artists read nothing directly. Their pages go through server actions that return
  only what that person should see (no internal notes, shortlists or other people's details).
- Signed-out visitors get nothing.
- The check functions (`private.staff_role()`, `private.is_staff()`, `private.staff_can()`,
  `private.my_artist_id()`) live in the `private` schema, which the API doesn't expose. New helper
  functions get `set search_path = ''` and name everything in full (Supabase's Security Advisor
  checks both).

**One order per request:** a booking is a whole request. `items` (jsonb) has a line per category:
`{ category, service, count, artistIds }`, `count` from 1 to 20 and `artistIds` the artists
assigned to that line. The older columns stay filled from the lines: `category` / `service` (the
first line), `artists_needed` (all lines added up), `artist_ids` (every assigned artist; live
updates and the artist portal use it) and `artist_id` (the first). A row saved before lines
existed reads as one line from those columns. The admin's booking drawer has a block per line
("2 of 3 assigned") and "Add to this order"; payouts are one per assigned artist, suggested from
the artist's own portal quote or an equal part of the order's quote, and editable.

**Customer cancelling:** for 2 hours after booking (`customerCancelHours` in
`src/content/my-bookings.ts`) My bookings shows "Changed your mind?" with a Cancel button.
`cancelMyBooking()` (`src/server/actions/customer.ts`) checks the email and the time again, sets
the booking to Cancelled with a note, and emails the customer and (unless switched off in admin
Settings, "Customer cancelled a booking") the team.

**Mapping:** database columns are snake_case; the app's types (in `admin-store.ts`) are camelCase.
`src/server/rows.ts` converts both ways. A new column needs a migration, the type, and both
mappings.

---

## 9. Environment variables

Set them in `.env.local` locally and in Vercel → Project → Settings → Environment Variables for
production. **Any change in Vercel needs a redeploy** to take effect, and `NEXT_PUBLIC_*` values
are baked into the browser code at build time.

| Variable | Used for | Without it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project address | Preview mode |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase public key (browser) | Preview mode |
| `SUPABASE_SECRET_KEY` | Server-only key that skips RLS (public forms, My bookings, portal) | Saving and portal features say "isn't set up yet". **Never give it a `NEXT_PUBLIC_` name.** |
| `RESEND_API_KEY` | Sending site emails | Emails wait in `outbox` |
| `EMAIL_FROM` | Sender, e.g. `AOD <connect@aod.co.in>` (must be on the domain verified in Resend) | Emails wait in `outbox` |
| `TEAM_EMAIL` | Where team notifications go (comma-separated) | Falls back to the site email |
| `ORDERS_SHEET_ID` | The orders sheet (its ID, or its full link) | Sheet rows wait in `outbox` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The service account the sheet is shared with | Sheet rows wait in `outbox` |
| `GOOGLE_PRIVATE_KEY` | That account's private key, on one line with `\n` for line breaks, in double quotes | Sheet rows wait in `outbox` |
| `CRON_SECRET` | Protects `/api/jobs/retry` | The retry address always answers 401 |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp number for every `wa.me` link (country code, no +) | Uses the built-in default |
| `NEXT_PUBLIC_MEDIA_URL` | Serve the hero video from a bucket/CDN instead of `public/media` | Served from the site |
| `NEXT_PUBLIC_SITE_URL` | The customer site's address for links in emails and from the subdomains | `https://www.aod.co.in` (use `http://localhost:3000` in development) |

---

## 10. Design system

- **Colours:** three only: AOD orange `#ff6201`, white and black. Every other shade is a mix of
  those. They are tokens in the `@theme` block of `src/app/globals.css` and used through classes:
  `text-ink`, `text-body`, `text-muted`, `bg-brand`, `hover:bg-brand-hover`, `bg-peach`, `bg-wash`,
  `border-line`, `bg-night`… **Never write raw hex values in components**; for a tint use
  `color-mix()` with a token, or an opacity class like `bg-brand/10`. Status colours (red errors,
  green success, amber warnings) and the WhatsApp green stay as they are.
- **Fonts:** Bricolage Grotesque for headings (`h1`–`h3` get it automatically; `font-display` puts
  it on anything else), Montserrat for everything else (`font-sans`).
- **No text shadows or glows:** no text has a shadow or glow behind it (the old raised
  `text-shadow-3d` headings and the hero's shadows and glows were removed on purpose). Smaller
  headings are bold; buttons and body text are flat.
- **Size:** `html { font-size: 81% }` in `globals.css` scales the whole site (everything is in rem).
- **Width:** wrap page content in `Container` (`max-w-page`, about 1600px).
- **Buttons:** use `buttonClasses()` / `ButtonLink` from `src/components/ui/Button.tsx`.
- **Cards:** two kinds (`src/components/ui/cards.ts`). A card that opens a page gets `linkCard`
  (orange border, light orange tint, bold text on hover; `linkTitle` / `linkText` on its text). A
  card that doesn't open anything is a `TiltCard` (tilts, pops up and zooms; nothing else). Grids
  arrive with `StaggerList` + `StaggerItem`. No light or glow on any card.
- **Animation:** `m.*` components only (see section 15). Animated elements render their final
  content on the server and carry `data-reveal`; a `<noscript>` rule shows them when JavaScript is
  off. Respect reduced motion (`MotionProvider` sets `reducedMotion="user"`).
- **Photos over icons:** real artist photos are the main trust signal; design around them.

---

## 11. Where to change what (cookbook)

| I want to… | Change | Then |
| --- | --- | --- |
| Change any wording on the site | `src/content/*.ts` (mostly `site.ts`) | Build |
| Add an order that only reached WhatsApp | Admin → Bookings → New booking → paste the message into "Paste a WhatsApp message", add the phone if it's missing | Nothing to code |
| Delete a test or duplicate order | Admin → Bookings → open it → **Delete booking** (bottom of the drawer). Removes its payments and payouts too; cancel instead to keep a record | Nothing to code |
| Change the booking form's WhatsApp message | `message` in `src/components/home/MatchQuiz.tsx` **and** the labels in `src/lib/whatsapp-order.ts` | Add a case to `scripts/order-check.mts`, run `check:orders` |
| Change the most artists of one category per request (20) | `MAX_ARTISTS` in `src/lib/booking-needs.ts` and the 20 in `readNeed()` in `whatsapp-order.ts` | `check:orders` |
| Change how long customers can cancel themselves (2 hours) | `customerCancelHours` in `src/content/my-bookings.ts`, and the sentence in the refund policy (`legal.ts`) | — |
| Add or rename a category | `categories` in `src/content/site.ts` (slug, name, icon, photo, services, keywords); add its photo to `public/categories/`; add its questions to `workQuestions` in `artist-portal.ts`; add a tab with the exact category name to the orders sheet | `npm run check:search` |
| Change search results | `keywords` in `site.ts`; ranking in `src/lib/fuzzy.ts` | Add a case to `scripts/search-check.mts`, run `check:search` |
| Change the artist application questions | `workQuestions` in `src/content/artist-portal.ts` (kinds: `one`, `many`, `text`, `long`; `optional`; `showIf`) | Old answers stay saved by id and still show in the admin |
| Change which categories need both Instagram and portfolio links | `bothLinksCategories` in `artist-portal.ts` | — |
| Change the portfolio-link rules | `src/lib/portfolio-links.ts` | Add a case to `scripts/links-check.mts` |
| Change colours | Tokens in `src/app/globals.css` | Check light text on orange stays readable |
| Change fonts | `src/app/layout.tsx` (next/font) and `--font-*` in `globals.css` | — |
| Replace the hero video | New files in `public/media/` **with new names**, then `HeroVideo.tsx` (`<source>` names and `codecs`) | Keep AV1 ≈ 2–3 MB (laptop), 1 MB (phone) |
| Replace category photos or brand logos | New file with a **new name** in `public/categories/` or `public/brands/`, then the path and size in `site.ts` | 30-day browser cache |
| Edit a policy | `src/content/legal.ts` | — |
| Change an email's text | `src/server/actions/public.ts` (booking request, application), `resolution.ts` (new and escalated cases), `artist.ts` (an artist's quote or decline, to the team), `admin.ts` ("You've been added to the AOD admin") | Plain-text emails sent through `runOrQueue()` |
| Change the sign-in code email | Supabase dashboard → Authentication → Emails → Templates (HTML in `backend-setup.md` 2.9) | Not in code |
| Change the sheet's columns | `sheetHeader` in `src/server/notify.ts` and `sheetRow` in `src/server/actions/public.ts` | Add new columns at the end: a tab whose heading row is the older headings gets the new ones added; anything else, update existing tabs by hand |
| Change WhatsApp templates in the admin | `src/content/admin.ts` | — |
| Add a page to the customer site | New folder in `src/app/(site)/` with `page.tsx` + metadata | Add it to the list in `src/app/sitemap.ts` |
| Add a homepage section | New file in `src/components/home/`, add it to `src/app/(site)/page.tsx` | Comment why it sits where it does |
| Add an admin page | Component in `src/components/admin/pages/`, route in `src/app/admin/(panel)/<name>/page.tsx`, menu entry in `nav` in `src/components/admin/AdminShell.tsx` | — |
| Add a database column | New dated file in `supabase/migrations/`, the type in `admin-store.ts`, both mappings in `server/rows.ts` | Run the SQL in Supabase; `npm run check:db` |
| Change who can read/change a table | New migration with the policy change | Add a case to `scripts/db-check.mts` |
| Add a server action | A `"use server"` function in `src/server/actions/`; validate every input; use `supabase/server.ts` (as the user) or `supabase/admin.ts` (secret key, only after checking the caller) | Keep a preview fallback |
| Load a script, font or image from a new website | Add its origin to the CSP in `next.config.ts` | Test with `npm run build && npm start` |
| Add a subdomain | `sections` in `src/proxy.ts`, redirects in `next.config.ts`, `Section` in `site-url.ts`; domain in Vercel + DNS at GoDaddy | Give it a manifest in `src/lib/pwa.ts` and link it from its layout |
| Change the installed app's name, icons or shortcuts | `src/lib/pwa.ts`; icons in `public/icons/` | — |
| Change what works offline | `public/sw.js` | Bump `VERSION`; test with `npm run build && npm start` |
| Change the brief's questions | `briefQuestions` in `src/content/artist-brief.ts` (kinds `one`, `many`, `text`) | Run `check:orders` if the message lines change |
| Change how admin Excel files are protected | `src/components/admin/ExcelExport.tsx` (the password box, minimum length) and `src/lib/xlsx-encrypt.ts` (the encryption) | Run `check:xlsx`, then open a downloaded file in Excel |
| Write or publish a blog post | Admin → Blog → New post (or open one) → Publish | Shows on the site straight away |
| Change what the blog's Markdown understands | `src/lib/markdown.ts` (and `src/components/blog/Markdown.tsx` for how it looks) | Add a case to `scripts/markdown-check.mts`, run `check:markdown` |
| Change the newsletter's wording or emails | `newsletter` in `src/content/blog.ts`; the email look in `src/server/email-layout.ts` | Send yourself a test from admin → Newsletter |

---

## 12. Commands and checks

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server at http://localhost:3000 |
| `npm run build` | Production build; also type-checks. Fails on any TypeScript error. |
| `npm start` | Runs the production build locally (use it to test the security policy) |
| `npm run lint` | ESLint |
| `npm run check:search` | Search results for common queries and misspellings |
| `npm run check:links` | Portfolio-link rules |
| `npm run check:db` | Runs every migration on PGlite and checks each kind of user's access |
| `npm run check:orders` | Reads sample WhatsApp messages from the booking form back into their fields (the admin's paste box), and checks the order IDs (codes, MIX, line IDs, the yearly count) |
| `npm run check:xlsx` | Encrypts a workbook, then an independent decryptor (officecrypto-tool, dev only) opens it with the password, refuses a wrong one and gets the same bytes back. Pass a folder (`npm run check:xlsx -- <folder>`) to save the file and open it in Excel by hand |
| `npm run check:markdown` | The blog and newsletter's Markdown: what each piece of formatting shows, and that scripts, `javascript:` links and outside photos never get through |

There is no test runner. The checks are plain Node scripts in `scripts/`. Add a case when you
change search, link rules or database access. The live walk-through (three browsers: staff,
customer, artist) is in `testing.md` in `aod docs`.

---

## 13. Deploying

- **Push to `main` = deploy to production.** Vercel builds and deploys automatically (about 1–2
  minutes). The deployment status shows on the commit in GitHub.
- **Preview deployments can't be opened on their `*.vercel.app` address**: `next.config.ts`
  redirects every `*.vercel.app` address to `www.aod.co.in`. Test locally instead (`npm run build`
  then `npm start`).
- **Environment variable changed in Vercel?** Redeploy (Deployments → newest → ⋯ → Redeploy).
- **Database change?** Run the new migration in Supabase's SQL Editor **before** deploying the
  code that needs it (code that saves a column the database doesn't have yet fails to save).
- **Domains:** each subdomain is a domain in Vercel plus a CNAME and a `_vercel` TXT record at
  GoDaddy (`backend-setup.md` section 8).
- **Caching:** pages are static; files in `/media`, `/brands`, `/categories` are cached 30 days by
  browsers; optimised images are cached 30 days. Rename files when you replace them.
- **Retries:** cron-job.org calls `https://www.aod.co.in/api/jobs/retry` every 15 minutes with
  `Authorization: Bearer <CRON_SECRET>`.

---

## 14. Errors and how to fix them

### 14.1 Build and type errors

| You see | Cause | Fix |
| --- | --- | --- |
| `Type error: …` during `npm run build` | TypeScript error | Fix the type; `npx tsc --noEmit` shows all errors quickly |
| `You have rendered a motion component within a LazyMotion component…` (in the browser) | A `motion.div` (or other `motion.*`) was used | Use `import * as m from "motion/react-m"` and `m.div` |
| A Tailwind class does nothing, or two classes fight | A token name collides with a custom `@utility` (a `--color-x` token creates `text-x`/`bg-x` classes) | Rename the token or the utility in `globals.css` |
| `Module not found: Can't resolve '@/…'` in a check script | Scripts run in plain Node, which doesn't know the `@/` alias | Only import files with no `@/` imports into scripts (that's why `fuzzy.ts`, `portfolio-links.ts`, `event-time.ts` have none) |
| ESLint `@next/next/no-img-element` | A plain `<img>` | Use `next/image`, or add the disable comment (as `PortfolioManager.tsx` does for storage files) |
| `LF will be replaced by CRLF` warnings from Git on Windows | Line endings | Harmless |

### 14.2 In the browser

| You see | Cause | Fix |
| --- | --- | --- |
| Hydration error ("text content does not match") | Server HTML differs from the first client render, e.g. reading `localStorage` or `window` during render | Read browser-only state through `useSyncExternalStore` stores (see `local-store.ts`, `city.ts`) with a server snapshot |
| Console: `Refused to load … because it violates the Content Security Policy` (production only) | A new outside script, style, font, image, video or connection | Add its origin to the CSP in `next.config.ts` |
| A link from a subdomain goes to the wrong place | Raw path used instead of the helpers | Inside a section use `sectionLink()`; to the customer site use `siteHref()`; into a section from elsewhere use `portalHref()` / `sectionUrl()` |
| Admin menu highlights the wrong page in production | `usePathname()` used directly | Use `sectionPath()`, which adds the section prefix back |
| Someone gets "Not secure" or a certificate warning on aod.co.in | Usually their phone or network still has an old address for the domain, or the phone's date is wrong; the site itself always redirects to https:// and sends HSTS (`src/lib/hsts.ts`) | Check `curl -sI http://aod.co.in`; ask for a screenshot of the exact message; once the domain is on the HSTS preload list, browsers never try http:// |
| A replaced photo or video still shows the old one | 30-day cache on `/media`, `/brands`, `/categories` | Give the new file a new name |
| An old page, or "You're offline", while online | The service worker's copy (it serves its copy only when the network fails) | DevTools → Application → Service workers → Unregister, and Storage → Clear site data; if `sw.js` changed how it caches, bump `VERSION` |
| Admin shows no green Live dot | Realtime can't connect (network, or the Realtime policy missing) | Check the second migration was run; the page still reloads every minute |

### 14.3 Messages people see on the forms (and where they come from)

These are returned by server actions as `{ ok: false, error }` and shown on the page.

| Message | Raised in | Meaning |
| --- | --- | --- |
| "Saving isn't set up yet." / "Sign-in isn't set up yet." / "The Dispute Desk isn't connected yet." / "Reviews aren't set up yet." | `actions/public.ts`, `auth.ts`, `resolution.ts`, `customer.ts` | Supabase keys (or `SUPABASE_SECRET_KEY`) missing in this deployment |
| "Pick the occasion." / "Pick who you need." / "Choose the event date, from tomorrow onwards." / "Add the event's start and end time." / "Choose your city." / "Add a few event details." / "Enter your name." / "Enter a valid phone number." / "Enter a valid email address." | `public.ts` → `createBookingRequest` | Booking request failed validation |
| "Couldn't save your request just now. Please send it on WhatsApp instead." | `createBookingRequest` | Database insert failed: check Supabase status and the Vercel function logs. The team also gets a "Couldn't save a booking request" email with every detail, and the customer's WhatsApp message ends `Ref: not saved on the website`: paste it into New booking. |
| "Couldn't reach AOD just now, so your request goes to WhatsApp instead…" | `MatchQuiz.tsx` | The visitor's connection dropped twice. The WhatsApp message ends `Ref: not saved on the website`: paste it into New booking. |
| "Enter your full name." / "Pick your category." / "Please accept the terms." / `Answer "…" on the Your work details step.` / "Add both your Instagram link and a portfolio or showreel link." | `public.ts` → `createApplication` | Application failed validation |
| "Couldn't save your application just now. Please try again, or send it on WhatsApp." | `createApplication` | Database insert failed |
| "AOD has no artist or application with this email…" | `auth.ts` | Artist sign-in with an unknown email |
| "This email isn't on the AOD team. Ask an admin to add you in Team & roles." | `auth.ts` | Staff sign-in with an email not in `staff` |
| "Please wait a minute before asking for another code." | `auth.ts` (`friendly()`) | Supabase's email rate limit |
| "That code didn't work or has expired…" | `auth.ts` | Wrong or old code (codes last one hour) |
| "You're signed out. Please sign in again." | `actions/admin.ts`, `artist.ts` | The session expired |
| `Your role can't change …` | `actions/admin.ts` | The staff member's role doesn't allow that table |
| "The team needs at least one active admin." | `actions/admin.ts` | Tried to remove or demote the last Admin |
| "Someone else just added a record with the same number…" | `actions/admin.ts` | Two people created a record at the same moment; the page reloaded; try again |
| `Couldn't save …: it may have been deleted, or your role can't change it.` | `actions/admin.ts` | The record is gone, or RLS refused the update |
| `Couldn't delete from …: it may already be gone, or your role can't delete it.` | `actions/admin.ts` | Someone else deleted it first, or RLS refused the delete (it does so silently, so the server counts the deleted rows) |
| "Availability opens once you're live on AOD." / "Booking requests open once you're live on AOD." | `actions/artist.ts` | An applicant (not yet an artist) tried an artist-only feature |
| "This request isn't one of yours." / "This request has already been settled." | `actions/artist.ts` | Replying to someone else's or a closed booking request |
| "Upload JPG, PNG, WebP or HEIC photos, or MP4 or MOV videos." / `You can keep up to 30 files…` / "The upload didn't finish…" | `actions/artist.ts` | Portfolio upload rules |
| "No case matches that number and email…" | `actions/resolution.ts` | Wrong case number or email on Track |
| "Couldn't get a free reference number. Please try again." | `server/ids.ts` | Several duplicate-number retries failed in a row (very busy moment) |

To see the real cause of any "Couldn't … just now" message, open Vercel → the project → **Logs**
(server function errors) or Supabase → **Logs**.

### 14.4 Emails, the sheet and the outbox

Failures here never undo a save; the job waits in the `outbox` table with `last_error`. Read it in
Supabase → Table editor → `outbox`.

| `last_error` | Cause | Fix |
| --- | --- | --- |
| "Email isn't set up yet (RESEND_API_KEY, EMAIL_FROM)." | Keys missing | Set them in Vercel, redeploy |
| `Resend 403: …` / `Resend 422: …` | Sending domain not verified, or `EMAIL_FROM` not on it | Verify aod.co.in in Resend; fix `EMAIL_FROM` |
| "The orders sheet isn't set up yet (ORDERS_SHEET_ID)." or "(GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY)" | Keys missing | Set them, redeploy |
| "ORDERS_SHEET_ID doesn't look like a Google Sheet ID…" | Something extra in the value | Use the ID, or the full sheet link |
| `Google sign-in 400/401: …` (or a key decode error) | `GOOGLE_PRIVATE_KEY` malformed | One line, `\n` for line breaks, wrapped in double quotes |
| `Sheet tab "…" 400: Unable to parse range` | A tab named after the category is missing | Add a tab with exactly the category's name (and "All orders") |
| `Sheet tab "…" 403: The caller does not have permission` | The sheet isn't shared with the service account | Share it with the service account's email as Editor |
| `Sheet tab "…" 404` | Wrong sheet ID | Fix `ORDERS_SHEET_ID` |
| A team email subject starts with "[Check: possible spam]" | The form's hidden spam-trap field was filled (a bot, or rarely a browser's autofill) | Open the record in the admin: it was saved, with a note. Delete it if it's spam; otherwise reply as usual (no confirmation email went to the person) |
| Retry route answers `401 {"error":"Not allowed"}` | `CRON_SECRET` missing or the header is wrong | Header must be exactly `Authorization: Bearer <CRON_SECRET>`; redeploy after setting it |
| Job status `failed` | 6 attempts used | Fix the cause, then set the row's `status` back to `pending` and `attempts` to `0` |

### 14.5 Deployment and configuration

| Symptom | Cause | Fix |
| --- | --- | --- |
| A Vercel preview link opens the live site | `*.vercel.app` redirects to `www.aod.co.in` by design | Test locally |
| A changed env variable has no effect | Not redeployed | Redeploy |
| `admin.aod.co.in` shows "Invalid configuration" in Vercel | DNS records missing or wrong | CNAME + `_vercel` TXT at GoDaddy (`backend-setup.md` §8) |
| Supabase project "paused" | Free plan pauses after a week without activity | Restore it in the Supabase dashboard |
| Supabase Security Advisor warnings on a new function | Missing `set search_path = ''` or not in the `private` schema | Follow the pattern in `20261014000000_details_and_developers.sql` |

---

## 15. Rules and gotchas

**Product rules (from the audit of the old site):**

- Never show "received" or "confirmed" unless the record was actually saved. Opening WhatsApp is
  not saving.
- No hardcoded ratings, review counts, artist counts or booking numbers on the live site; show real
  data or leave the element out. (The sample numbers in `site.ts` are flagged.)
- Don't claim escrow, payments or verification that isn't built.
- Never collect Aadhaar numbers; identity checks go through a KYC provider (DigiLocker).
- Every page needs a title, description, Open Graph tags and a share image (links are shared on
  WhatsApp). Key numbers and content render on the server.

**Code rules:**

- Copy lives in `src/content/`, not in JSX.
- Build every WhatsApp link with `whatsappUrl()` (`src/lib/whatsapp.ts`).
- Use the secret-key Supabase client (`supabase/admin.ts`) only in server code, after validating
  input or checking the caller. Never expose `SUPABASE_SECRET_KEY` to the browser.
- Every live feature keeps a preview fallback.
- Validate on the server even when the form already validated (anyone can call a server action).
- New database records insert, never upsert.
- Never edit a migration that may have been run; add a new dated one.
- Don't add `loading.tsx` files. React puts a large page's content behind its loading screen in
  the built HTML (shown first, swapped in by a script), so every first visit flashed the spinner
  and visitors without JavaScript saw only the spinner. The top loading bar covers page changes;
  give a waiting button a `Spinner` and an area that loads data in the browser a `PageLoader`.
- Links: inside the artists/admin/resolve sites write `/artists/...`, `/admin/...`, `/resolve/...`
  and pass them through `sectionLink()` (drops the prefix in production). Links back to the
  customer site use `siteHref()`. Links into a section from elsewhere (and in emails) use
  `portalHref()` / `sectionUrl()`.
- Animated elements: `m.*` components, final content rendered on the server, `data-reveal` kept.
- Tokens, not raw colours. No text shadows or glows; small headings are bold.
- Rename media files when replacing them (30-day cache).
- After a change that affects how the project works, update `CLAUDE.md`, this guide, and
  `testing.md` in `aod docs` if a flow changed.

**Local storage keys (preview mode and per-browser settings):** `aod-city`, `aod-sent-requests`,
`aod-customer-session`, `aod-admin-db-v1`, `aod-admin-session`, `aod-artist-profile`,
`aod-artist-preview-mode`, `aod-artist-blocked-dates`, `aod-artist-booking-actions`. Clear them in
the browser's dev tools to reset the preview.
