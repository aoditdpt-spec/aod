import CFB from "cfb";

// Password-protects an .xlsx file the way Excel does ("Encrypt with password"): ECMA-376 Agile
// Encryption, AES-256 in CBC mode with SHA-512, the password hashed 100,000 times. Excel, Google
// Sheets, WPS and LibreOffice ask for the password before they open it. It runs in the browser with
// its built-in crypto (crypto.subtle), so the password never leaves the admin's computer.
// The steps follow xlsx-populate's Encryptor (MIT), the same as Excel writes them: the workbook is
// encrypted with a random key in 4096-byte segments, that key is encrypted with the password, and
// an HMAC lets Excel check the file wasn't changed. The result is a small compound file holding
// two streams, EncryptionInfo and EncryptedPackage. Tested by scripts/xlsx-encrypt-check.mts.

const SPIN_COUNT = 100_000;
const SEGMENT = 4096;
const INFO_PREFIX = [0x04, 0x00, 0x04, 0x00, 0x40, 0x00, 0x00, 0x00]; // version 4.4, flags 0x40 (agile)
const BLOCK_KEYS = {
  key: [0x14, 0x6e, 0x0b, 0xe7, 0xab, 0xac, 0xd0, 0xd6],
  verifierInput: [0xfe, 0xa7, 0xd2, 0x76, 0x3b, 0x4b, 0x9e, 0x79],
  verifierValue: [0xd7, 0xaa, 0x0f, 0x6d, 0x30, 0x61, 0x34, 0x4e],
  hmacKey: [0x5f, 0xb2, 0xad, 0x01, 0x0c, 0xb9, 0xe1, 0xf6],
  hmacValue: [0xa0, 0x67, 0x7f, 0x02, 0xb2, 0x2c, 0x84, 0x33],
};

// Byte arrays backed by a plain ArrayBuffer, which is what Web Crypto takes.
type Bytes = Uint8Array<ArrayBuffer>;

const subtle = () => globalThis.crypto.subtle;
const random = (n: number) => globalThis.crypto.getRandomValues(new Uint8Array(n));

function concat(...parts: ArrayLike<number>[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

const uint32 = (n: number, size = 4) => {
  const b = new Uint8Array(size);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
};

const sha512 = async (...parts: ArrayLike<number>[]) => new Uint8Array(await subtle().digest("SHA-512", concat(...parts)));

// The text of the password as Excel hashes it: UTF-16, little-endian.
function utf16le(text: string): Bytes {
  const out = new Uint8Array(text.length * 2);
  for (let i = 0; i < text.length; i++) new DataView(out.buffer).setUint16(i * 2, text.charCodeAt(i), true);
  return out;
}

// Cut to `size` bytes, or pad with 0x36 (the spec's filler).
function fit(bytes: Bytes, size: number): Bytes {
  if (bytes.length >= size) return concat(bytes.subarray(0, size));
  const out = new Uint8Array(size).fill(0x36);
  out.set(bytes);
  return out;
}

// AES-CBC without padding (the input is always whole 16-byte blocks). Web Crypto always adds a
// padding block at the end; dropping it leaves exactly the unpadded result.
async function aesCbc(key: Bytes, iv: Bytes, data: Bytes): Promise<Bytes> {
  const k = await subtle().importKey("raw", key, "AES-CBC", false, ["encrypt"]);
  const out = new Uint8Array(await subtle().encrypt({ name: "AES-CBC", iv }, k, data));
  return out.slice(0, data.length);
}

const padTo16 = (b: ArrayLike<number>): Bytes => concat(b, new Uint8Array(b.length % 16 ? 16 - (b.length % 16) : 0));
const base64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));

