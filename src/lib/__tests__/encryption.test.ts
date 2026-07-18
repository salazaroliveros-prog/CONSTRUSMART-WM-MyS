import { describe, it, expect } from 'vitest';
import { encryptSensitive, decryptSensitive, encryptObject, decryptObject, generateEncryptionKey } from '@/lib/encryption';

describe('encryption', () => {
  it('debe encriptar y desencriptar roundtrip con la clave por defecto', async () => {
    const plain = 'numero de tarjeta 1234';
    const encrypted = await encryptSensitive(plain);
    expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    const decrypted = await decryptSensitive(encrypted);
    expect(decrypted).toBe(plain);
  });

  it('debe funcionar sin importar la longitud de RAW_KEY porque deriva SHA-256 (32 bytes)', async () => {
    const text = 'test-corto';
    const encrypted = await encryptSensitive(text);
    expect(await decryptSensitive(encrypted)).toBe(text);
  });

  it('debe encriptar y desencriptar objetos', async () => {
    const obj = { userId: 'u1', data: 'secreto' };
    const encrypted = await encryptObject(obj);
    const decrypted = await decryptObject<typeof obj>(encrypted);
    expect(decrypted).toEqual(obj);
  });

  it('generateEncryptionKey debe retornar hex de 64 caracteres (256 bits)', () => {
    const key = generateEncryptionKey();
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });
});
