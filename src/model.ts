import { isFont, type Font } from './fonts';
export { fonts, fontFamily } from './fonts';
export type { Font } from './fonts';
export const WIDTH = 1080;
export const HEIGHT = 1350;
export type Layout = 'single' | 'stack' | 'side' | 'text';
export type LanguageMode = 'zh-en' | 'en-zh' | 'zh' | 'en';
export const languageModes: { id: LanguageMode; label: string }[] = [{ id: 'zh-en', label: '中主・英副' }, { id: 'en-zh', label: '英主・中副' }, { id: 'zh', label: '僅中文' }, { id: 'en', label: '僅英文' }];
export interface Photo { url: string; name: string; source: string; sourceUrl: string; licenseUrl: string; tags: string; }
export interface ImageSlot { photo: Photo | null; x: number; y: number; zoom: number; }
export interface CaptionStyle { size: number; color: string; font: Font; bold: boolean; }
export interface TextBlock extends CaptionStyle { text: string; en: string; subtitle: CaptionStyle; gap: number; align: CanvasTextAlign; x: number; y: number; lineMode: 'single' | 'wrap'; quoteStyle: 'plain' | 'marks' | 'card'; speaker: string; source: string; }
export interface Slide { id: string; layout: Layout; languageMode: LanguageMode; images: ImageSlot[]; texts: TextBlock[]; overlay: number; background: string; }
export interface Project { version: 3; title: string; author: string; slides: Slide[]; }
export interface BilingualQuote { zh: string; en: string; speaker?: string; source?: string; }
export interface Generated { title: string; slides: { top: BilingualQuote; bottom: BilingualQuote; imageQuery: string; layout: Layout }[]; }
export const layouts: { id: Layout; label: string }[] = [{ id: 'single', label: '全幅單圖' }, { id: 'stack', label: '上下雙圖' }, { id: 'side', label: '左右雙圖' }, { id: 'text', label: '純文字' }];
export const imageRects = (layout: string) => layout === 'stack' ? [{ x: 0, y: 0, w: WIDTH, h: HEIGHT / 2 }, { x: 0, y: HEIGHT / 2, w: WIDTH, h: HEIGHT / 2 }] : layout === 'side' ? [{ x: 0, y: 0, w: WIDTH / 2, h: HEIGHT }, { x: WIDTH / 2, y: 0, w: WIDTH / 2, h: HEIGHT }] : [{ x: 0, y: 0, w: WIDTH, h: HEIGHT }];
export const textRegions = (layout: Layout) => layout === 'text' || layout === 'single' ? [imageRects(layout)[0], imageRects(layout)[0]] : imageRects(layout);
export function newSlide(photos: Photo[] = [], top = '慢慢來，也是一種前進', bottom = '讓身體，找回自己的節奏', layout: Layout = 'stack', english: [string, string] = ['', ''], languageMode: LanguageMode = 'zh-en'): Slide {
  return { id: crypto.randomUUID(), layout, languageMode, images: [0, 1].map(i => ({ photo: photos[i] || photos[0] || null, x: 50, y: 50, zoom: 1 })), texts: [top, bottom].map((text, i) => ({ text, en: english[i], size: 56, color: '#ffffff', font: 'sans', bold: true, subtitle: { size: 34, color: '#ffffff', font: 'sans', bold: false }, gap: 26, align: 'center', x: 50, y: layout === 'single' || layout === 'text' ? (i === 0 ? 34 : 68) : 50, lineMode: 'single', quoteStyle: 'plain', speaker: '', source: '' })), overlay: 32, background: '#274139' };
}
export const singleLine = (text: string, english: boolean) => english ? text.replace(/\s+/g, ' ').trim() : text.replace(/\s*\r?\n\s*/g, '').trim();
export function captionContent(block: TextBlock, mode: LanguageMode) {
  const zh = block.lineMode === 'single' ? singleLine(block.text, false) : block.text;
  const en = block.lineMode === 'single' ? singleLine(block.en, true) : block.en;
  return { main: mode.startsWith('zh') ? zh : en, subtitle: mode === 'zh-en' ? en : mode === 'en-zh' ? zh : '' };
}
export function changeLayout(slide: Slide, layout: Layout): Slide {
  return { ...slide, layout, texts: slide.texts.map((t, i) => ({ ...t, x: 50, y: layout === 'single' || layout === 'text' ? (i === 0 ? 34 : 68) : 50 })) };
}
export function safeImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return true;
  if (/^\/photos\/[a-z0-9-]+\.jpg$/.test(value)) return true;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
}
const isObject = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const bounded = (x: unknown, min: number, max: number) => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
const color = (x: unknown) => typeof x === 'string' && /^#[a-f\d]{6}$/i.test(x);
const string = (x: unknown, max: number) => typeof x === 'string' && x.length <= max;
export function parseGenerated(text: string, count: number): Generated {
  let data: unknown;
  try { data = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')); } catch { throw new Error('AI 回傳格式錯誤，請重新生成或更換模型。'); }
  if (!isObject(data) || !string(data.title, 100) || !Array.isArray(data.slides)) throw new Error('AI 回傳內容不完整。');
  if (data.slides.length !== count) throw new Error('AI 回傳頁數不符，請重新生成。');
  for (const s of data.slides) {
    if (!isObject(s) || ![s.top, s.bottom].every(q => isObject(q) && string(q.zh, 200) && (q.zh as string).trim() && string(q.en, 300) && (q.en as string).trim()) || !string(s.imageQuery, 100) || !layouts.some(l => l.id === s.layout)) throw new Error('AI 回傳中英對照內容不完整，請重新生成。');
    if (![s.top, s.bottom].every(q => isObject(q) && (q.speaker === undefined || string(q.speaker, 80)) && (q.source === undefined || string(q.source, 120)))) throw new Error('AI 回傳引用來源格式錯誤。');
  }
  return data as unknown as Generated;
}
export function parseProject(text: string): Project {
  let p: unknown;
  try { p = JSON.parse(text); } catch { throw new Error('專案 JSON 格式錯誤。'); }
  if (!isObject(p) || ![1, 2, 3].includes(Number(p.version)) || typeof p.version !== 'number' || !string(p.title, 100) || !string(p.author, 40) || !Array.isArray(p.slides) || p.slides.length < 1 || p.slides.length > 20) throw new Error('專案格式錯誤，需包含 1–20 頁。');
  for (const s of p.slides) {
    if (!isObject(s) || typeof s.id !== 'string' || !layouts.some(l => l.id === s.layout) || !bounded(s.overlay, 0, 90) || !color(s.background) || !Array.isArray(s.images) || s.images.length !== 2 || !Array.isArray(s.texts) || s.texts.length !== 2) throw new Error('專案頁面格式錯誤。');
    if (p.version >= 2 && !languageModes.some(m => m.id === s.languageMode)) throw new Error('專案語言模式格式錯誤。');
    for (const im of s.images) {
      if (!isObject(im) || !bounded(im.x, 0, 100) || !bounded(im.y, 0, 100) || !bounded(im.zoom, 1, 3)) throw new Error('專案圖片格式錯誤。');
      if (im.photo !== null && (!isObject(im.photo) || !safeImageUrl(im.photo.url) || !string(im.photo.name, 200) || !string(im.photo.tags, 200) || !string(im.photo.source, 50) || !safeLink(im.photo.sourceUrl) || !safeLink(im.photo.licenseUrl))) throw new Error('專案圖片網址或來源格式錯誤。');
    }
    for (const t of s.texts) {
      if (!isObject(t) || !string(t.text, 200) || !bounded(t.size, 24, 100) || !color(t.color) || !isFont(t.font) || typeof t.bold !== 'boolean' || !['left', 'center', 'right'].includes(String(t.align)) || !bounded(t.x, 5, 95) || !bounded(t.y, 5, 95)) throw new Error('專案文字格式錯誤。');
      if (p.version >= 2 && (!string(t.en, 300) || !bounded(t.gap, 0, 80) || !isObject(t.subtitle) || !bounded(t.subtitle.size, 16, 60) || (t.subtitle.size as number) >= (t.size as number) || !color(t.subtitle.color) || !isFont(t.subtitle.font) || typeof t.subtitle.bold !== 'boolean')) throw new Error('專案副文字格式錯誤。');
      if (p.version === 3 && (!['single', 'wrap'].includes(String(t.lineMode)) || !['plain', 'marks', 'card'].includes(String(t.quoteStyle)) || !string(t.speaker, 80) || !string(t.source, 120))) throw new Error('專案引用樣式格式錯誤。');
    }
    if (p.version === 1) {
      s.languageMode = 'zh';
      s.texts = s.texts.map(t => ({ ...t, en: '', gap: 26, subtitle: { size: Math.max(16, Math.min(34, Math.round((t.size as number) * .6))), color: t.color, font: 'sans', bold: false } }));
    }
    if (p.version < 3) s.texts = (s.texts as Record<string, unknown>[]).map(t => ({ ...t, lineMode: 'wrap', quoteStyle: 'plain', speaker: '', source: '' }));
  }
  const clean = p as unknown as Project;
  return { version: 3, title: clean.title, author: clean.author, slides: clean.slides.map(s => ({ ...s, id: crypto.randomUUID() })) };
}
function safeLink(value: unknown) { if (value === '') return true; try { return typeof value === 'string' && new URL(value).protocol === 'https:'; } catch { return false; } }
