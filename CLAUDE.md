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
```

There is no test runner yet. `scripts/search-check.mts` is a plain Node script (run through Node's built-in TypeScript support). Add a case there when you change search keywords or tuning.

Copy `.env.example` to `.env.local` and fill in the Supabase URL and publishable key before running anything that touches the database.

## Stack

- **Next.js 16 (App Router, `src/` dir) + React 19 + TypeScript.** This version has breaking changes from older Next.js. Check `node_modules/next/dist/docs/` before using an API you're unsure of (e.g. `middleware` is now `proxy`).
- **Tailwind CSS v4.** There is no `tailwind.config`. Design tokens live in the `@theme` block in `src/app/globals.css`.
- **Supabase** for the database, artist/customer auth, portfolio photo storage, and realtime booking status. Use `src/lib/supabase/server.ts` in Server Components/Actions and `src/lib/supabase/client.ts` in Client Components. Create a new server client per request.
- **WhatsApp** stays the main contact channel. Build all `wa.me` links through `whatsappUrl()` in `src/lib/whatsapp.ts`.
- Hosted on Vercel. Visitors are in India, so prefer static or cached rendering, and run server functions in the Mumbai region (`bom1`).

## Code layout

- **`src/content/site.ts` holds all site copy and data** (categories, services, sample artists, stats, page text), carried over from the old aod.co.in. Pages and components read from it, so copy changes happen there, not in JSX. Ratings, counts and the escrow claim in it are sample data, flagged at the top of the file.
- `src/app/`: routes. `page.tsx` is the homepage, which only composes sections. `categories/[slug]` is statically built from `categories` through `generateStaticParams`. There are also `business/`, `for-artists/`, `sitemap.ts`, `robots.ts` and `not-found.tsx`. `layout.tsx` wraps every page with `Navbar`, `Footer` and `WhatsAppFab`.
- `src/components/home/`: one file per homepage section. The section order mirrors the Upwork reference page: announcement bar → dark hero card → features → category grid → get-matched quiz → how it works → dark differentiators card → booking options → most booked → stats → orange final call to action.
- `src/components/layout/`: navbar (client component, for the mobile menu and the category dropdown), announcement bar, footer and WhatsApp button.
- `src/components/ui/`: shared building blocks. `Container` sets the page width. `Button` provides `buttonClasses()` and `ButtonLink`, which opens external, `tel:` and `mailto:` links as plain anchors. `Icon` maps icon names from `site.ts` to lucide icons and also draws the WhatsApp and Instagram SVGs. `PhotoPlaceholder` stands in for real photos. `Rating` shows star ratings.
- Search: `src/lib/fuzzy.ts` holds the ranking and typo tolerance. It has no imports, so it can be tested on its own. Matching works on whole words, sound-alike spellings (ph→f etc.) and edit distance, and categories outrank single services. Search words for each category live in `keywords` in `site.ts`. `src/lib/search.ts` builds the index from `site.ts`. `src/components/search/SearchBox.tsx` is the navbar input with suggestions, arrow-key navigation and a no-match fallback to `/book`. The navbar shows it inline from 1280px up; below that it is a search icon that opens a full-width row.
- Interactive parts are small client components (`HeroSearch`, `MatchQuiz`, `MatchPrompt`, `HowItWorks`, `Navbar`). Everything else is a Server Component, and every route is prerendered as static.
- Booking flow: every "book" button goes to `/book`, the choosing screen (For personal events / For business). Each choice leads to `/book/personal` or `/book/business`, which run `MatchQuiz` with that audience's occasion list (`occasions` in `site.ts`).
- Artists join by a pre-filled WhatsApp message (`artistJoinMessage` in `site.ts`) until the online registration system is built.
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
