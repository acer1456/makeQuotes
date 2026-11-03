import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeviceKey, encryptKeys, decryptKeys } from './key-vault.ts';
const keys = { openRouter: 'test-openrouter-secret', pexels: 'test-pexels-secret' };
test('device key is non-extractable and API keys round trip through authenticated encryption', async () => {
  const key = await createDeviceKey(); assert.equal(key.extractable, false); assert.equal(key.algorithm.name, 'AES-GCM');
  await assert.rejects(crypto.subtle.exportKey('raw', key));
  const encrypted = await encryptKeys(keys, key);
  assert.equal(encrypted.iv.byteLength, 12); assert.ok(!new TextDecoder().decode(encrypted.cipher).includes(keys.openRouter));
  assert.deepEqual(await decryptKeys(encrypted, key), keys);
});
test('each save uses a fresh IV and tampering or another device key cannot decrypt', async () => {
  const key = await createDeviceKey(); const a = await encryptKeys(keys, key); const b = await encryptKeys(keys, key);
  assert.notDeepEqual(new Uint8Array(a.iv), new Uint8Array(b.iv));
  const bytes = new Uint8Array(a.cipher.slice(0)); bytes[0] ^= 1;
  await assert.rejects(decryptKeys({ ...a, cipher: bytes.buffer }, key));
  await assert.rejects(decryptKeys(b, await createDeviceKey()));
});