export async function encryptXlsx(xlsx: Uint8Array, password: string): Promise<Uint8Array> {
  if (!password) throw new Error("A password is needed.");
  const packageKey = random(32);
  const packageSalt = random(16);
  const keySalt = random(16);

  // 1. The workbook, in 4096-byte segments, each with its own IV; prefixed with its length.
  const segments: Uint8Array[] = [];
  for (let i = 0, start = 0; start < xlsx.length; i++, start += SEGMENT) {
    const iv = fit(await sha512(packageSalt, uint32(i)), 16);
    segments.push(await aesCbc(packageKey, iv, padTo16(xlsx.subarray(start, start + SEGMENT))));
  }
  const encryptedPackage = concat(uint32(xlsx.length, 8), ...segments);

  // 2. Data integrity: an HMAC of the encrypted package, with a random key; both encrypted.
  const hmacKey = random(64);
  const hmacKeyIv = fit(await sha512(packageSalt, BLOCK_KEYS.hmacKey), 16);
  const encryptedHmacKey = await aesCbc(packageKey, hmacKeyIv, hmacKey);
  const hmacCryptoKey = await subtle().importKey("raw", hmacKey, { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const hmacValue = new Uint8Array(await subtle().sign("HMAC", hmacCryptoKey, encryptedPackage));
  const hmacValueIv = fit(await sha512(packageSalt, BLOCK_KEYS.hmacValue), 16);
  const encryptedHmacValue = await aesCbc(packageKey, hmacValueIv, hmacValue);

  // 3. The password: hashed with the salt, then 100,000 more times; one key per use from that.
  let spun = await sha512(keySalt, utf16le(password));
  for (let i = 0; i < SPIN_COUNT; i++) spun = await sha512(uint32(i), spun);
  const passwordKey = async (block: number[]) => fit(await sha512(spun, block), 32);

  const encryptedKeyValue = await aesCbc(await passwordKey(BLOCK_KEYS.key), keySalt, packageKey);
  // The verifier lets Excel tell a wrong password straight away.
  const verifierInput = random(16);
  const encryptedVerifierHashInput = await aesCbc(await passwordKey(BLOCK_KEYS.verifierInput), keySalt, verifierInput);
  const encryptedVerifierHashValue = await aesCbc(await passwordKey(BLOCK_KEYS.verifierValue), keySalt, await sha512(verifierInput));

  // 4. The description Excel reads first, then both streams in a compound file.
  const common = `blockSize="16" keyBits="256" hashSize="64" cipherAlgorithm="AES" cipherChaining="ChainingModeCBC" hashAlgorithm="SHA512"`;
  const xml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n` +
    `<encryption xmlns="http://schemas.microsoft.com/office/2006/encryption" xmlns:p="http://schemas.microsoft.com/office/2006/keyEncryptor/password" xmlns:c="http://schemas.microsoft.com/office/2006/keyEncryptor/certificate">` +
    `<keyData saltSize="16" ${common} saltValue="${base64(packageSalt)}"/>` +
    `<dataIntegrity encryptedHmacKey="${base64(encryptedHmacKey)}" encryptedHmacValue="${base64(encryptedHmacValue)}"/>` +
    `<keyEncryptors><keyEncryptor uri="http://schemas.microsoft.com/office/2006/keyEncryptor/password">` +
    `<p:encryptedKey spinCount="${SPIN_COUNT}" saltSize="16" ${common} saltValue="${base64(keySalt)}" ` +
    `encryptedVerifierHashInput="${base64(encryptedVerifierHashInput)}" encryptedVerifierHashValue="${base64(encryptedVerifierHashValue)}" ` +
    `encryptedKeyValue="${base64(encryptedKeyValue)}"/>` +
    `</keyEncryptor></keyEncryptors></encryption>`;
  const encryptionInfo = concat(INFO_PREFIX, new TextEncoder().encode(xml));

  const file = CFB.utils.cfb_new();
  CFB.utils.cfb_add(file, "EncryptionInfo", encryptionInfo);
  CFB.utils.cfb_add(file, "EncryptedPackage", encryptedPackage);
  CFB.utils.cfb_del(file, "\u0001Sh33tJ5"); // the library's own marker entry
  return new Uint8Array(CFB.write(file, { type: "array" }) as ArrayLike<number>);
}
