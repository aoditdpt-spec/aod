import Link from "next/link";
import { ArrowRight, ArrowUpRight, Briefcase, Check, IndianRupee, LogIn, Scale, Sparkles, Ticket, UserPlus } from "lucide-react";
import { artistJoinMessage, brand, portals } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { TiltCard, cardHover, iconHover } from "@/components/motion/TiltCard";
import { whatsappUrl } from "@/lib/whatsapp";

const icons = { bookings: Ticket, pay: IndianRupee, resolve: Scale, business: Briefcase };

// "Everything in one place": where each kind of visitor goes. Artists first, in a dark band with
// the two ways in (apply / sign in to the portal), then the customer places as cards: My bookings,
// payments, the Resolution Centre and AOD for Business. Each card shows its address too.
export function Portals() {
  const a = portals.artist;
  return (
    <Container className="py-16 sm:py-20">
      <p className="text-sm font-medium uppercase tracking-wider text-brand">{portals.eyebrow}</p>
      <h2 className="mt-3 text-4xl font-medium leading-[1.1] sm:text-5xl">{portals.title}</h2>
      <p className="mt-4 max-w-2xl text-lg text-body">{portals.text}</p>

      {/* Artists */}
      <section aria-labelledby="portal-artists" className="mt-10 grid gap-8 overflow-hidden rounded-[1.5rem] bg-night p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:p-12">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tangerine/15 px-3 py-1 text-sm font-medium text-apricot">
            <Sparkles className="h-4 w-4" aria-hidden /> {a.eyebrow}
          </span>
          <h3 id="portal-artists" className="mt-4 text-3xl font-medium leading-tight !text-white sm:text-4xl">
            {a.title}
          </h3>
          <p className="mt-4 max-w-xl text-white/80">{a.text}</p>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {a.perks.map((p) => (
              <li key={p} className="flex items-center gap-2 text-white">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tangerine/20">
                  <Check className="h-3.5 w-3.5 text-tangerine" aria-hidden />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link href="/for-artists" className="inline-flex items-center gap-1 font-medium text-apricot hover:underline">
              {a.more} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <a href={whatsappUrl(artistJoinMessage)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white">
              <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> {a.whatsapp} Message AOD
            </a>
          </p>
        </div>

        {/* The two ways in, as large tappable panels. */}
        <div className="flex flex-col justify-center gap-4">
          {[
            { ...a.join, icon: UserPlus, primary: true },
            { ...a.signIn, icon: LogIn, primary: false },
          ].map((x) => (
            <Link
              key={x.href}
              href={x.href}
              className={`group flex items-center gap-4 rounded-card border p-5 transition-colors sm:p-6 ${x.primary ? "border-transparent bg-brand hover:bg-brand-hover" : "border-night-line bg-white/[0.04] hover:border-tangerine/50 hover:bg-white/[0.07]"}`}
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${x.primary ? "bg-white/15" : "bg-tangerine/15"}`}>
                <x.icon className={`h-6 w-6 ${x.primary ? "text-white" : "text-tangerine"}`} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-xs font-medium uppercase tracking-wider ${x.primary ? "text-white/75" : "text-white/55"}`}>{x.label}</span>
                <span className="mt-0.5 block text-lg font-medium text-white">{x.title}</span>
                <span className={`mt-0.5 block text-sm ${x.primary ? "text-white/85" : "text-white/65"}`}>{x.text}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-white transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      {/* Customers and companies */}
      <StaggerList className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {portals.places.map((p) => {
          const I = icons[p.id as keyof typeof icons];
          return (
            <StaggerItem key={p.id}>
              <TiltCard className={`rounded-card border border-line bg-white ${cardHover}`}>
                <Link href={p.href} className="flex h-full flex-col p-6">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-peach ${iconHover}`}>
                    <I className="h-5 w-5 text-brand" aria-hidden />
                  </span>
                  <span className="mt-5 text-xs font-medium uppercase tracking-wider text-muted">{p.who}</span>
                  <span className="mt-1 text-xl font-medium text-ink">{p.title}</span>
                  <span className="mt-2 text-body">{p.text}</span>
                  <ul className="mt-4 flex-1 space-y-1.5 text-sm text-body">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex gap-2">
                        <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-brand-bright" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
                    <span className="font-medium text-brand">{p.cta}</span>
                    <ArrowUpRight className="h-4 w-4 text-brand transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                  <span className="mt-1 text-xs text-muted">
                    {brand.domain}
                    {p.href}
                  </span>
                </Link>
              </TiltCard>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </Container>
  );
}
