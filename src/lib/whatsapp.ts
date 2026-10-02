const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919274739763";

// Builds a wa.me link that opens a chat with AOD with the message pre-filled.
export function whatsappUrl(message = "Hi Artists on Demand! I have an enquiry.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
