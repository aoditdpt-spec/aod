"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

// QR code for a upi:// link, drawn as SVG in the browser (the amount changes per payment).
export function UpiQr({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M" }).then((s) => {
      if (live) setSvg(s);
    });
    return () => {
      live = false;
    };
  }, [value]);

  return (
    <div
      role="img"
      aria-label={label}
      className="aspect-square w-full rounded-xl bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
      // The markup comes from the qrcode library, built from our own upi:// link.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    >
      {svg ? undefined : <span className="block h-full w-full animate-pulse rounded-lg bg-wash" />}
    </div>
  );
}
