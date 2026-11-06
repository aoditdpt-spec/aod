import Link from "next/link";
import { ArrowUpRight, Briefcase, Scale, Ticket } from "lucide-react";
import { portals } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { linkCard, linkText, linkTitle } from "@/components/ui/cards";
import { portalAddress, portalHref } from "@/lib/site-url";

const icons = { bookings: Ticket, resolve: Scale, business: Briefcase };

// "Everything in one place" (laptops): the customer places as cards: My bookings, the Dispute Desk
// and AOD for Business. Each card shows its address too. (The artist "Join AOD" band that opened
// this section was removed on request.)
export function Portals() {
  return (
    <Container className="py-16 sm:py-20">
      <p className="text-sm font-medium uppercase tracking-wider text-brand">{portals.eyebrow}</p>
      <h2 className="mt-3 text-4xl font-medium leading-[1.1] sm:text-5xl">{portals.title}</h2>
      <p className="mt-4 max-w-2xl text-lg text-body">{portals.text}</p>

      {/* Customers and companies */}
      <StaggerList className="swipe-row mt-10 grid gap-5 md:grid-cols-3">
        {portals.places.map((p) => {
          const I = icons[p.id as keyof typeof icons];
          return (
            <StaggerItem key={p.id} className="swipe-item">
              <Link href={portalHref(p.href)} className={`flex h-full flex-col rounded-card bg-white p-6 ${linkCard}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-peach">
                  <I className="h-5 w-5 text-brand" aria-hidden />
                </span>
                <span className="mt-5 text-xs font-medium uppercase tracking-wider text-muted">{p.who}</span>
                <span className={`mt-1 text-xl font-bold text-ink ${linkTitle}`}>{p.title}</span>
                <span className={`mt-2 text-body ${linkText}`}>{p.text}</span>
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
                <span className="mt-1 text-xs text-muted">{portalAddress(p.href)}</span>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </Container>
  );
}
