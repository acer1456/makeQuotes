import { useEffect, useRef, useState } from 'react';
import { Sparkles, LoaderCircle, ArrowRight, Settings, RefreshCw } from 'lucide-react';
import { Modal } from './components';
import { generateCarousel, loadModels, searchPhotos, type Model } from './api';
import { photos } from './data';
import { newSlide, captionContent, languageModes, type LanguageMode, type Project } from './model';
interface Props { apiKey: string; pexelsKey: string; author: string; languageMode: LanguageMode; onSettings: () => void; onApply: (p: Project) => void; onClose: () => void; }
export function AIStudio({ apiKey, pexelsKey, author, languageMode, onSettings, onApply, onClose }: Props) {
  const [models, setModels] = useState<Model[]>([]); const [selected, setSelected] = useState(''); const [filter, setFilter] = useState(''); const [free, setFree] = useState(false); const [count, setCount] = useState(5); const [prompt, setPrompt] = useState('為在愛情與感情裡反覆內耗、想被理解的人，製作一組有共鳴的 IG 語錄輪播。主題是「真心值得被珍惜，不必靠委屈換來愛」。用簡短的繁體中文搭配自然的英文字幕，每頁主副文字各一句。語氣溫柔真誠，搭配雨天街景、咖啡館、窗邊與城市夜色照片。');
  const [loadingModels, setLoadingModels] = useState(true); const [busy, setBusy] = useState(false); const [status, setStatus] = useState(''); const [error, setError] = useState(''); const [result, setResult] = useState<Project | null>(null); const [note, setNote] = useState('');
  const [mode, setMode] = useState<LanguageMode>(languageMode);
  const controller = useRef<AbortController | null>(null);
  async function refresh() { setLoadingModels(true); setError(''); try { const list = await loadModels(); setModels(list); setSelected(prev => list.some(m => m.id === prev) ? prev : list.find(m => m.free)?.id || list[0]?.id || ''); } catch (e) { setError(`模型清單載入失敗：${(e as Error).message}`); } finally { setLoadingModels(false); } }
  useEffect(() => { void refresh(); return () => controller.current?.abort(); }, []);
  const options = models.filter(m => (!free || m.free) && `${m.name} ${m.id}`.toLowerCase().includes(filter.toLowerCase()));
  async function generate() {
    const model = models.find(m => m.id === selected);
    if (!apiKey.trim()) { setError('請先在 API 設定輸入 OpenRouter API Key。'); return; }
    if (!model) { setError('請選擇一個可用模型。'); return; }
    setBusy(true); setError(''); setResult(null); setNote(''); setStatus('正在構思你的輪播故事…');
    controller.current = new AbortController(); const timeout = setTimeout(() => controller.current?.abort(), 120000);
    try {
      const generated = await generateCarousel(apiKey, model, prompt, count, controller.current.signal);
      setStatus('文字準備好了，正在挑選照片…');
      let missed = 0;
      const slides = [];
      for (const [i, s] of generated.slides.entries()) {
        controller.current.signal.throwIfAborted();
        const terms = s.imageQuery.toLowerCase().split(/\s+/);
        const matched = photos.filter(p => terms.some(t => p.tags.includes(t)));
        let selectedPhotos = matched.length ? matched : [photos[i % photos.length], photos[(i + 1) % photos.length]];
        if (s.layout !== 'text') {
          try { const results = await searchPhotos(s.imageQuery, pexelsKey, controller.current.signal); if (results.length) selectedPhotos = results; else missed++; } catch { controller.current.signal.throwIfAborted(); missed++; }
        }
        const created = newSlide([selectedPhotos[i % selectedPhotos.length], selectedPhotos[(i + 1) % selectedPhotos.length]], s.top.zh, s.bottom.zh, s.layout, [s.top.en, s.bottom.en], mode);
        created.texts = created.texts.map((t, n) => ({ ...t, speaker: (n === 0 ? s.top.speaker : s.bottom.speaker) || '', source: (n === 0 ? s.top.source : s.bottom.source) || '' }));
        slides.push(created);
      }
      setNote(missed ? `${missed} 頁圖庫搜尋未成功，已改用內建授權照片，可自行替換。` : `已依主題從 ${pexelsKey ? 'Pexels' : 'Wikimedia CC0'} 搜尋照片。`);
      setResult({ version: 3, title: generated.title, author, slides });
    } catch (e) { setError((e as Error).name === 'AbortError' ? '生成已取消或超時，原有輪播已保留。' : (e as Error).message); } finally { clearTimeout(timeout); setBusy(false); setStatus(''); controller.current = null; }
  }
  return <Modal title="讓靈感，長成一組輪播" wide onClose={onClose} busy={busy}><div className="ai-intro"><div className="ai-icon"><Sparkles size={25}/></div><p>說說你想傳達的事。<br/><span>AI 幫你整理文字、安排版型，搭配免費圖庫照片。</span></p></div><div className="ai-model-label"><label htmlFor="model">選擇 OpenRouter 模型</label><button className="text-button" onClick={onSettings}><Settings size={14}/>API 設定</button></div><div className="model-filter"><input aria-label="篩選模型" placeholder="搜尋模型名稱或供應商" value={filter} onChange={e => { setFilter(e.target.value); setSelected(''); }}/><label><input type="checkbox" checked={free} onChange={e => { setFree(e.target.checked); if (e.target.checked && !models.find(m => m.id === selected)?.free) setSelected(models.find(m => m.free)?.id || ''); }}/>只看免費</label></div><div className="model-select"><select id="model" value={selected} onChange={e => setSelected(e.target.value)} disabled={loadingModels || busy}>{loadingModels ? <option>正在讀取最新模型…</option> : <><option value="">選擇模型（{options.length}）</option>{options.map(m => <option value={m.id} key={m.id}>{m.name}{m.free ? ' · 免費' : ''}</option>)}</>}</select><button className="icon-button" title="重新載入模型" aria-label="重新載入模型" onClick={() => void refresh()} disabled={loadingModels || busy}><RefreshCw size={16} className={loadingModels ? 'spin' : ''}/></button></div><label className="ai-prompt-label" htmlFor="prompt">你想做什麼樣的輪播？</label><textarea id="prompt" className="prompt-input" rows={5} value={prompt} maxLength={3000} onChange={e => setPrompt(e.target.value)} disabled={busy}/><div className="prompt-suggestions">{['愛情裡的安全感', '感情裡的雙向奔赴', '停止感情內耗', '把喜歡好好告白', '單身也能好好生活', '暗戀裡沒說出口的話', '真心值得被珍惜'].map(t => <button disabled={busy} key={t} onClick={() => setPrompt(`以「${t}」為主題，製作關於愛情、感情與自我感受的 IG 語錄輪播。用簡短的繁體中文搭配自然的英文字幕，每頁主副文字各一句。語氣溫柔真誠、有共鳴，搭配雨天街景、咖啡館、窗邊與城市夜色照片。`)}>{t}<ArrowRight size={12}/></button>)}</div><label className="ai-language-mode">生成後的顯示模式<select aria-label="AI 字幕語言模式" value={mode} disabled={busy} onChange={e => setMode(e.target.value as LanguageMode)}>{languageModes.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select><small>AI 會同時產生中英文，之後仍可切換。</small></label><div className="ai-count"><span>輪播頁數</span><div>{[3, 5, 7, 10].map(n => <button disabled={busy} className={count === n ? 'active' : ''} key={n} onClick={() => setCount(n)}>{n} 頁</button>)}</div></div>{error && <p className="error-message" role="alert">{error}</p>}{busy && <div className="ai-progress" role="status"><LoaderCircle className="spin" size={19}/>{status}<button onClick={() => controller.current?.abort()}>取消</button></div>}{result && <div className="ai-result"><span><Sparkles size={18}/>已產生 {result.slides.length} 頁 · {result.title}</span><p>{captionContent(result.slides[0].texts[0], result.slides[0].languageMode).main}</p><small>{note}</small><button className="button primary" onClick={() => onApply(result)}>套用到編輯器<ArrowRight size={16}/></button><small>將取代目前輪播；可使用復原回到原稿。</small></div>}<footer className="ai-footer"><p>模型費用由你的 OpenRouter 帳戶支付。<br/>AI 內容請先確認，再發布。照片來自圖庫，非 AI 生成。</p><button className="button primary" onClick={() => void generate()} disabled={busy || loadingModels || !prompt.trim()}>{busy ? <LoaderCircle size={17} className="spin"/> : <Sparkles size={17}/>} {result ? '重新生成' : '生成一組輪播'}</button></footer></Modal>;
}
