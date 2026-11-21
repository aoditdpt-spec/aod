# aod.co.in

The website of **AOD (Artists on Demand)**, Ahmedabad: book verified photographers, cinematographers, drone operators, anchors, musicians, DJs, singers, stand-up comedians, models, reel creators and makeup artists for events across Gujarat.

One Next.js app serves four sites:

| Address | What |
|---|---|
| www.aod.co.in | The customer site: categories, booking, My Bookings, AOD For Business, For Artists, blog, policies |
| artists.aod.co.in | The artist portal: sign up, Complete Your Details, booking requests, availability, portfolio, messages |
| admin.aod.co.in | The team's admin: bookings, applications, artists, payments, Dispute Desk, chat, blog, team, settings |
| resolve.aod.co.in | The Dispute Desk |

Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4 and Motion, on Supabase (database, emailed sign-in codes, storage, live updates), Resend (email), a Google service account (orders sheet, artists' photos) and Vercel.

## Run it

```bash
npm install
cp .env.example .env.local   # fill it in; without the Supabase keys the site runs as a preview on sample data
npm run dev                  # http://localhost:3000 (admin: /admin, artist portal: /artists, Dispute Desk: /resolve)
```

```bash
npm run build      # production build (type-checks too)
npm run lint
npm run check:search | check:orders | check:links | check:db | check:markdown | check:xlsx
```

## Read next

- `CLAUDE.md`: how the code is organised and the rules to keep (for people and for Claude Code).
- `supabase/migrations/`: the database, one dated file per change.
- The developer, deploy and Claude Code guides are kept outside the repo (they hold the project's keys), in the private `guides` folder next to this one.
