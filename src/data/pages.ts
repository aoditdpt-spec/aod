// Copy for the pages other than the homepage, from the main aod.co.in, cut down to the essentials:
// a big heading, one line, a few short points and one action. Headings and buttons in Title Case.

export const categoriesPage = {
  title: "All Categories.",
  meta: "Photo & video, models & creators, anchors, live music & DJs, comedians and makeup in Ahmedabad and across Gujarat.",
};

export const bookPage = {
  title: "Get Your Artist.",
  meta: "Tell AOD who you need, when and where, and get a verified artist for your event.",
  // The questions, one at a time; each pick moves on by itself (no Next button).
  // Which kind and how many share question 02 (on request, 2026-11-20).
  steps: ["Who Are You Looking For?", "Which Kind Of Artist?", "When, Where And Your Details"],
  howMany: (name: string) => `How Many ${name}?`,
  question: (n: number, of: number) => `Question ${n} of ${of}`,
  pickFirst: "Pick who you're looking for first.",
  more: "More",
  continue: "Continue",
  detailsTitle: "Your Details",
  // The last question's parts and quick picks (BookForm.tsx).
  sections: { when: "When Is The Event?" },
  otherDate: ["Other", "Date"],
  other: "Other",
  pickTime: "Pick A Time",
  pickHours: "Pick A Length",
  hoursShort: (h: number) => `${h} Hrs`,
  back: "Back",
  next: "Next",
  clear: "Clear All",
  fields: {
    date: "Date",
    time: "Start Time",
    hours: "How Many Hours?",
    venue: "Where Is The Event?",
    details: "Brief For An Artist (Optional)",
    name: "Your Name",
    phone: "Phone Number",
    email: "Email",
  },
  // The exact venue (Google Maps suggestions under the box, VenueField.tsx).
  venuePlaceholder: "Search A Hotel, Hall Or Home Address",
  // The "Brief For An Artist" box's placeholder: what the team usually asks next.
  detailsPlaceholder: "Guest Count, Budget, Special Requirements Etc.",
  sendCode: "Send OTP",
  sending: "Sending…",
  codeTitle: "Enter The OTP",
  codeSent: "We've sent a 6-digit code to",
  codeLabel: "6-digit code",
  // Without the backend keys (.env.local) nothing is emailed or saved, and the page says so.
  codePreview: "Test mode: no email is sent. Any code works, or none.",
  newCode: "Send A New Code",
  confirm: "Confirm Request",
  saving: "Saving…",
  checking: "Checking…",
  // Shown only once the request is saved in the database.
  confirmedTitle: "Request Received.",
  orderLabel: "Ref",
  // After Confirm, only the title, the reference and these lines (as on aod.co.in).
  confirmedNote: "We're finding the right artist for you and will be in touch soon.",
  copySent: "A copy is on its way to",
  another: "Book Another Event",
  myBookings: "Go To My Bookings",
  previewNote: "Test mode: mock data, kept in this browser only.",
  rows: { who: "Who" },
};

export const businessPage = {
  label: "AOD For Business",
  title: "One Partner For Every Shoot.",
  meta: "Corporate events, brand shoots and expos in Ahmedabad and across Gujarat, with one point of contact.",
  points: [
    { title: "Hotels, Cafés & Agencies", text: "Monthly content shoots on a fixed calendar." },
    { title: "Corporates", text: "Conferences, town halls and product launches." },
    { title: "Expos", text: "Official coverage, from the stall to the stage." },
  ],
  // From aod.co.in/business (2026-11-21).
  whyTitle: "Why Procurement Teams Like Us",
  why: [
    "Digital contracts on every engagement",
    "Transparent quotes upfront: budget approvals without surprises",
    "Dedicated account manager and single point of contact",
    "Priority replacement guarantee: coverage never falls through",
    "One company account: a calendar of every booking, and each order tracked from inquiry to payment received",
  ],
  caseStudy: { title: "GATE Expo: Official Visual Partner", text: "AOD delivered end-to-end visual coverage as official partner." },
};

export const artistsPage = {
  label: "For Artists",
  title: "Get Booked For What You Do Best.",
  meta: "Photographers, filmmakers, anchors, singers, DJs, comedians, models and makeup artists: join AOD and get booked.",
  // The rest of aod.co.in/for-artists (2026-11-21), headings in Title Case.
  whyTitle: "Your Talent Deserves The Right Stage",
  why: [
    { title: "Your Talent, In The Right Place", text: "We match you to events that fit your style, so your skills are used where they count." },
    { title: "A Fair Rate For Your Work", text: "Clear quotes agreed upfront. No undercutting, no haggling: you're paid what your work is worth." },
    { title: "Steady Work", text: "Weddings, corporate contracts and expo coverage: regular bookings across Gujarat." },
    { title: "Grow Your Potential", text: "A verified badge, reviews and a portfolio that grows with every booking you deliver." },
  ],
  verifyTitle: "We Verify Every Artist Thoroughly",
  verifyText:
    "No one joins AOD from a form alone. Our team reviews your work, checks your background and references, and runs a trial booking, so clients know exactly who is walking into their event. Zero joining fees: we only earn when you do.",
  joinTitle: "How Joining Works",
  steps: [
    { title: "Apply With Your Work", text: "Share your portfolio, links and experience online. Our team reviews every application." },
    { title: "Portfolio & Background Check", text: "Our creative team reviews your style and quality, and verifies your identity and references." },
    { title: "Trial Booking & Go Live", text: "One supervised booking to confirm professionalism and punctuality, then the bookings start coming." },
  ],
  // Joining is through the artist portal only (no WhatsApp).
  apply: "Apply To Join",
  signIn: "Sign In",
};

