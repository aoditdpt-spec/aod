# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

A full redesign, from scratch, of **aod.co.in** for AOD (Artists on Demand), an Ahmedabad marketplace for booking photographers, cinematographers, DJs, anchors, makeup artists and other event talent. The goal of the rebuild is a site that feels **more trustworthy** and has real booking and artist data, unlike the old site, which had no backend and only opened WhatsApp.

- `context/brief.md` holds the owner's raw notes for the redesign: features, nav, homepage sections and references. Read it before planning any page.
- `context/*.html` is a saved copy of the Upwork homepage, the main visual reference (layout, colours, typography). Other references: Urban Company, Snabbit, collectui.com.

## Commands

```bash
npm run dev     # dev server at http://localhost:3000
npm run build   # production build (also type-checks)
npm run lint    # ESLint (next/core-web-vitals + typescript)
npm run check:search   # checks search results for common queries and misspellings
npm run check:links    # checks the artist portal's portfolio-link rules
npm run check:pay      # checks the payment page's UPI rules (amounts, UTR, upi:// links)
```

There is no test runner yet. The `scripts/*-check.mts` files are plain Node scripts (run through Node's built-in TypeScript support). Add a case there when you change search keywords or tuning, the link rules or the UPI helpers.

Copy `.env.example` to `.env.local` and fill in the Supabase URL and publishable key before running anything that touches the database.

## Stack

- **Next.js 16 (App Router, `src/` dir) + React 19 + TypeScript.** This version has breaking changes from older Next.js. Check `node_modules/next/dist/docs/` before using an API you're unsure of (e.g. `middleware` is now `proxy`).
- **Tailwind CSS v4.** There is no `tailwind.config`. Design tokens live in the `@theme` block in `src/app/globals.css`.
- **Supabase** for the database, artist/customer auth, portfolio photo storage, and realtime booking status. Use `src/lib/supabase/server.ts` in Server Components/Actions and `src/lib/supabase/client.ts` in Client Components. Create a new server client per request.
- **WhatsApp** stays the main contact channel. Build all `wa.me` links through `whatsappUrl()` in `src/lib/whatsapp.ts`.
- Hosted on Vercel. Visitors are in India, so prefer static or cached rendering, and run server functions in the Mumbai region (`bom1`).

## Code layout

- **`src/content/site.ts` holds all site copy and data** (categories, services, sample artists, stats, page text), carried over from the old aod.co.in. Pages and components read from it, so copy changes happen there, not in JSX. Ratings, counts and the escrow claim in it are sample data, flagged at the top of the file.
- `src/app/`: routes. The root `layout.tsx` only sets up `<html>`, the font, metadata and `MotionProvider`. The customer site lives in the `(site)` route group (the group doesn't change URLs), whose `layout.tsx` adds `Navbar`, `Footer`, `WhatsAppFab` and `ScrollProgress`. In it, `page.tsx` is the homepage, which only composes sections, and `categories/[slug]` is statically built from `categories` through `generateStaticParams`. There are also `book/`, `business/` and `for-artists/`. `not-found.tsx`, `sitemap.ts` and `robots.ts` stay at the root; `not-found.tsx` renders the navbar and footer itself because only the root layout wraps it. The artist portal is `artists/` (see below).
- `src/components/home/`: one file per homepage section. The order follows the visitor's decision path, modelled on booking marketplaces (Urban Company, Upwork): announcement bar → hero → stats ("Trusted across Gujarat", ending in the scrolling strip of brands AOD has worked with) → category grid → most booked → met-in-person trust section → differentiators (with quick request box) → how it works → features (cancellation, reschedule…) → get-matched quiz → booking options (personal / business) → final call to action. `src/app/(site)/page.tsx` comments the reason for each position.
- Brand strip (`src/components/home/BrandStrip.tsx`): logos of brands AOD has worked with, listed in `clientBrands` in `site.ts`, scroll right to left without end (CSS `animate-marquee` in `globals.css`, never pauses, a still wrapped row under reduced motion). Logo files are in `public/brands/`, cut out of their backgrounds as transparent PNGs, cropped tight and 160–240px tall. The originals the owner sent are in `context/brands/`. Each logo gets the same visual area rather than the same height, so wide and square logos look balanced.
- `src/components/layout/`: navbar (client component, for the mobile menu and the category dropdown), announcement bar, footer and WhatsApp button.
- `src/components/ui/`: shared building blocks. `Container` sets the page width. `Button` provides `buttonClasses()` and `ButtonLink`, which opens external, `tel:` and `mailto:` links as plain anchors. `Icon` maps icon names from `site.ts` to lucide icons and also draws the WhatsApp and Instagram SVGs. `PhotoPlaceholder` stands in for real photos. `Rating` shows star ratings.
- Search: `src/lib/fuzzy.ts` holds the ranking and typo tolerance. It has no imports, so it can be tested on its own. Matching works on whole words, sound-alike spellings (ph→f etc.) and edit distance, and categories outrank single services. Search words for each category live in `keywords` in `site.ts`. `src/lib/search.ts` builds the index from `site.ts`. `src/components/search/SearchBox.tsx` is the navbar input with suggestions, arrow-key navigation and a no-match fallback to `/book`. The navbar shows it inline from 1024px up (the "How it works" link hides between 1024 and 1280px to make room); below 1024px it is an always-visible full-width bar under the logo row. While empty and unfocused, the placeholder types random categories and services (word swaps only under reduced motion).
- Interactive parts are small client components (`Navbar`, `SearchBox`, `CityPicker`, `MatchQuiz`, `MatchPrompt`, `HowItWorks`, `Coverflow` (via `CategoryCoverflow`), `Ring3D` (via `MostBookedRing`), `HeroMotion`, `HeroVideo`, `MetInPersonSection`, and the artist portal's forms and pages). Everything else is a Server Component, and every route is prerendered as static.
- Animation uses **Motion** (`motion/react`, v14). Shared pieces are in `src/components/motion/`: `Reveal` / `StaggerList` (scroll-in), `StatCounters` (odometer, rating fill, split-flap and drama-meter stat animations), `ScrambleText`, `TiltCard`, `ScrollProgress`, and `MotionProvider` (sets `reducedMotion="user"` site-wide). Homepage set pieces: a 3D coverflow carousel for the categories (`src/components/motion/Coverflow.tsx`) and a rotating 3D globe for the most-booked services (`src/components/motion/Ring3D.tsx`, card width follows the screen and the radius follows the card width). Both support mouse / touch drag, unlimited trackpad two-finger swipe, dots, arrow buttons and ← → keys, the hero line reveal, pointer glow and booking walk-through (`HeroMotion`), and the scroll-driven dark section (`MetInPersonSection`). The search placeholder types random categories and services (`useTypedPlaceholder` in `SearchBox`).
- Animated elements render their final content on the server and carry `data-reveal`; a `<noscript>` rule in `layout.tsx` makes them visible when JavaScript is off. Keep both when adding animations.
- Booking flow: every "book" button goes to `/book`, the choosing screen (For personal events / For business). Each choice leads to `/book/personal` or `/book/business`, which run `MatchQuiz` with that audience's occasion list (`occasions` in `site.ts`).
- City: the navbar `CityPicker` (and `CityChips` in the mobile menu) saves the visitor's city through `src/lib/city.ts`, which keeps it in localStorage (`aod-city`) and reads it with `useSyncExternalStore`. `MatchQuiz` reads the same value, shows "City selected: …" with a Change option instead of asking again, and puts it in the WhatsApp message. When Supabase is added, save the city with the booking request.
- Artists join by a pre-filled WhatsApp message (`artistJoinMessage` in `site.ts`), or through the artist portal's application form, which ends with the same WhatsApp hand-off until the backend exists.
- **Artist portal** (`src/app/artists/`, planned for `artists.aod.co.in`): a frontend preview with no backend. `artists/page.tsx` is sign-in (one-time code by WhatsApp or email; any 6 digits work in the preview), `artists/apply` is the five-step application (`ApplyForm`), and the `(portal)` route group holds the signed-in pages: `dashboard`, `profile`, `portfolio`, `bookings`, `availability` and `documents`, with a sidebar (`PortalNav`, tabs on phones) and the account menu. Copy and sample data (sample artist, booking requests, onboarding stages, upload limits) are in `src/content/artist-portal.ts`; components are in `src/components/artists/`. Answers, profile edits, booking actions, blocked dates and the "Preview as live artist / new applicant" switch are kept in this browser through `src/lib/artist-store.ts` (localStorage + `useSyncExternalStore`, like `city.ts`); uploaded files stay in the tab only (object URLs). There is no site-wide preview banner; instead the places where it matters say so (the sign-in code, file uploads, DigiLocker, quotes), and the submit screen says the application was not sent and offers WhatsApp instead. Portfolio links are checked by `src/lib/portfolio-links.ts` (no imports; tested by `check:links`).
- The portal is reached only from the For Artists page ("Apply online" and "Sign in" links); it carries `noindex` and `robots.ts` disallows `/artists`, `/pay` and `/admin`. `src/proxy.ts` serves each separate site at the root of its own domain: hosts starting with `artists.`, `pay.` or `admin.` (so `http://admin.localhost:3000` works locally), plus hosts listed in `ARTISTS_HOSTS`, `PAY_HOSTS` and `ADMIN_HOSTS` (e.g. `*.vercel.app` domains added to the same Vercel project). Links inside the portal use `/artists/...` paths, which work on both hosts. On the artists host `/` is the portal, so links back to the customer site use `mainSiteUrl` (from the `NEXT_PUBLIC_SITE_URL` env var).
- **Payment page** (`src/app/pay/`, planned for `pay.aod.co.in`): takes payment by UPI with no gateway. `PayFlow` runs three steps: details (amount, purpose, name), pay (a QR code drawn in the browser by `UpiQr` from a `upi://` link, app buttons for Google Pay / PhonePe / Paytm with Android and iPhone schemes, the UPI ID to copy, optional bank-transfer details), then the 12-digit UPI transaction ID, sent to AOD on WhatsApp. It ends on "Waiting for AOD to confirm" and never says paid. A link made in the admin (`?amount=&ref=&for=&name=`) fills in and locks the amount. The payee comes from `NEXT_PUBLIC_UPI_ID` / `NEXT_PUBLIC_UPI_NAME` (and optional `NEXT_PUBLIC_BANK_*`); without a UPI ID the page asks the customer to message AOD instead of showing a QR. UPI helpers are in `src/lib/upi.ts` (no imports; tested by `check:pay`); copy in `src/content/payments.ts`. Razorpay (cards, netbanking, automatic confirmation) slots in where the "coming soon" row is.
- **Admin panel** (`src/app/admin/`, planned for `admin.aod.co.in`): a full working preview on sample data. `/admin` is staff sign-in (email, password, 2-step code; any values work in the preview, with a role picker and an "Open as Owner" shortcut). The `(panel)` route group has Overview, Applications (review → meeting → trial → approve, which creates the artist), Artists, Bookings (drag-and-drop board and table; matching with clash and day-off checks, quotes, payment links, recorded payments, delivery link, review, reschedule/cancel, history), Calendar, Payments (verify UTRs, which confirms the booking; payouts; payment-link builder), Leads (convert to booking), Messages (WhatsApp templates filled from a record), Reports & exports (stats and a master Excel workbook with one sheet per list), Team & roles (owner / ops / finance / viewer; every role sees every page, roles gate the actions), Activity log and Settings. Data lives in the browser through `src/lib/admin-store.ts` (one localStorage object, seeded from `src/content/admin-sample.ts`, where phones start with 55 and emails use example.com so nothing reaches a real person); every change goes through `update()`, which writes the activity log. Pipelines, roles, permissions and templates are in `src/content/admin.ts`; components in `src/components/admin/` (`AdminShell`, `DataTable`, `ui.tsx`, `pages/`). Records open in a drawer through `?open=<id>` (`useOpen`). Excel files are written by `src/lib/xlsx.ts` (a small dependency-free .xlsx/CSV writer). When Supabase is added, the store's actions become database calls and sign-in becomes real staff accounts with 2FA.
- Identity checks in the portal go through DigiLocker via a KYC provider (`DigiLockerCard`); there is no Aadhaar number field or Aadhaar card upload, and payout details (bank/UPI, PAN) are only asked for after the trial booking.
- Every booking or application flow currently ends by opening a pre-filled WhatsApp message through `whatsappUrl()`. When Supabase is added, save the request first, then open WhatsApp.

## Design system

Orange / white / black, with the layout modelled on Upwork. Use the token classes (`text-ink`, `bg-brand`, `hover:bg-brand-hover`, `bg-peach`, `text-apricot`, `text-tangerine`, `bg-wash`, `border-line`, `text-muted` …), never raw hex values. The font is Inter, loaded with `next/font`, as a free stand-in for Upwork's paid Neue Montreal. Real artist photos are the main trust signal, so design cards and pages around photos, not icons.

## Planned build order

1. Frontend redesign of all pages, with sample data and the WhatsApp hand-off.
2. Supabase: artist registration and profiles, bookings with live status (waiting / confirmed), cancellation and rescheduling, filtering by location.
3. AI assistant on the website that asks what the customer needs and suggests artists.
4. WhatsApp AI assistant (needs the Meta WhatsApp Business API and business verification).

## Rules carried over from the old-site audit

- Never show "received" or "confirmed" for a booking or artist application unless it has actually been saved (to Supabase). Opening WhatsApp is not saving.
- No hardcoded ratings, review counts, artist counts or "bookings" numbers. Show only real data, or leave the element out.
- Don't claim escrow, payments or verification that aren't built yet.
- Don't collect Aadhaar numbers. Identity checks must go through a proper KYC provider such as DigiLocker.
- The site needs privacy, terms and cancellation/refund pages before it collects personal data or payments.
- Every page needs a title, a description, Open Graph tags and a share image, because links are mostly shared on WhatsApp. Also provide `sitemap.ts` and `robots.ts`.
- Render key numbers and content on the server so they show up without JavaScript (the old site showed "0 verified artists" to crawlers).
