import type { MetadataRoute } from "next";
import { siteManifest } from "@/lib/pwa";

// The customer site's web app manifest (/manifest.webmanifest); see src/lib/pwa.ts.
export default function manifest(): MetadataRoute.Manifest {
  return siteManifest();
}
