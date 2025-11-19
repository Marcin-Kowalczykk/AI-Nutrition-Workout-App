import CryptoJS from "crypto-js";

export function encryptPassword(password: string): string {
  const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error(
      "NEXT_PUBLIC_ENCRYPTION_KEY is not set in environment variables"
    );
  }

  const encrypted = CryptoJS.AES.encrypt(password, encryptionKey).toString();
  return encrypted;
}

export function decryptPassword(encryptedPassword: string): string {
  const encryptionKey =
    process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_ENCRYPTION_KEY;

  if (!encryptionKey) {
    throw new Error(
      "ENCRYPTION_KEY or NEXT_PUBLIC_ENCRYPTION_KEY is not set in environment variables"
    );
  }

  const decrypted = CryptoJS.AES.decrypt(encryptedPassword, encryptionKey);
  const password = decrypted.toString(CryptoJS.enc.Utf8);

  if (!password) {
    throw new Error(
      "Failed to decrypt password. Invalid encryption key or data."
    );
  }

  return password;
}
