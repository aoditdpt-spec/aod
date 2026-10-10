import { createHash } from "node:crypto";

// Names of the private live-update channels (see src/lib/live.ts and the migration that sends
// to them). Emails are hashed the same way as public.email_key() in the database.
export const emailKey = (email: string) => createHash("sha256").update(email.trim().toLowerCase(), "utf8").digest("hex");
export const customerTopic = (email: string) => `customer:${emailKey(email)}`;
export const applicantTopic = (email: string) => `applicant:${emailKey(email)}`;
export const artistTopic = (artistId: string) => `artist:${artistId}`;
