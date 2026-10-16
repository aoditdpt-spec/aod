import type { Metadata } from "next";
import { PortfolioManager } from "@/components/artists/PortfolioManager";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-medium sm:text-4xl">Portfolio</h1>
      <p className="mt-2 max-w-2xl text-body">Your work is the first thing customers judge you by. Keep it fresh and show your best.</p>
      <PortfolioManager />
    </div>
  );
}
