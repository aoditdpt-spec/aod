import type { Metadata } from "next";
import { myBookingsPage as p } from "@/data/pages";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { MyBookings } from "@/components/bookings/MyBookings";

export const metadata: Metadata = { title: "My Bookings", description: p.meta, robots: { index: false } };

export default function MyBookingsPage() {
  return (
    <main className="flex-1">
      <PageHeader title={p.title} />
      <Container className="pb-24 lg:pb-32">
        <MyBookings />
      </Container>
    </main>
  );
}
