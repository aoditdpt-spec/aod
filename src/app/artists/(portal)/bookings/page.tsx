import type { Metadata } from "next";
import { BookingsBoard } from "@/components/artists/BookingsBoard";

export const metadata: Metadata = { title: "Bookings" };

export default function BookingsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-medium sm:text-4xl">Bookings</h1>
      <p className="mt-2 max-w-2xl text-body">
        Requests come from customers AOD has matched you with. Reply with a quote within the time shown; the customer picks from three
        matched artists.
      </p>
      <BookingsBoard />
    </div>
  );
}
