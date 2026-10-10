// Admin panel: pipelines, roles, message templates and settings. Served at /admin for now and
// on admin.aod.co.in once that domain points here (see src/proxy.ts).
//
// PREVIEW: there is no backend yet. The panel runs on sample data kept in the browser
// (src/lib/admin-store.ts, seeded from src/content/admin-sample.ts); sign-in and 2-step codes
// accept anything. Nothing here is real customer or artist data. When Supabase is added, the
// same screens read and write the database, and staff sign in with real accounts and 2FA.

// ---- Status pipelines (from the platform plan) ----

export const applicationStages = [
  { id: "submitted", label: "Submitted", tone: "brand" },
  { id: "review", label: "Under review", tone: "wait" },
  { id: "meeting", label: "Meeting scheduled", tone: "wait" },
  { id: "trial", label: "Trial booking", tone: "wait" },
  { id: "approved", label: "Approved", tone: "good" },
  { id: "rejected", label: "Not selected", tone: "neutral" },
] as const;

export const bookingStages = [
  { id: "new", label: "New", tone: "brand" },
  { id: "matched", label: "Matched", tone: "wait" },
  { id: "quoted", label: "Quote sent", tone: "wait" },
  { id: "payment_pending", label: "Payment pending", tone: "wait" },
  { id: "confirmed", label: "Confirmed", tone: "good" },
  { id: "completed", label: "Event done", tone: "good" },
  { id: "delivered", label: "Delivered", tone: "good" },
  { id: "reviewed", label: "Reviewed", tone: "neutral" },
  { id: "cancelled", label: "Cancelled", tone: "bad" },
  { id: "rescheduled", label: "Rescheduled", tone: "wait" },
] as const;

// The kanban board shows these columns, in order; cancelled and rescheduled sit at the end.
export const activeBookingStages = ["new", "matched", "quoted", "payment_pending", "confirmed", "completed", "delivered", "reviewed"] as const;

export const paymentStatuses = [
  { id: "pending", label: "Pending verification", tone: "wait" },
  { id: "verified", label: "Verified", tone: "good" },
  { id: "rejected", label: "Not found", tone: "bad" },
] as const;

export const leadStatuses = [
  { id: "new", label: "New", tone: "brand" },
  { id: "contacted", label: "Contacted", tone: "wait" },
  { id: "converted", label: "Converted", tone: "good" },
  { id: "lost", label: "Lost", tone: "neutral" },
] as const;

// Resolution Centre cases (the public side's wording is in src/content/resolution.ts).
export const caseStages = [
  { id: "received", label: "Received", tone: "brand" },
  { id: "acknowledged", label: "Acknowledged", tone: "wait" },
  { id: "investigating", label: "Being looked into", tone: "wait" },
  { id: "resolved", label: "Resolved", tone: "good" },
  { id: "escalated", label: "Escalated", tone: "bad" },
  { id: "closed", label: "Closed", tone: "neutral" },
] as const;

export const leadSources = ["Website", "WhatsApp", "Business form", "Instagram", "Phone call", "Referral"] as const;

export type Tone = "brand" | "wait" | "good" | "bad" | "neutral";

// ---- Roles: who can do what ----

export const roles = [
  { id: "owner", label: "Owner", text: "Everything, including team, settings and payouts" },
  { id: "ops", label: "Operations", text: "Applications, artists, bookings, leads and messages" },
  { id: "finance", label: "Finance", text: "Payment verification, payouts and exports" },
  { id: "viewer", label: "Viewer", text: "Can see everything, can't change anything" },
] as const;

export type Role = (typeof roles)[number]["id"];

export const permissions = {
  "applications.edit": ["owner", "ops"],
  "artists.edit": ["owner", "ops"],
  "bookings.edit": ["owner", "ops"],
  "payments.verify": ["owner", "finance"],
  "payouts.pay": ["owner", "finance"],
  "leads.edit": ["owner", "ops"],
  "messages.send": ["owner", "ops"],
  "export": ["owner", "ops", "finance"],
  "team.edit": ["owner"],
  "settings.edit": ["owner"],
  "cases.edit": ["owner", "ops"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof permissions;

export const can = (role: Role, p: Permission) => (permissions[p] as readonly Role[]).includes(role);

// ---- WhatsApp message templates ----
// {placeholders} are filled from the booking, artist or application. Until the WhatsApp Business
// Platform is connected, "Send" opens WhatsApp with the message ready, and the team presses send.

export const templates = [
  {
    id: "quote",
    to: "customer",
    name: "Quote",
    text: "Hi {customer}, here's your quote for {service} on {date} in {city}: {quote}, with an advance of {amount} to confirm. Reply YES and we'll send the payment link. – Team AOD",
  },
  {
    id: "payment_link",
    to: "customer",
    name: "Payment link",
    text: "Hi {customer}, to confirm booking {ref} please pay {amount} here: {paylink}. After paying, share the 12-digit UPI transaction ID. – Team AOD",
  },
  {
    id: "payment_reminder",
    to: "customer",
    name: "Payment reminder",
    text: "Hi {customer}, a reminder that booking {ref} is held for you until the payment of {amount} is made: {paylink}. – Team AOD",
  },
  {
    id: "confirmed",
    to: "customer",
    name: "Booking confirmed",
    text: "Hi {customer}, your payment is verified and booking {ref} is confirmed: {artist} for {service} on {date} in {city}. – Team AOD",
  },
  {
    id: "event_reminder",
    to: "customer",
    name: "Event reminder",
    text: "Hi {customer}, a reminder that {artist} is booked for {service} on {date} in {city}. Questions? Reply here. – Team AOD",
  },
  {
    id: "delivery",
    to: "customer",
    name: "Delivery link",
    text: "Hi {customer}, your files for {ref} are ready: {delivery}. The link works until {expiry}, so please download everything before then. – Team AOD",
  },
  {
    id: "review",
    to: "customer",
    name: "Review request",
    text: "Hi {customer}, how was {artist} at your {event}? A one-line review helps other families and the artist. – Team AOD",
  },
  {
    id: "artist_request",
    to: "artist",
    name: "Availability check (artist)",
    text: "Hi {artist}, new request: {service} for a {event} on {date} in {city}, budget {budget}. Are you available? Reply YES or NO. – Team AOD",
  },
  {
    id: "artist_confirmed",
    to: "artist",
    name: "Booking confirmed (artist)",
    text: "Hi {artist}, booking {ref} is confirmed: {service} on {date} in {city}. Customer: {customer}. – Team AOD",
  },
  {
    id: "application_meeting",
    to: "applicant",
    name: "Meeting invite (applicant)",
    text: "Hi {applicant}, thanks for applying to AOD. Can you meet us on {meeting} at our Ahmedabad office? Please bring samples of your work. – Team AOD",
  },
  {
    id: "application_approved",
    to: "applicant",
    name: "Approved (applicant)",
    text: "Hi {applicant}, welcome to AOD! You're approved and will start getting booking requests that match your craft and city. – Team AOD",
  },
  {
    id: "application_rejected",
    to: "applicant",
    name: "Not selected (applicant)",
    text: "Hi {applicant}, thank you for applying to AOD. We can't take you on right now, but you're welcome to apply again with new work in 3 months. – Team AOD",
  },
] as const;

export type TemplateId = (typeof templates)[number]["id"];
