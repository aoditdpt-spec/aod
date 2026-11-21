# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

**aod.co.in** for AOD (Artists on Demand), an Ahmedabad marketplace for booking photographers, cinematographers, drone operators, anchors, musicians, DJs, singers, stand-up comedians, models, reel creators and makeup artists. On 2026-11-21 the site switched to the **new design** built in `E:\Projects\Internship\aod-redesign` (clean, black and white with AOD orange #ff6201 for the main action, Instrument Sans), keeping the full backend. The design before that is kept, without a backend, in `E:\Projects\Internship\aod-old`.

The guides live **outside the repo**, in `E:\Projects\Internship\guides\` (they hold the project's keys; never move them into a repo): `DEVELOPER_GUIDE.md` (how everything works, cookbook, errors), `DEPLOY_GUIDE.md` (the SQL, env vars, deploy order, test walk-through), `CLAUDE_CODE_GUIDE.md` (Mac setup and the push workflow), `aod-documents/backend-setup.md` (setting up the backend from nothing), `aod-documents/testing.md`, `vercel-env-backup.txt` (every env var), `supabase/clear-all-data-keep-team.sql`. Keep `DEVELOPER_GUIDE.md` and `DEPLOY_GUIDE.md` in step with changes, like this file. `context/brief.md` holds the owner's original notes.

## Commands

```bash
npm run dev            # http://localhost:3000 (the user usually runs one: don't start another on 3000)
npm run build          # production build (also type-checks)
npm run lint
npm run check:search   # search results for common queries and misspellings
npm run check:orders   # the admin's "Paste A WhatsApp Message" reader and the order IDs
npm run check:links    # portfolio / Drive link rules, the profile photo's file name and address
npm run check:db       # runs the migrations on PGlite and checks who can read and change what
npm run check:fresh    # builds the database, runs supabase/reset-everything.sql, builds it again
npm run check:markdown # the blog's Markdown reader
npm run check:xlsx     # the password-protected Excel export
```

No test runner: `scripts/*-check.mts` are plain Node scripts (Node's TypeScript support), so the libraries they test must not use `@/` imports. Add a case when changing what they test.

## Stack

- **Next.js 16 (App Router, `src/`) + React 19 + TypeScript.** Breaking changes from older Next.js: check `node_modules/next/dist/docs/` before using an API you're unsure of (`middleware` is `proxy`).
- **Tailwind CSS v4**, tokens in `src/app/globals.css` (`paper`, `ink`, `muted`, `line`, `wash`, `glass`, `brand`, `brand-hover`); use the token classes, never raw colours. **Motion** (`motion/react`).
- **Supabase**: `src/lib/supabase/server.ts` in server code acting as the signed-in person (row-level security applies), `client.ts` in the browser, `admin.ts` (secret key) only in server code after checking the input or the caller. A new server client per request.
- **Vercel**, Mumbai (`bom1`). HTTPS only (`src/lib/hsts.ts`); `src/proxy.ts` moves aod.co.in to www and serves the separate sites; every `*.vercel.app` address redirects to www.aod.co.in (`next.config.ts`).

## Two modes

`backendEnabled` (`src/lib/backend.ts`: the Supabase URL and publishable key are set).
- **Live**: forms save to the database first, sign-in sends real emailed 6-digit codes, the admin works on shared data, pages update by themselves (Realtime "changed" messages, `src/lib/live.ts`).
- **Preview** (no keys): the site behaves exactly like aod-redesign: sample data and everything typed kept in this browser (`src/lib/mock-db.ts`), any code works, nothing is required.
Every screen works in both. **Required-field checks run only live** (in the form and again on the server).

## The data adapter: `src/lib/app-db.tsx`

The new screens read one shape (`Db` in `mock-db.ts`) and save through `act.*`. Screens import from `@/lib/app-db` only, never `mock-db`.
- `useDb()`: preview → mock-db; live → the surrounding provider: `<AdminData>` (in `AdminShell`: `src/lib/admin-store.ts`, the whole admin data for signed-in staff, plus the chat summary), `<PortalData>` (in `PortalShell`: the signed-in artist's or applicant's portal, `src/lib/artist-live.ts`; `db.me` is their ID), `<CustomerData>` (My Bookings and the business portal: the signed-in email's own orders).
- `act`: preview → mock-db's; live → `liveAct`: admin changes through `admin-store`'s `update()` (optimistic, saves only the changed fields, logs activity; a refused save reloads and alerts), portal changes through `server/actions/artist.ts`, customer cancel/review through `server/actions/customer.ts`. A new admin button needs both: `act` in mock-db and `liveAct` in app-db.
- Mappings: booking `stage` (new / matched / advance / confirmed / completed / cancelled) = `bookings.status` (quoted, payment_pending read as matched; delivered, reviewed as completed; rescheduled as confirmed). Booking `lines` (category, kind, count) = `bookings.items` (category, service = the kind, count, artistIds); assigning puts the artist on their own line that still needs someone. An order's first payment is its Advance; verifying it moves a matched order to `advance`. Case status new / replied / escalated / resolved = received / acknowledged / escalated / resolved. Post Published / Scheduled (future `published_at`) / Draft. Artist `craft` = the kind in `details.kind`. Settings switches = `settings.notify` by the names the server checks ("New booking request", "New artist application", "Customer cancelled a booking", "New business account", "New artist message").
- Also exported: `useThread()` (chat, used by `ChatThread`), `usePortalInfo()`, `usePortalEmail()`, `useCustomerInfo()`, `teamUnread()`, `counts()`, `portfolioOf()`.

## Separate sites and links

Production: the artist portal at **artists.aod.co.in** (`src/app/artists`: `(public)` = sign-in at `/artists` and sign-up at `/artists/apply`; `(portal)` = the signed-in pages in `PortalShell`), the admin at **admin.aod.co.in** (`src/app/admin`, `AdminShell`), the Dispute Desk at **resolve.aod.co.in** (`src/app/resolve`, own header); `src/proxy.ts` serves them there; on localhost they stay paths. The For Artists page is www.aod.co.in/for-artists. **Always write links as paths (`/admin/bookings`, `/artists/profile`, `/resolve/new`, `/my-bookings`) and use `Link`, `useAppRouter`, `useAppPathname` from `@/components/ui/AppLink`, never `next/link`.** Each section's layout sets `<SectionProvider section="…">` and AppLink resolves the address (same site: the path without its prefix; another site: its address; from a separate site to the customer site: www). Emails use `sectionUrl()` / `siteUrl` (`src/lib/site-url.ts`). Every separate site shows "Back To Main Site" (`MainSiteLink`). Old addresses redirect: `/book/personal` → `/book`, `/dispute-desk…` → `/resolve…`, `/artists/sign-in` → `/artists`, `admin/dashboard` and `admin/resolution` (pages that redirect).

## Categories, kinds and order IDs

Six categories in `src/data/site.ts` (the owner's order and wording): **photo-video** Photography & Film (Photographers, Cinematographers, Drone Operators), **anchors-hosts**, **musicians-djs** (Musicians, DJs, Singers), **comedians**, **models-creators** (Models, Influencers, Reel Creators), **makeup-styling** (Makeup Artists). `types` are the kinds the booking asks for; `groups` are search words only. The kinds of artist for profiles, their services and their work questions are in `src/data/work-questions.ts` (`kinds` ids are the old category slugs: photographers, cinematographers, drone-pilots, anchors-hosts, musicians-djs, singers, comedians, models, content-creators, makeup-artists). `src/content/site.ts` re-exports the data for the server. **Order IDs** (`src/lib/order-id.ts`, no imports): AOD-<code>-<YYMM><number> (PH, AH, DJ, CO, MO, MU; MIX for several categories; B2B from a business account), numbered through the year (India time); a line's ID is the number with its category's code (`lineId`); older IDs (month first, B-1215) still read. A new category needs a code in `categoryCodes` (`check:orders` fails otherwise).

## Flows (details in the guides' DEVELOPER_GUIDE.md)

- **Booking** (`components/book/BookForm.tsx` → `createBookingRequest`, `server/actions/public.ts`): one question per screen, sliding (2026-11-21): category → kind and how many (adds that line to the cart) → "Need Anyone Else?" (the cart: Add Another Artist goes back to the categories, so one order holds several kinds of artist) → date (15 day tiles from tomorrow, Other Date opens the calendar popup `ui/DatePicker.tsx`) → start time and hours (scroll-wheel fields; moves on once both are set) → venue (Google Maps suggestions with `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, else plain text) and the brief → contact → Send OTP → Confirm (`verifyCode` signs them in; the server refuses an email that isn't the signed-in one). Saved first, then "Request Received" with the ID; after the reply: rows on the Sheet's "All orders" and the category's tab (a missing tab is created), team and customer emails; a failed save emails the team the whole request. The business portal uses the same form with `forceAudience="business"`. The hidden spam-trap field saves the request with a "check this one" note (`spamNote`), never drops it.
- **My Bookings** (`components/bookings`): email + code; the email's orders, progress, shortlisted artists (name, craft, city; never contacts or prices), payments ("Pay" asks AOD for the details; payments are UPI/bank transfer recorded by the team with the UTR), cancel within 2 hours, review, Book Again, Raise A Dispute.
- **AOD For Business** (`components/business`, `lib/business.ts`): account in `companies` (code first; types stored "Brand owner", shown "Brand Owner"); Calendar, Book Artists, Orders, Company. The Calendar works like Google Calendar (2026-11-21): days before today are greyed out (their orders still show), an order opens in a popup with everything about it (no separate page; the Orders tab uses the same popup), and a day from tomorrow on opens an "add event" popup (event name, start time, how many hours) whose Book Artists opens the booking questions with those filled in (`presetDate`, `presetEvent`; the event name is the booking's `occasion`) and skips the questions already answered.
- **Artist sign-up** (`components/artists/ApplyForm.tsx` → `createApplication`): step 1 name, phone, email + code; step 2 city, category, kind, experience, Instagram username **and** portfolio link (both required live). One profile per email. Then the portal's **Complete Your Details** (`dash/portal/CompleteProfile.tsx`): photo (→ AOD's Google Drive), date of birth (18+), area, languages, main kind and other kinds, services, each kind's questions (saved as `<kind>.<id>` in `details`, with `kind`, `other`, `agree`, `dob`, `locality`), about, declaration. Save = `saveArtistProfile` (a draft, nothing required); **Submit For Review** = `sendToAod` (the first send needs everything; emails the team). Approving copies everything to a new artist record.
- **Artist portal** (`dash/portal/*`): requests in their categories (Accept / Decline → `artist_replies`), shortlisted / chosen / confirmed bookings (one rule, `artistOrder()` in `lib/artist-orders.ts`), days off, profile, portfolio uploads (`PortfolioLive.tsx`, signed upload links, photos 15 MB, videos 50 MB, 30 files), messages, documents.
- **Admin** (`dash/admin/*`): staff sign-in (email in Team And Roles + code). Overview, Bookings (table/board, drawer: stage, quote, lines, shortlist/assign, payments, delivery link, reschedule, delete; New Booking with Paste A WhatsApp Message, `lib/whatsapp-order.ts`), Applications, Artists, Calendar, Payments (verify, payouts), Dispute Desk, Chat With Artists, Messages (templates), Blog, Reports And Exports (Excel encrypted with a password in the browser, `lib/xlsx-encrypt.ts`), Team And Roles (Admin = role `owner`, Developer), Activity Log, Settings.
- **Dispute Desk** (`components/dispute` → `server/actions/resolution.ts`): raise (side, issue, through AOD or not, booking number or who it's with, what happened, outcome, evidence, contact, confirmation; lists in `src/data/dispute-form.ts` and `pages.ts`, checked by the server) → DC-1001…; track with number + email; escalate.
- **Blog**: published posts read on the server (`server/blog.ts`, cached an hour, refreshed when the admin saves). **Newsletter**: no sign-up on the site; confirm/unsubscribe pages and the admin's sending still work.
- **Chat** (`chat_messages`, `server/actions/chat.ts`, `lib/chat.ts`): one conversation per artist; team members show as "AOD Team" to the artist; pushes to subscribed devices (`server/push.ts`, VAPID keys).

## Database

`supabase/migrations/`, each file run once in date order in the Supabase SQL Editor, **before** deploying code that uses it; never edit one that may have been run, add a new dated file. The latest is `20261121000000_new_ui.sql` (adds the `advance` booking stage). `supabase/reset-everything.sql` (not a migration) removes everything for a fresh start; the guides folder's `supabase/fresh-start/` has it with every migration numbered and joined (`ALL-IN-ONE.sql`) and the first-Admin insert. A new table must also be added to the reset file (`check:fresh` tests it). Tables: applications, artists, bookings, payments, payouts, leads, cases, staff, activity, settings, outbox, artist_replies, posts, subscribers, newsletters, companies, chat_messages, push_subscriptions; Storage buckets `portfolio` and `blog`. IDs: APP-201, ART-…, PAY-…, PO-…, DC-1001, BIZ-101, P-…, N-…, U-…. Row-level security: active staff read everything, Admins/Developers write (`private.staff_can()`); customers, artists and companies read nothing directly (server actions check who's signed in and return only their own data); signed-out visitors read only published posts. Access helpers live in the `private` schema with `set search_path = ''`. `src/server/rows.ts` maps rows ⇄ the admin's types. `npm run check:db` replays the migrations on PGlite; add a case when changing a rule. Failed sheet rows and emails wait in `outbox`; `GET /api/jobs/retry` with `Authorization: Bearer <CRON_SECRET>` retries them.

## Code layout

- `src/app/(site)` the customer site (`SiteChrome`: navbar, footer, phones' bottom bar, first-visit audience prompt); `src/app/artists`, `admin`, `resolve` the separate sites; `api/`; `manifests/` (each site installs as its own app, `src/lib/pwa.ts`).
- `src/components`: `home/`, `layout/`, `ui/` (`AppLink`, `MainSiteLink`, `TimePicker`, `VenueField`, `CountPicker`, `Markdown` …), `motion/`, `book/`, `bookings/`, `business/`, `artists/`, `dash/` (admin and portal), `dispute/`, `blog/`, `newsletter/`, `legal/`.
- `src/data`: the site's copy (home.ts, pages.ts, site.ts, legal.ts, work-questions.ts, dispute-form.ts). Copy changes happen there, not in JSX.
- `src/content`: what the server reads (site.ts re-export, artist-portal, artist-brief, business-portal, resolution, my-bookings, admin roles and permissions).
- `src/lib`: app-db, mock-db, admin-store, artist-live, chat, live, site-url, order-id, booking-needs, artist-orders, event-time, portfolio-links, whatsapp-order, fuzzy + search-index (search), xlsx + xlsx-encrypt, markdown.
- `src/server`: `actions/` (public, auth, customer, business, artist, admin, chat, push, resolution, newsletter, blog), notify, rows, ids, staff, live, push, artist-photos, work-details, blog.

## Design rules

- Clean, Apple-like (the manager's wish): no "Chat On WhatsApp" / "Talk To Us" / "Get Your Artist" buttons inside page content (the navbar, bottom bar and footer carry contact and booking), no small subtitle lines under headings, Title Case labels. Laptops and phones are designed separately where it matters (`lg:` from 1024px).
- Artists join only through the artist portal, never WhatsApp. WhatsApp stays a contact channel (`whatsappUrl()` in `src/data/site.ts`); the booking flow has no WhatsApp step.
- No sample photos of artists (initials instead).

## Rules carried over from the old-site audit

- Never show "received" or "confirmed" for a booking, application or case unless it has actually been saved.
- No hardcoded ratings, review counts, artist counts or "bookings" numbers: real data, or leave the element out.
- Don't claim escrow, payments or verification that aren't built (no payment gateway: UPI/bank transfer recorded by the team).
- Don't collect Aadhaar numbers or card copies; identity is verified by the team and marked in the admin.
- Privacy, terms and refund pages exist (`src/data/legal.ts`), still drafts to be confirmed by the founder and a lawyer before real payments; no GSTIN or street address placeholders.
- Every page needs a title, description, Open Graph tags and a share image; keep `sitemap.ts` and `robots.ts`.
- Render key content on the server so it shows without JavaScript.
