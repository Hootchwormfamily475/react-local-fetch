/**
 * encryption.ts - Native Web Crypto Implementation (AES-GCM)
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

/**
 * Derives a cryptographic key from a password string using PBKDF2.
 */
async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string using AES-GCM 256-bit.
 */
export async function encrypt(
  data: string,
  secret: string
): Promise<{ buffer: ArrayBuffer; salt: number[]; iv: number[] }> {
  if (typeof window === 'undefined') {
    throw new Error('Encryption is only available in the browser.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(secret, salt);

  const encodedData = new TextEncoder().encode(data);
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encodedData
  );

  return {
    buffer: encryptedContent,
    salt: Array.from(salt),
    iv: Array.from(iv),
  };
}

/**
 * Decrypts an ArrayBuffer using AES-GCM 256-bit.
 */
export async function decrypt(
  buffer: ArrayBuffer,
  secret: string,
  salt: number[],
  iv: number[]
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Decryption is only available in the browser.');
  }

  const key = await deriveKey(secret, new Uint8Array(salt));

  const decryptedContent = await window.crypto.subtle.decrypt(
    { name: ALGORITHM, iv: new Uint8Array(iv) },
    key,
    buffer
  );

  return new TextDecoder().decode(decryptedContent);
}
