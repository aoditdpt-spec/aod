import { SiteChrome } from "@/components/layout/SiteChrome";

// The customer site (the group doesn't change any address).
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return <SiteChrome>{children}</SiteChrome>;
}
