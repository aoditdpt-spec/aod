import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { MyBookings } from "@/components/bookings/MyBookings";

export const metadata: Metadata = {
  title: "My bookings",
  description: "See your Artists on Demand bookings: status, artist, payments, delivery and help.",
  // Personal account page: not for search results.
  robots: { index: false, follow: false },
};

export default function MyBookingsPage() {
  return (
    <Container className="py-10 sm:py-14">
      <MyBookings />
    </Container>
  );
}