// The Dispute Desk and About Us, copied from aod.co.in (src/content/resolution.ts and `about` in
// src/content/site.ts there), 2026-11-19, with headings and labels in Title Case. Left out on
// purpose: the WhatsApp and contact buttons (the navbar, bottom bar and footer carry them), and the
// grievance officer's name, still "[name to add]" on the main site.
export const disputePage = {
  label: "AOD Dispute Desk",
  title: "We Solve Disputes For Everyone.",
  meta: "Raise a dispute with a client or an artist, booked through AOD or not. AOD hears both sides and works towards a fair settlement, free.",
  lead: "Whether you're associated with AOD or not. A dispute with a client or an artist? We'll help you settle it.",
  intro:
    "Client ghosted your invoice, cancelled at the last minute, or an artist didn't deliver what was agreed? Raise it here, whether or not the booking was made through AOD. You get a case number, AOD hears both sides, and works towards a fair settlement. Free.",
  notSupport:
    "Questions, quotes or changes to an AOD booking? Message AOD instead. The Dispute Desk is for disagreements between a client and an artist that need settling.",
  promises: [
    { title: "A Reply Within 48 Hours", text: "Someone at the Dispute Desk reads your case and gets in touch by email within two days." },
    { title: "An Outcome Within 30 Days", text: "Most disputes settle in a few days. Every case gets an outcome within a month." },
    { title: "Escalate Any Time", text: "Not happy with the outcome? AOD's grievance officer reviews the case afresh." },
  ],
  stepsTitle: "How A Dispute Is Settled",
  steps: [
    { title: "Tell Us What Happened", text: "Who it's with, what was agreed, what the other side did or didn't do, and what would settle it for you." },
    { title: "We Hear Both Sides", text: "AOD contacts the client or the artist, and looks at the chats, invoices and booking records." },
    { title: "A Fair Settlement", text: "Payment of what's owed, a refund of the advance, a re-shoot, credit given, or a written agreement both sides sign." },
    { title: "Escalation If Needed", text: "Still not settled? AOD's grievance officer reviews it, and you can take it further." },
  ],
  pathsTitle: "Booked Through AOD, Or Not?",
  pathsText: "The Dispute Desk takes both. How a case runs depends on where the booking was made.",
  // Over the picture of a case being tracked, beside the intro.
  previewLabel: "What You'll See",
  paths: {
    aod: {
      title: "Booked Through AOD",
      text: "AOD arranged the booking and took the payment, so a settlement can include a refund or payout under AOD's refund policy, or a replacement artist.",
      cta: "Raise An AOD Dispute",
    },
    outside: {
      title: "Booked Outside AOD",
      text: "Booked directly, through another platform or by word of mouth? The Dispute Desk mediates those too, free. You don't need an AOD account or booking number.",
      cta: "Raise A Non-AOD Dispute",
      steps: [
        { title: "Tell Us What Happened", text: "Who it's with and how to reach them, what was agreed, and what would settle it for you." },
        { title: "We Contact The Other Side", text: "AOD reaches out by phone, WhatsApp or email to hear their side. Taking part is up to them." },
        { title: "A Written Settlement", text: "If both sides agree, AOD writes the settlement down and both of you confirm it." },
        { title: "If It Doesn't Settle", text: "AOD sends you a written summary of the case and the next step: the consumer helpline, free legal aid or MSME Samadhaan." },
      ],
      canTitle: "What AOD Can Do",
      can: [
        "Hear both sides and suggest a fair settlement",
        "Write the agreement down for both sides to confirm",
        "Give you a written summary to take further",
        "Find you a replacement artist through AOD, if you want one",
      ],
      cantTitle: "What AOD Can't Do",
      cant: ["Refund or pay out money: AOD never held it", "Make the other side take part", "Act as a court or give legal advice"],
    },
  },
  whoTitle: "Who Can Use The Dispute Desk",
  whoText:
    "Both sides of a booking: artists, and the people and businesses who book them. It doesn't have to be an AOD booking: we also help with work booked directly, through another platform or by word of mouth.",
  // Artists first: most disputes are an artist chasing a client. Each side's issues are about the other side.
  roles: [
    {
      id: "artist",
      title: "I'm An Artist",
      text: "A problem with a client: unpaid, ghosted or cancelled.",
      issues: [
        "Unpaid Or Delayed Payment",
        "Client Stopped Replying (Ghosted)",
        "Last-Minute Cancellation",
        "Extra Work Not Agreed Or Paid (Scope Creep)",
        "My Work Used Without Permission",
        "Missing Credit For My Work",
        "Advance Or Refund Dispute",
        "Client's Behaviour Or Safety",
      ],
    },
    {
      id: "customer",
      title: "I Booked An Artist",
      text: "A problem with the artist you booked.",
      issues: [
        "Artist Didn't Turn Up",
        "Artist Arrived Late Or Left Early",
        "Artist Cancelled At The Last Minute",
        "Work Not What Was Agreed",
        "Photos Or Videos Not Delivered",
        "Artist Asking For More Money",
        "Advance Or Refund Dispute",
        "Artist's Behaviour Or Safety",
      ],
    },
    {
      id: "business",
      title: "I Booked For A Business",
      text: "A problem with an artist on a business booking.",
      issues: [
        "Artist Didn't Turn Up",
        "Artist Cancelled At The Last Minute",
        "Work Not What Was Agreed",
        "Files Not Delivered Or Incomplete",
        "Usage Rights Or Credit",
        "Advance Or Refund Dispute",
        "Artist's Behaviour Or Safety",
      ],
    },
  ],
  escalateTitle: "Not Happy With The Outcome?",
  escalateText: "Escalate the case and AOD's grievance officer reviews it afresh. You can also contact them directly:",
  officerLabel: "Grievance Officer",
  furtherHelp:
    "Still not settled? Customers can go to the National Consumer Helpline (call 1915, or consumerhelpline.gov.in) or their district consumer commission. Artists can ask their District Legal Services Authority for free legal aid, and an artist registered on Udyam as a micro or small enterprise can also take a late payment to the government's MSME Samadhaan portal.",
};

