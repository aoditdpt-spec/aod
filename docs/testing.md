# Testing AOD

Three layers: automated checks (run any time), the preview (no keys, nothing is saved), and the
live backend (real database, real emails, live updates). Work through them in that order.

## 1. Automated checks

Run these from the project folder before every commit:

| Command | What it proves |
| --- | --- |
| `npm run lint` | No code mistakes the linter can spot. |
| `npm run build` | Every page compiles, type-checks and prerenders. |
| `npm run check:db` | The database rules: runs both SQL files on a throwaway Postgres and checks who can read and change what (owner, ops, finance, viewer, deactivated staff, customers, artists, signed-out visitors), and who hears about which change on the live channels. |
| `npm run check:search` | Search finds the right category for common queries and misspellings. |
| `npm run check:links` | The portfolio-link rules (real public links only). |
| `npm run check:pay` | UPI amounts, transaction IDs and `upi://` links. |

All six should end with "passed" (or no errors for lint and build).

## 2. The preview (no keys)

Without the Supabase keys the site runs as the preview: forms hand over to WhatsApp, and the
admin and artist portal use sample data kept in your browser. This is what aod.co.in shows until
the keys are added on Vercel. Check each area on a laptop, a phone (or the browser at 390px
wide) and at 33% zoom:

- **Homepage**: hero video plays (laptop and phone cuts), search suggestions, category carousel,
  the "Everything in one place" section and each of its links.
- **Booking** (`/book` → personal or business): the three questions; Send stays disabled until
  every field is filled; start and end times show the duration; WhatsApp opens with the details.
- **My bookings**: any email, any 6-digit code; sample bookings are labelled "Sample".
- **Pay** (`/pay`): amount, QR or UPI app buttons, 12-digit ID, ends on "Waiting for AOD to confirm".
- **Resolution Centre** (`/resolve`): the form says it wasn't saved and offers WhatsApp; Track
  shows a sample case.
- **Artist portal** (`/artists`): any 6 digits sign in; switch "Preview as" between live artist
  and new applicant; quote or decline a request; mark days off; edit the profile.
- **Admin** (`/admin`): "Open the admin as Owner"; try each page; switch roles on Team & roles
  to see buttons disable for viewer and finance; "Reset sample data" starts over.

## 3. Live: getting ready

1. Do steps 1–4 of `docs/backend-setup.md` (both SQL files, your owner row, sign-in code emails,
   the keys). Email (step 5) and the sheet (step 6) can wait; anything they'd send queues up.
2. Test on your computer first: put the keys in `.env.local` and restart `npm run dev`. The
   admin header should show a green **Live** dot after you sign in.
3. You need three email addresses: you (staff), a customer and an artist. With Gmail you can use
   one inbox: `you+customer@gmail.com` and `you+artist@gmail.com` arrive in `you@gmail.com`, but
   AOD treats them as different people.
4. Use three browser windows that don't share sign-in: a normal window (staff), an incognito
   window (customer) and another browser such as Edge or Firefox (artist). Keep them side by side:
   every step below should update the other windows **without refreshing**.

Supabase's built-in email sends only a few codes an hour. If codes stop arriving, wait, or set up
Resend SMTP (setup step 2.4).

## 4. Live: the full journey

Each step lists what to do, then what should happen elsewhere.

**Customer asks for an artist** (customer window)
1. Homepage → Get yours now → personal → fill every field with the customer email → Send.
   - Customer sees "Request received · Ref AOD-…" and WhatsApp opens.
   - Staff window: the request appears in **Bookings** (and the nav count goes up) by itself.
   - With email set up: a team email and a confirmation to the customer; with the sheet set up:
     rows on "All orders" and the category's tab.
2. `/my-bookings` → sign in with the customer email → the request is listed with its reference.

**Artist joins** (artist window)
3. `/artists/apply` → apply with the artist email and a portfolio link → "Application received".
   - Staff window: it appears in **Applications**.
4. `/artists` → sign in with the artist email → the overview shows "Your application is in the
   queue". Add two photos under **Portfolio**.
   - An email AOD doesn't know is refused a code ("AOD has no artist or application with this email").
5. Staff: open the application → the uploaded photos show under Portfolio → move it to Review.
   - Artist window: the overview changes to "Our team is reviewing your portfolio".
6. Staff: schedule a meeting, then trial, then **Approve**.
   - Artist window: switches to the live-artist overview with Requests, Upcoming and Past.

**Matching and quoting**
7. Artist: **Availability** → mark a day off. Staff: open the artist in **Artists** → Days off
   shows it; a booking on that day marks the artist "Day off" when matching.
8. Staff: open the customer's booking → **Shortlist** the artist.
   - Artist window: a "New request" appears (and the Bookings badge counts it).
9. Artist: **Send a quote** (e.g. ₹25,000).
   - Staff window: under the artist in the booking drawer, "Quoted ₹25,000 in the portal".
10. Staff: **Assign** the artist, enter the quote and advance, move to Payment pending.
    - Artist window: the booking moves to Upcoming as "You're chosen · waiting for the advance".
    - Customer window (My bookings): the status, quote and a "Pay advance" button appear.

**Payment and the event**
11. Customer: Pay advance → `/pay` opens with the amount locked → enter any 12-digit ID → Send.
    - Staff window: **Payments** shows it as pending.
12. Staff (owner or finance): **Verify** the payment → the booking becomes Confirmed.
    - Customer and artist windows both show Confirmed.
13. Staff: move to Event done, add a delivery link → customer sees the download link → customer
    leaves a review → staff sees Reviewed.

**Something goes wrong**
14. Customer: in My bookings, "Something went wrong? Raise a case" → submit → note the RC number.
    - Staff window: **Resolution cases** shows it (nav count, Needs attention, 48-hour countdown).
15. Customer: `/resolve/track` with the number and email. Staff: Acknowledge, then write a
    decision and mark Resolved. The tracking page catches up within a minute (or when the tab is
    focused again). Customer: Escalate → staff sees Escalated.

**Roles and access**
16. Staff (owner): **Team & roles** → add a viewer with another email alias → sign in as them in
    a fresh window: they see everything and every action button is disabled. (The database
    refuses their changes too; `npm run check:db` tests that.)
17. Sign in to My bookings with a different customer email: none of the first customer's
    bookings show. Track a case with the wrong email: "No case matches".

## 5. When something doesn't work

- **The Live dot stays amber**: check you ran the second SQL file, and that you're signed in. The
  pages still update when you switch back to the tab, so nothing is lost.
- **A form says it couldn't save**: Vercel → the project → Logs (errors start with
  `[booking request]`, `[application]`, `[resolution case]` …), and Supabase → Logs.
- **No emails or sheet rows**: look at the `outbox` table in Supabase (Table Editor). Failed jobs
  wait there with their error; once the keys are fixed, call `/api/jobs/retry` with the
  `CRON_SECRET` (setup step 7).
- **Uploads fail**: Supabase → Storage should list a `portfolio` bucket (created by the second
  SQL file). Videos over 50 MB are refused on the free plan; artists can add a YouTube link instead.
