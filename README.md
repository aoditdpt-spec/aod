# aod.co.in

The website of **AOD (Artists on Demand)**, Ahmedabad: book verified photographers, cinematographers, drone operators, anchors, musicians, live bands, singers, stand-up comedians, models, reel creators and makeup artists for events across Gujarat.

One Next.js app serves four sites:

| Address | What |
|---|---|
| www.aod.co.in | The customer site: six categories, booking (one question per screen, several kinds of artist in one order, email code), My Bookings, AOD For Business (calendar, booking, orders, company), For Artists, About, blog, policies |
| artists.aod.co.in | The artist portal: two-step sign-up, Complete Your Details, Submit For Review, booking requests (Accept / Decline), availability, portfolio, messages, documents |
| admin.aod.co.in | The team's admin: overview, bookings (shortlist and assign artists, quotes, payments, delivery), applications, artists, calendar, payments and payouts, Dispute Desk, chat with artists, message templates, blog, password-protected Excel exports, team and roles, activity log, settings |
| resolve.aod.co.in | The Dispute Desk: raise a dispute (booked through AOD or not), track it, escalate |

Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4 and Motion, on Supabase (Postgres with row-level security, emailed sign-in codes, storage, live updates), Resend (email), a Google service account (the orders Sheet, artists' photos on Drive), web-push (chat notifications) and Vercel (Mumbai). Without the Supabase keys the whole site runs as a preview on sample data kept in the browser.

## Run it

```bash
npm install
cp .env.example .env.local   # fill it in (every key is described there)
npm run dev                  # http://localhost:3000 (admin: /admin, artist portal: /artists, Dispute Desk: /resolve)
```

```bash
npm run build      # production build (type-checks too)
npm run lint
npm run check:search | check:orders | check:links | check:db | check:fresh | check:markdown | check:xlsx
```

## Put a change live

Push to `main`: Vercel builds it and puts it on www.aod.co.in (and the three subdomains) in about two minutes. A change to the database is a new dated file in `supabase/migrations/`, run once in the Supabase SQL Editor **before** pushing the code that needs it. `supabase/reset-everything.sql` (not a migration) clears the whole database for a fresh start.

## Read next

- `CLAUDE.md`: how the code is organised, how every flow works, the rules to keep, the project's history and open items (for people and for Claude Code).
- `supabase/migrations/`: the database, one dated file per change.
- The private **guides** folder, kept outside the repo because it holds the project's keys: the developer guide, the deploy guide (SQL, environment variables, test walk-through, clearing the Sheet), the Claude Code guide (Mac setup and pushing), the list of services AOD uses, the database rebuild SQL, and the older setup and testing documents.

Related folders: `aod-redesign` (the frozen mock-only design workspace this design came from) and `aod-old` (the design before 21 Nov 2026, with no backend).
