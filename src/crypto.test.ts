import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './crypto';

describe('crypto utilities', () => {
  const secret = 'my-super-secret-key';
  const data = JSON.stringify({ message: 'hello world', stations: ['MNL', 'NRT'] });

  it('should encrypt and decrypt data correctly', async () => {
    const encrypted = await encrypt(data, secret);
    expect(encrypted.buffer).toBeDefined();
    expect(encrypted.salt).toHaveLength(16);
    expect(encrypted.iv).toHaveLength(12);

    const decrypted = await decrypt(encrypted.buffer, secret, encrypted.salt, encrypted.iv);
    expect(decrypted).toBe(data);
  });

  it('should fail to decrypt with wrong secret', async () => {
    const encrypted = await encrypt(data, secret);
    await expect(decrypt(encrypted.buffer, 'wrong-secret', encrypted.salt, encrypted.iv))
      .rejects.toThrow();
  });

  it('should produce different ciphertexts for same data (due to random IV/salt)', async () => {
     const enc1 = await encrypt(data, secret);
     const enc2 = await encrypt(data, secret);
     
     // Buffers should be different
     const buf1 = new Uint8Array(enc1.buffer);
     const buf2 = new Uint8Array(enc2.buffer);
     
     // It is extremely unlikely they are identical
     let isIdentical = buf1.length === buf2.length;
     if (isIdentical) {
       isIdentical = buf1.every((val, i) => val === buf2[i]);
     }
     expect(isIdentical).toBe(false);
  });
});