export const aboutPage = {
  label: "Artists On Demand",
  title: "About Us.",
  meta: "Artists on Demand is a premier artist booking platform: book verified, professional photographers, videographers, hosts, models, musicians and more, just as you book a cab.",
  intro:
    "Artists on Demand is a premier artist booking platform where you can book verified, professional artists with ease, just as you book a cab. AOD provides artists across a wide range of categories, including Photographers, Videographers & Cinematographers, Hosts & Anchors, Models, Musicians, and more. You can book the artists at your convenience.",
  storyTitle: "Vision Of AOD",
  story: [
    "AOD's vision is simple: booking talent for any event in Gujarat should be as easy and as trustworthy as booking a cab. Every artist verified, every price clear.",
    "Finding the right artist for a wedding, a launch or a shoot usually means scrolling through hundreds of profiles, chasing replies, haggling over prices and hoping they turn up on the day.",
    "You tell AOD what you need, and AOD sends curated matches: artists AOD has verified, with clear quotes and a digital contract on every booking.",
    "For artists, AOD means the right bookings at the right rate, with zero joining fees and a team that handles the back-and-forth.",
  ],
  valuesTitle: "What AOD Stands For",
  values: [
    { title: "Verified, Not Just Listed", text: "Portfolio review, background checks and a trial booking before any artist goes live." },
    { title: "One Clear Price", text: "One clear quote per curated match. The price you agree is the price you pay." },
    { title: "Never Stranded", text: "If an artist cancels, AOD sends a verified substitute." },
    { title: "Fair To Artists", text: "Zero joining fees, and bookings that suit each artist's craft and rate." },
  ],
};

export const myBookingsPage = {
  title: "My Bookings.",
  meta: "See and follow your AOD bookings.",
};

// The first-visit popup (AudiencePrompt.tsx), and the line on the booking page that shows the choice.
export const audiencePrompt = {
  title: "What Are You Booking For?",
  choices: [
    { value: "personal", title: "Personal Events", text: "Weddings, Birthdays and Parties" },
    { value: "business", title: "Business Events", text: "Conferences, Launches and Brand Shoots" },
  ],
  // Under the two choices: for artists, straight to For Artists (and the question isn't asked again).
  artistSkip: "Skip And Join As Artist",
  bookingFor: "Booking For",
  change: "Change",
  close: "Close",
} as const;

// The newsletter's confirm and unsubscribe pages, opened from the links in its emails, as on
// aod.co.in (src/content/blog.ts there), 2026-11-21. Nobody new can subscribe (the sign-up was
// removed there too); these keep working for anyone already on the list. Mock mode: nothing saved.
export const newsletterPages = {
  confirm: {
    title: "Confirm Your Subscription.",
    text: "One tap and you're on the list for the AOD newsletter.",
    button: "Yes, Subscribe Me",
    doneTitle: "You're Subscribed.",
    doneText: "Thanks! The next AOD newsletter will land in your inbox.",
  },
  unsubscribe: {
    title: "Unsubscribe From The AOD Newsletter.",
    text: "You'll stop getting the newsletter. Booking emails (confirmations and updates) aren't affected.",
    button: "Unsubscribe",
    doneTitle: "You're Unsubscribed.",
    doneText: "You won't get the AOD newsletter any more.",
  },
  testNote: "Test mode: nothing is saved.",
};
