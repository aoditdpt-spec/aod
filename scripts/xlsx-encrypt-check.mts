// Checks the password-protected Excel export (src/lib/xlsx-encrypt.ts): a workbook from the admin's
// writer (src/lib/xlsx.ts) is encrypted, then opened by an independent decryptor (officecrypto-tool,
// a dev dependency) with the right password, and refused with a wrong one. Run: npm run check:xlsx
// Pass a folder (npm run check:xlsx -- <folder>) to also save the encrypted file there, to open in Excel by hand.
import { writeFileSync } from "node:fs";
import officeCrypto from "officecrypto-tool";
import { buildXlsx } from "../src/lib/xlsx.ts";
import { encryptXlsx } from "../src/lib/xlsx-encrypt.ts";

let failures = 0;
const check = (label: string, ok: boolean, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra && !ok ? `  (${extra})` : ""}`);
  if (!ok) failures++;
};

// Big enough for several 4096-byte segments, with Indian text and a ₹ sign.
const rows = [["Booking", "Customer", "Phone", "Amount"], ...Array.from({ length: 400 }, (_, i) => [`B-${1201 + i}`, `ગ્રાહક ${i} · Customer`, `+91 98765 ${String(i).padStart(5, "0")}`, 1000 + i])];
const plain = buildXlsx([{ name: "Bookings", rows }]);
const password = "Aod@2026 ₹";

const started = Date.now();
const locked = await encryptXlsx(plain, password);
console.log(`encrypted ${plain.length} bytes in ${Date.now() - started} ms`);

const buf = Buffer.from(locked);
check("the file is marked as encrypted", officeCrypto.isEncrypted(buf));
check("it is not the plain workbook any more", !buf.includes(Buffer.from("B-1201")));

const opened = await officeCrypto.decrypt(buf, { password });
check("the right password opens it, byte for byte the same workbook", Buffer.compare(opened, Buffer.from(plain)) === 0);

let refused = false;
try {
  await officeCrypto.decrypt(buf, { password: "wrong-password" });
} catch {
  refused = true;
}
check("a wrong password is refused", refused);

const twice = await encryptXlsx(plain, password);
check("each export uses fresh random keys (two files differ)", Buffer.compare(Buffer.from(twice), buf) !== 0);

let empty = false;
try {
  await encryptXlsx(plain, "");
} catch {
  empty = true;
}
check("an empty password is refused", empty);

const folder = process.argv[2];
if (folder) {
  writeFileSync(`${folder}/aod-encrypted-test.xlsx`, buf);
  console.log(`saved ${folder}/aod-encrypted-test.xlsx (password: ${password})`);
}

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
