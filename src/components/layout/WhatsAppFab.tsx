import { WhatsAppIcon } from "@/components/ui/Icon";
import { whatsappUrl } from "@/lib/whatsapp";

// Floating "Chat on WhatsApp" button, bottom-right on every page.
export function WhatsAppFab() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-lg bg-whatsapp px-4 py-3 font-medium text-white shadow-lg hover:bg-whatsapp-hover"
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden sm:inline">Chat on WhatsApp</span>
    </a>
  );
}
