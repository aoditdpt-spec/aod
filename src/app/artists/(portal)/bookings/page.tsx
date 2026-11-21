import type { Metadata } from "next";
import { Bookings } from "@/components/dash/portal/Portal";

export const metadata: Metadata = { title: "Bookings" };

export default function Page() {
  return <Bookings />;
}
