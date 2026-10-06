// Checks the payment page's UPI rules (src/lib/upi.ts).
// Run with: npm run check:pay
import { amountProblem, isUpiId, isUtr, parseAmount, upiUrl } from "../src/lib/upi.ts";

let failed = 0;
const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label.padEnd(44)} → ${JSON.stringify(got)}${ok ? "" : `   (expected ${JSON.stringify(want)})`}`);
};

check('parseAmount("5,000")', parseAmount("5,000"), 5000);
check('parseAmount("₹ 2500.5")', parseAmount("₹ 2500.5"), 2500.5);
check('parseAmount("0")', parseAmount("0"), null);
check('parseAmount("12abc")', parseAmount("12abc"), null);
check("amountProblem(100001) is set", amountProblem(100001) !== null, true);
check("amountProblem(100000) is null", amountProblem(100000), null);
check('isUpiId("artistsondemand@okaxis")', isUpiId("artistsondemand@okaxis"), true);
check('isUpiId("not an id")', isUpiId("not an id"), false);
check('isUpiId("9274739763@ybl")', isUpiId("9274739763@ybl"), true);
check('isUtr("4271 0058 3349")', isUtr("4271 0058 3349"), true);
check('isUtr("12345")', isUtr("12345"), false);
check(
  "upiUrl keeps @ and encodes spaces as %20",
  upiUrl({ upiId: "aod@okaxis", payeeName: "Artists on Demand", amount: 2500, note: "AOD B-1187 Riya" }),
  "upi://pay?pa=aod@okaxis&pn=Artists%20on%20Demand&am=2500.00&cu=INR&tn=AOD%20B-1187%20Riya",
);
check(
  "upiUrl strips odd characters from the note",
  upiUrl({ upiId: "aod@okaxis", payeeName: "AOD", amount: 1, note: "Hi <b>&" }, "tez://upi/pay"),
  "tez://upi/pay?pa=aod@okaxis&pn=AOD&am=1.00&cu=INR&tn=Hi%20b",
);

console.log(failed ? `\n${failed} failed` : "\nAll passed");
process.exit(failed ? 1 : 0);
