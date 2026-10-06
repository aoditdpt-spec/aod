import type { Metadata } from "next";
import { AvailabilityCalendar } from "@/components/artists/AvailabilityCalendar";

export const metadata: Metadata = { title: "Availability" };

export default function AvailabilityPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-medium sm:text-4xl">Availability</h1>
      <p className="mt-2 max-w-2xl text-body">Mark the days you can&apos;t work, so you only get requests you can take.</p>
      <AvailabilityCalendar />
    </div>
  );
}
