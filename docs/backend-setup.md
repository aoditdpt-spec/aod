# Switching on the backend

The website works without a backend (the "preview"): forms open WhatsApp, My bookings shows
samples, and the admin uses sample data in each browser. Follow these steps once and every
form saves to the database first, sign-in uses real emailed codes, and the admin is shared by
the whole team. You can do steps 1–4 alone to start; email and the sheet can follow later
(anything they would have sent waits in a queue and goes out once they're set up).

## 1. Supabase project

1. Sign up at supabase.com and create a project. Region: **Mumbai (ap-south-1)**. Save the
   database password somewhere safe.
2. **SQL Editor → New query**: paste all of `supabase/migrations/20261009000000_init.sql`, then
   **Run**. It creates the tables, the role rules and the default settings.
3. **New query** again: paste all of `supabase/migrations/20261010000000_live_and_artists.sql`,
   then **Run**. It adds live updates, artists' replies and profiles, and the `portfolio` storage
   bucket for artists' photos and videos. (Always run the files in `supabase/migrations/` in
   date order, each once.)
4. Still in the SQL Editor, add yourself as the first owner (use your real email):

   ```sql
   insert into public.staff (id, name, email, role)
   values ('U-1', 'Your Name', 'you@example.com', 'owner');
   ```

   After that, add the rest of the team from the admin's **Team & roles** page.

## 2. Sign-in codes

1. **Authentication → Sign In / Providers → Email**: on. (Customers, artists and staff all sign
   in with a 6-digit code sent to their email.)
2. **Authentication → Emails → Templates**: in both **Confirm signup** and **Magic Link**,
   replace the link with the code, for example:

   ```html
   <h2>Your AOD sign-in code</h2>
   <p>Enter this code to sign in: <strong>{{ .Token }}</strong></p>
   <p>It expires in an hour. If you didn't ask for it, ignore this email.</p>
   ```

3. **Authentication → URL Configuration → Site URL**: `https://www.aod.co.in`.
4. Supabase's own email server only sends a few emails an hour. Before launch, set
   **Authentication → Emails → SMTP Settings** to Resend (step 5): host `smtp.resend.com`,
   port `465`, user `resend`, password = your Resend API key, sender `noreply@aod.co.in`.

## 3. Keys

