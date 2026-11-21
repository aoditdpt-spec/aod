import Image from "next/image";
import Link from "@/components/ui/AppLink";

// The orange "AOD." wordmark. `unoptimized`, because Next's small AVIF copy turns the orange brown.
export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} aria-label="AOD home" className="flex shrink-0 items-center rounded-md">
      <Image src="/aod-wordmark-sm.png" alt="AOD." width={71} height={20} priority unoptimized className="h-5 w-auto" />
    </Link>
  );
}
