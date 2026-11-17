"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Company } from "@/content/business-portal";
import { sampleBusinessOrders } from "@/content/business-portal";
import { backendEnabled } from "@/lib/backend";
import { businessCompanyStore } from "@/lib/business-store";
import { sentRequestsStore } from "@/lib/customer-store";
import { useLiveRefresh } from "@/lib/live";
import { useHydrated } from "@/lib/motion-safe";
import { Container } from "@/components/ui/Container";
import { PageLoader } from "@/components/ui/Spinner";
import { fromRequest } from "@/components/bookings/MyBookings";
import { signOutAction } from "@/server/actions/auth";
import { myCompany } from "@/server/actions/business";
import { myOrders, type MyOrders } from "@/server/actions/customer";
import { BusinessApp } from "./BusinessApp";
import { BusinessAuth } from "./BusinessAuth";

// aod.co.in/business. Signed out, visitors see the page's introduction (`hero`, then the sign-in /
// sign-up card, then `rest`); a signed-in company sees its portal instead. The introduction is
// rendered on the server, so it shows without JavaScript and to search engines.
export function BusinessPortal({ hero, rest }: { hero: ReactNode; rest: ReactNode }) {
  return backendEnabled ? <LivePortal hero={hero} rest={rest} /> : <PreviewPortal hero={hero} rest={rest} />;
}

type Props = { hero: ReactNode; rest: ReactNode };

function SignedOut({ hero, rest, onSignedIn }: Props & { onSignedIn: (c: Company) => void }) {
  return (
    <>
      {hero}
      <Container className="py-10">
        <BusinessAuth onSignedIn={onSignedIn} />
      </Container>
      {rest}
    </>
  );
}

function PreviewPortal({ hero, rest }: Props) {
  const hydrated = useHydrated();
  const company = businessCompanyStore.use();
  const sent = sentRequestsStore.use();
  const [samples] = useState(() => sampleBusinessOrders(new Date()));
  // An order sent from this browser's business booking form shows next to the samples.
  const orders = [...sent.filter((r) => r.audience === "business").map(fromRequest), ...samples];
  if (!hydrated) return hero ? <>{hero}{rest}</> : null;
  if (!company) return <SignedOut hero={hero} rest={rest} onSignedIn={(c) => businessCompanyStore.set(c)} />;
  return (
    <Container className="py-8 sm:py-12">
      <BusinessApp company={company} orders={orders} sampleNote onCompanyChange={(c) => businessCompanyStore.set(c)} onSignOut={() => businessCompanyStore.clear()} />
    </Container>
  );
}

function LivePortal({ hero, rest }: Props) {
  const [company, setCompany] = useState<Company | null | undefined>(undefined); // undefined = loading
  const [data, setData] = useState<MyOrders | null>(null);
  const [error, setError] = useState(false);

  const loadOrders = useCallback(() => {
    myOrders()
      .then((d) => setData(d))
      .catch(() => setError(true));
  }, []);
  useEffect(() => {
    myCompany()
      .then((c) => {
        setCompany(c);
        if (c) loadOrders();
      })
      .catch(() => setCompany(null));
  }, [loadOrders]);
  // New quotes, assigned artists and payments appear without refreshing.
  useLiveRefresh(company && data?.topic ? [data.topic] : null, loadOrders);

  if (company === undefined) return <PageLoader className="min-h-[70vh]" label="Loading AOD for Business…" />;
  if (!company)
    return (
      <SignedOut
        hero={hero}
        rest={rest}
        onSignedIn={(c) => {
          setCompany(c);
          loadOrders();
        }}
      />
    );
  return (
    <Container className="py-8 sm:py-12">
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Couldn&apos;t load your orders just now. Refresh to try again.</p>}
      <BusinessApp
        company={company}
        orders={data?.orders ?? []}
        onCompanyChange={setCompany}
        onSignOut={() =>
          void signOutAction().then(() => {
            setCompany(null);
            setData(null);
          })
        }
      />
    </Container>
  );
}
