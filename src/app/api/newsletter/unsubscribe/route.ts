import { NextResponse, type NextRequest } from "next/server";
import { unsubscribe } from "@/server/actions/newsletter";

// One-click unsubscribe (RFC 8058): the address in every newsletter's List-Unsubscribe header.
// Gmail, Outlook and Apple Mail show their own "Unsubscribe" button and call it with a POST.
// Opening it in a browser (GET) goes to the unsubscribe page, which asks before unsubscribing.
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const res = await unsubscribe(request.nextUrl.searchParams.get("t") ?? "");
  return new NextResponse(res.ok ? "Unsubscribed." : res.error, { status: res.ok ? 200 : 400 });
}

export function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/newsletter/unsubscribe";
  return NextResponse.redirect(url, 303);
}
