import {
  BadgeCheck,
  Briefcase,
  Brush,
  CalendarSync,
  CalendarX,
  Camera,
  CircleQuestionMark,
  Handshake,
  Heart,
  Hotel,
  PartyPopper,
  Rocket,
  Store,
  User,
  Drone,
  Film,
  Lock,
  Mic,
  MicVocal,
  Music,
  RefreshCcw,
  Signature,
  Sparkles,
  Tag,
  Ticket,
  Video,
  type LucideProps,
} from "lucide-react";

// Maps the icon names used in src/content/site.ts to lucide icons.
const icons = {
  camera: Camera,
  video: Video,
  drone: Drone,
  mic: Mic,
  film: Film,
  music: Music,
  ticket: Ticket,
  "mic-vocal": MicVocal,
  brush: Brush,
  sparkles: Sparkles,
  tag: Tag,
  lock: Lock,
  refresh: RefreshCcw,
  signature: Signature,
  "calendar-x": CalendarX,
  "calendar-sync": CalendarSync,
  handshake: Handshake,
  "badge-check": BadgeCheck,
  heart: Heart,
  party: PartyPopper,
  user: User,
  question: CircleQuestionMark,
  briefcase: Briefcase,
  store: Store,
  hotel: Hotel,
  rocket: Rocket,
};

export type AnyIconName = keyof typeof icons;

export function Icon({ name, ...props }: { name: AnyIconName } & LucideProps) {
  const Component = icons[name];
  return <Component aria-hidden {...props} />;
}

// lucide has no brand icons, so WhatsApp, Instagram and LinkedIn are drawn here.
export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

export function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function LinkedInIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05a3.75 3.75 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}
