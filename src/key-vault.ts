export interface ApiKeys { openRouter: string; pexels: string; }
export interface EncryptedKeys { version: 1; iv: ArrayBuffer; cipher: ArrayBuffer; }
const additionalData = new TextEncoder().encode('slow-studio/api-keys/v1');
function validateKeys(value: unknown): ApiKeys {
  const keys = value as ApiKeys | null;
  if (!keys || typeof keys.openRouter !== 'string' || typeof keys.pexels !== 'string' || keys.openRouter.length > 4096 || keys.pexels.length > 4096) throw new Error('金鑰格式錯誤。');
  return { openRouter: keys.openRouter.trim(), pexels: keys.pexels.trim() };
}
export async function createDeviceKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encryptKeys(keys: ApiKeys, key: CryptoKey): Promise<EncryptedKeys> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, new TextEncoder().encode(JSON.stringify(validateKeys(keys))));
  return { version: 1, iv: iv.buffer, cipher };
}
export async function decryptKeys(payload: EncryptedKeys, key: CryptoKey): Promise<ApiKeys> {
  if (payload?.version !== 1 || !(payload.iv instanceof ArrayBuffer) || payload.iv.byteLength !== 12 || !(payload.cipher instanceof ArrayBuffer) || payload.cipher.byteLength < 16 || payload.cipher.byteLength > 32768) throw new Error('本機金鑰資料已損壞，請清除後重新儲存。');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: payload.iv, additionalData }, key, payload.cipher);
  return validateKeys(JSON.parse(new TextDecoder().decode(plain)));
}
function openVault(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('slow-studio-keys', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('vault');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('瀏覽器無法開啟本機金鑰儲存空間。'));
  });
}
export async function loadStoredApiKeys(): Promise<ApiKeys | null> {
  const db = await openVault();
  try {
    const record = await new Promise<{ key: CryptoKey; payload: EncryptedKeys } | undefined>((resolve, reject) => { const request = db.transaction('vault').objectStore('vault').get('api-keys'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    if (!record) return null;
    if (record.key?.type !== 'secret' || record.key.extractable || record.key.algorithm.name !== 'AES-GCM') throw new Error('本機加密金鑰格式錯誤。');
    return await decryptKeys(record.payload, record.key);
  } finally { db.close(); }
}
async function writeVault(record: { key: CryptoKey; payload: EncryptedKeys } | null) {
  const db = await openVault();
  try { await new Promise<void>((resolve, reject) => { const tx = db.transaction('vault', 'readwrite'); const store = tx.objectStore('vault'); if (record) store.put(record, 'api-keys'); else store.delete('api-keys'); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); } finally { db.close(); }
}
export async function saveStoredApiKeys(keys: ApiKeys) {
  const valid = validateKeys(keys);
  if (!valid.openRouter && !valid.pexels) return clearStoredApiKeys();
  const key = await createDeviceKey();
  await writeVault({ key, payload: await encryptKeys(valid, key) });
}
export const clearStoredApiKeys = () => writeVault(null);
