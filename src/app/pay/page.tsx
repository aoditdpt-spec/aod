import { Suspense } from "react";
import { payCopy } from "@/content/payments";
import { PayFlow } from "@/components/pay/PayFlow";

// The payment flow reads the payment link's query string (?amount=…&ref=…), so it renders in
// the browser inside this Suspense boundary; the page itself stays static.
export default function PayPage() {
  return (
    <>
      <div className="mx-auto max-w-xl pb-6 pt-4 text-center print:hidden">
        <h1 className="text-3xl font-medium sm:text-4xl">{payCopy.title}</h1>
        <p className="mt-2 text-body">{payCopy.subtitle}</p>
      </div>
      <Suspense fallback={<div className="mx-auto h-[32rem] max-w-xl animate-pulse rounded-[1.5rem] bg-white" />}>
        <PayFlow />
      </Suspense>
    </>
  );
}
