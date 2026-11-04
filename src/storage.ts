import { parseProject, type Project } from './model';
const lastModelKey = 'slow-studio:last-openrouter-model';
export function loadLastModel(): string {
  try { return localStorage.getItem(lastModelKey) || ''; } catch { return ''; }
}
export function saveLastModel(id: string) {
  if (!id) return;
  try { localStorage.setItem(lastModelKey, id); } catch { /* Editing still works when browser storage is unavailable. */ }
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => { const req = indexedDB.open('slow-studio', 1); req.onupgradeneeded = () => req.result.createObjectStore('draft'); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
}
export async function loadDraft(): Promise<Project | null> {
  const db = await database();
  try { const raw = await new Promise<unknown>((resolve, reject) => { const req = db.transaction('draft').objectStore('draft').get('project'); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); return raw ? parseProject(JSON.stringify(raw)) : null; } finally { db.close(); }
}
export async function saveDraft(project: Project) {
  const db = await database();
  try { await new Promise<void>((resolve, reject) => { const tx = db.transaction('draft', 'readwrite'); tx.objectStore('draft').put(project, 'project'); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); } finally { db.close(); }
}
