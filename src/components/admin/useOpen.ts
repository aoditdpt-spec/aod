"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// Which record's drawer is open, kept in the URL (?open=B-1205) so search results, alerts and
// shared links can open a record directly, and Back closes it.
export function useOpen(param = "open"): [string | null, (id: string | null) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const open = params.get(param);
  const setOpen = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (id) next.set(param, id);
      else next.delete(param);
      const q = next.toString();
      router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [params, router, pathname, param],
  );
  return [open, setOpen];
}
