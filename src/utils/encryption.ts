/**
 * Encryption utilities for KnowTation
 * 
 * Uses AES-GCM for client-side encryption of private references.
 * The encryption key is derived from the user's public key.
 */

/**
 * Generate a symmetric encryption key from the user's public key
 * 
 * @param publicKey - The user's Nostr public key (in hex format)
 * @returns The derived encryption key
 */
export async function deriveEncryptionKey(publicKey: string): Promise<CryptoKey> {
  // Convert public key to buffer for key derivation
  const publicKeyBuffer = new TextEncoder().encode(publicKey);
  
  // Use the public key as input to derive a symmetric key using PBKDF2
  const baseKey = await window.crypto.subtle.importKey(
    'raw', 
    publicKeyBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Salt can be a constant since the public key is unique per user
  const salt = new TextEncoder().encode('KnowTation-Reference-Encryption');
  
  // Derive the actual encryption key
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return derivedKey;
}

/**
 * Encrypt data using AES-GCM
 * 
 * @param data - The data to encrypt
 * @param key - The encryption key
 * @returns Base64-encoded encrypted data, with IV prepended
 */
export async function encryptData(data: string, key: CryptoKey): Promise<string> {
  // Generate a random initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Convert the data to a buffer
  const dataBuffer = new TextEncoder().encode(data);
  
  // Encrypt the data
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );
  
  // Combine the IV with the encrypted data
  const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encryptedBuffer), iv.length);
  
  // Convert to base64 for storage
  return btoa(String.fromCharCode(...result));
}

/**
 * Decrypt data using AES-GCM
 * 
 * @param encryptedData - Base64-encoded encrypted data, with IV prepended
 * @param key - The decryption key
 * @returns The decrypted data as a string
 */
export async function decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
  // Convert from base64
  const data = new Uint8Array(
    atob(encryptedData).split('').map(char => char.charCodeAt(0))
  );
  
  // Extract the IV (first 12 bytes)
  const iv = data.slice(0, 12);
  
  // Extract the encrypted data
  const encryptedBuffer = data.slice(12);
  
  // Decrypt the data
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBuffer
  );
  
  // Convert the decrypted buffer to a string
  return new TextDecoder().decode(decryptedBuffer);
}