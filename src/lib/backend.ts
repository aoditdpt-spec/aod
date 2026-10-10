// Whether the real backend (Supabase) is set up. The two public keys are inlined into the
// browser bundle at build time, so client components can check this too.
//
// Without them the site runs as the preview it was before: forms open WhatsApp only, My bookings
// shows samples, and the admin works on sample data kept in the browser. With them, every form
// saves to the database first, and sign-in uses real emailed codes.
export const backendEnabled = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
