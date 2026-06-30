// AES-256-GCM Native Web Crypto Encryption Helper

async function getEncryptionKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  // Derive a 256-bit key by hashing or padding the user's secret/UID
  const rawKey = enc.encode(secret.padEnd(32, 'a').slice(0, 32));
  return window.crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts cleartext string using AES-256-GCM
 * @param text The cleartext string
 * @param secret The encryption passphrase (e.g. user ID)
 * @returns Base64 encoded string containing IV + ciphertext
 */
export async function encryptData(text: string, secret: string): Promise<string> {
  if (!text) return "";
  try {
    const key = await getEncryptionKey(secret);
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for GCM
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(text)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert binary to Base64 safely
    let binary = "";
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error("AES-256 Encryption Failed:", error);
    throw new Error("Encryption failed: " + String(error));
  }
}

/**
 * Decrypts an AES-256-GCM encrypted Base64 string
 * @param base64Data Base64 representation of combined IV + ciphertext
 * @param secret The encryption passphrase (e.g. user ID)
 * @returns Cleartext string
 */
export async function decryptData(base64Data: string, secret: string): Promise<string> {
  if (!base64Data) return "";
  try {
    const key = await getEncryptionKey(secret);
    const binary = atob(base64Data);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (error) {
    console.error("AES-256 Decryption Failed:", error);
    throw new Error("Decryption failed. Please ensure the secret key is correct.");
  }
}
