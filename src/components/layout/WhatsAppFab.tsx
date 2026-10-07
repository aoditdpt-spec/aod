import { WhatsAppIcon } from "@/components/ui/Icon";
import { whatsappUrl } from "@/lib/whatsapp";

// Floating WhatsApp button, bottom-right on every page: a rounded-square logo that slides open
// to "Chat on WhatsApp" on hover or keyboard focus.
export function WhatsAppFab() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="group fixed bottom-5 right-5 z-50 inline-flex h-14 items-center rounded-2xl bg-whatsapp px-4 text-white shadow-lg transition-colors hover:bg-whatsapp-hover"
    >
      <WhatsAppIcon className="h-6 w-6 shrink-0" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap font-medium opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-48 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-48 group-focus-visible:opacity-100">
        Chat on WhatsApp
      </span>
    </a>
  );
}
