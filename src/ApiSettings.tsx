import { useEffect, useState } from 'react';
import { Check, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Modal } from './components';
import { clearStoredApiKeys, saveStoredApiKeys, type ApiKeys } from './key-vault';

export function ApiSettings({ keys, saved, loading, error, onChange, onSaved, onClose }: { keys: ApiKeys; saved: boolean; loading: boolean; error: string; onChange: (keys: ApiKeys) => void; onSaved: (saved: boolean) => void; onClose: () => void }) {
  const [remember, setRemember] = useState(saved); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [localError, setLocalError] = useState('');
  useEffect(() => { setRemember(saved); }, [saved]);
  async function save() {
    setBusy(true); setLocalError('');
    try { if (remember) await saveStoredApiKeys(keys); else await clearStoredApiKeys(); onSaved(remember && !!(keys.openRouter.trim() || keys.pexels.trim())); onClose(); }
    catch { setLocalError('本機加密儲存或清除失敗。金鑰仍可在本次分頁使用，請重試或關閉設定繼續。'); }
    finally { setBusy(false); }
  }
  async function clear() {
    setBusy(true); setLocalError('');
    try { await clearStoredApiKeys(); onChange({ openRouter: '', pexels: '' }); onSaved(false); setRemember(false); setMessage('已清除本機與本次分頁的 API Key。'); }
    catch { setLocalError('本機金鑰未能清除，請稍後重試。'); }
    finally { setBusy(false); }
  }
  return <Modal title="API 連線設定" onClose={onClose} busy={busy}><p className="modal-intro">使用你自己的 Key，直接連線至服務平台。可只在本次分頁使用，也可加密保存在此瀏覽器。</p>{loading && <div className="ai-progress" role="status"><LoaderCircle size={16} className="spin"/>正在讀取本機加密金鑰…</div>}
    <label className="settings-field">OpenRouter API Key<input type="password" autoComplete="off" maxLength={4096} disabled={loading || busy} value={keys.openRouter} placeholder="sk-or-v1-…" onChange={e => onChange({ ...keys, openRouter: e.target.value })}/></label><a className="external-link" href="https://openrouter.ai/settings/keys" target="_blank" rel="noreferrer">前往 OpenRouter 取得 Key ↗</a>
    <label className="settings-field">Pexels API Key <span>選填 · 搜尋更多免費圖片</span><input type="password" autoComplete="off" maxLength={4096} disabled={loading || busy} value={keys.pexels} placeholder="輸入你的 Pexels Key" onChange={e => onChange({ ...keys, pexels: e.target.value })}/></label><a className="external-link" href="https://www.pexels.com/api/" target="_blank" rel="noreferrer">Pexels API 與申請資訊 ↗</a>
    <label className="remember-keys"><input type="checkbox" checked={remember} disabled={loading || busy} onChange={e => setRemember(e.target.checked)}/><span>加密儲存在此瀏覽器，下次自動載入<small>勾選後按「完成設定」儲存；取消勾選並完成會移除本機記錄。</small></span></label>
    <div className="key-storage-note"><ShieldCheck size={18}/><p>AES-256-GCM 本機加密，不會放進專案檔或草稿。自動解鎖金鑰也保存在同一瀏覽器，可存取本網站資料的程式仍能解密。清除瀏覽器資料會刪除已存金鑰。</p></div>
    <p className="subtle small">不填 Pexels Key，仍可搜尋免金鑰 CC0 圖庫及上傳本機照片。{saved ? '本機目前有一筆加密記錄。' : '目前沒有已儲存的金鑰。'}</p>
    {(localError || error) && <p className="error-message" role="alert">{localError || error}</p>}{message && <p className="key-success" role="status">{message}</p>}
    <div className="modal-actions"><button className="button" disabled={loading || busy} onClick={() => void clear()}>清除本機金鑰</button><button className="button primary" disabled={loading || busy} onClick={() => void save()}>{busy ? <LoaderCircle size={16} className="spin"/> : <Check size={16}/>}完成設定</button></div>
  </Modal>;
}