From **Project Settings → API Keys** copy the project URL, the publishable key and a secret key.
Put them in `.env.local` (for your computer) and in **Vercel → Project → Settings →
Environment Variables** (for the live site), then redeploy:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
NEXT_PUBLIC_SITE_URL=https://www.aod.co.in
```

The secret key bypasses the database rules, so it must only ever be a server setting (no
`NEXT_PUBLIC_` in front). Never paste it into chat or commit it.

In **Vercel → Settings → Functions**, set the region to **Mumbai (bom1)**, close to the database.

## 4. Try it

1. Open `/admin`, enter your email, and sign in with the code from your inbox.
2. On the homepage, send a booking request through "Get yours now". It shows
   "Request received · Ref AOD-…" and appears in the admin under **Bookings**.
3. Sign in to `/my-bookings` with the email you used in the request: it's listed there.
4. Send a test payment reference on `/pay` and an application on `/artists/apply`; they appear
   under **Payments** and **Applications**.
5. The admin header shows a green **Live** dot: changes made anywhere (another browser, a form,
   an artist) appear without refreshing.

`docs/testing.md` walks through testing everything, including live updates across two browsers.

## 5. Emails (Resend)

1. Sign up at resend.com, **Domains → Add domain** `aod.co.in`, and add the DNS records it shows
   wherever aod.co.in's DNS is managed. Wait until it says Verified.
2. Create an API key, then set:

   ```
   RESEND_API_KEY=...
   EMAIL_FROM=AOD <noreply@aod.co.in>
   TEAM_EMAIL=communication.aod@gmail.com
   ```

   The team gets an email for each booking request, artist application, payment reported and
   Resolution Centre case (each can be switched off in admin **Settings**). Customers and artists
   get a confirmation by email, and people who raise a case get its number and tracking link.

## 6. Orders spreadsheet (Google Sheets)

1. Make a Google Sheet called **AOD Orders** with these tabs, spelled exactly like this:
   `All orders`, `Photographers`, `Cinematographers`, `Drone Pilots`, `Anchors & Hosts`,
   `Editors`, `Musicians & DJs`, `Stand-up Comedians`, `Singers & Vocalists`, `Makeup Artists`,
   `Models`. Leave them empty; the heading row is added with the first order.
2. In Google Cloud Console: create a project, enable the **Google Sheets API**, create a
   **service account**, and add a **JSON key** to it (it downloads a file).
3. Share the sheet with the service account's email (from the JSON file) as **Editor**.
4. Set (from the JSON file and the sheet's address):

   ```
   ORDERS_SHEET_ID=...            # from docs.google.com/spreadsheets/d/<this part>/edit
   GOOGLE_SERVICE_ACCOUNT_EMAIL=... # "client_email"
   GOOGLE_PRIVATE_KEY="..."         # "private_key", kept on one line with \n
   ```

Every website request adds one row to **All orders** and one row to the tab of each category it
needs.

## 7. Retrying anything that failed

If an email or sheet row fails (or its keys weren't set yet), it waits in the `outbox` table.
Set `CRON_SECRET` to a long random string, then call this every 15 minutes:

```
GET https://www.aod.co.in/api/jobs/retry
Authorization: Bearer <CRON_SECRET>
```

On Vercel Pro, add a cron job for `/api/jobs/retry` (Vercel sends the secret itself). On the
free plan, use a free scheduler such as cron-job.org with that header.

## 8. Separate addresses (subdomains)

The artist portal, payment page, admin panel and Resolution Centre each work at a path on the
main site straight away (`aod.co.in/artists`, `/pay`, `/admin`, `/resolve`). To give one its own
address, e.g. **resolve.aod.co.in**:

1. Vercel → the project → **Settings → Domains → Add**: `resolve.aod.co.in`.
2. At your domain provider (where aod.co.in's DNS is), add the record Vercel shows, usually a
   **CNAME** named `resolve` pointing to `cname.vercel-dns.com`.
3. Wait for Vercel to show it as valid (minutes, sometimes an hour). Nothing else to change: any
   address starting with `resolve.` opens the Resolution Centre (`src/proxy.ts`). The same goes
   for `artists.`, `pay.` and `admin.`.

A `*.vercel.app` address can do the same through `RESOLVE_HOSTS` (and `ARTISTS_HOSTS`,
`PAY_HOSTS`, `ADMIN_HOSTS`) in the Vercel environment variables, e.g.
`RESOLVE_HOSTS=aod-resolve.vercel.app`. Set `NEXT_PUBLIC_SITE_URL=https://www.aod.co.in` so links
from those addresses back to the main site work.

## What's live, and what isn't yet

Live with these steps: booking requests, artist applications, payment references, My bookings
(with reviews), Resolution Centre cases (raise, track, escalate), the whole admin panel on
shared data (each role's limits enforced by the database), the artist portal (sign-in, profile,
portfolio uploads, availability, quoting or declining shortlisted requests, onboarding status),
and live updates on every signed-in page.

Not yet: artists sign in by email code only (WhatsApp codes need the WhatsApp Business API);
the application form doesn't upload files (applicants add photos from the portal after
signing in); staff sign in with an emailed code rather than an authenticator app; identity
checks (DigiLocker) and card payments (Razorpay) come later.

Free-plan limits to keep in mind: Supabase Storage holds 1 GB in total and takes files up to
50 MB (photos are shrunk in the browser before upload, so most are under 1 MB); the database
holds 500 MB; Realtime allows 200 open connections at once (each open signed-in page is one).
