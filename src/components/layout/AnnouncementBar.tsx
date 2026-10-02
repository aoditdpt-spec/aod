import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

// Soft peach-to-apricot promo strip above the hero.
export function AnnouncementBar() {
  return (
    <Container className="pt-6">
      <div className="flex flex-col gap-2 rounded-[1.5rem] bg-gradient-to-r from-peach via-[#ffe8d6] to-[#ffdcc2] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-lg text-ink sm:text-xl">Creative talent for your brand, on contract.</p>
        <Link
          href="/business"
          className="inline-flex items-center gap-1 font-medium text-ink underline underline-offset-4 hover:text-brand"
        >
          AOD for Business
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </Container>
  );
}
