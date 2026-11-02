export const WIDTH = 1080;
export const HEIGHT = 1350;
export type Layout = 'single' | 'stack' | 'side' | 'text';
export type Font = 'serif' | 'sans';
export interface Photo { url: string; name: string; source: string; sourceUrl: string; licenseUrl: string; tags: string; }
export interface ImageSlot { photo: Photo | null; x: number; y: number; zoom: number; }
export interface TextBlock { text: string; size: number; color: string; font: Font; bold: boolean; align: CanvasTextAlign; x: number; y: number; }
export interface Slide { id: string; layout: Layout; images: ImageSlot[]; texts: TextBlock[]; overlay: number; background: string; }
export interface Project { version: 1; title: string; author: string; slides: Slide[]; }
export interface Generated { title: string; slides: { top: string; bottom: string; imageQuery: string; layout: Layout }[]; }
export const layouts: { id: Layout; label: string }[] = [{ id: 'single', label: '全幅單圖' }, { id: 'stack', label: '上下雙圖' }, { id: 'side', label: '左右雙圖' }, { id: 'text', label: '純文字' }];
export const fontFamily = (font: Font) => font === 'serif' ? '"Noto Serif TC", "Songti TC", serif' : '"Noto Sans TC", system-ui, sans-serif';
export const imageRects = (layout: string) => layout === 'stack' ? [{ x: 0, y: 0, w: WIDTH, h: HEIGHT / 2 }, { x: 0, y: HEIGHT / 2, w: WIDTH, h: HEIGHT / 2 }] : layout === 'side' ? [{ x: 0, y: 0, w: WIDTH / 2, h: HEIGHT }, { x: WIDTH / 2, y: 0, w: WIDTH / 2, h: HEIGHT }] : [{ x: 0, y: 0, w: WIDTH, h: HEIGHT }];
export const textRegions = (layout: Layout) => layout === 'text' || layout === 'single' ? [imageRects(layout)[0], imageRects(layout)[0]] : imageRects(layout);
export function newSlide(photos: Photo[] = [], top = '慢慢來，\n也是一種前進', bottom = '讓身體，\n找回自己的節奏', layout: Layout = 'stack'): Slide {
  return { id: crypto.randomUUID(), layout, images: [0, 1].map(i => ({ photo: photos[i] || photos[0] || null, x: 50, y: 50, zoom: 1 })), texts: [top, bottom].map((text, i) => ({ text, size: 54, color: '#ffffff', font: 'serif', bold: true, align: 'center', x: 50, y: layout === 'single' || layout === 'text' ? (i === 0 ? 39 : 62) : 50 })), overlay: 32, background: '#274139' };
}
export function changeLayout(slide: Slide, layout: Layout): Slide {
  return { ...slide, layout, texts: slide.texts.map((t, i) => ({ ...t, x: 50, y: layout === 'single' || layout === 'text' ? (i === 0 ? 39 : 62) : 50 })) };
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
    if (!isObject(s) || !string(s.top, 200) || !string(s.bottom, 200) || !string(s.imageQuery, 100) || !layouts.some(l => l.id === s.layout)) throw new Error('AI 回傳內容或文字格式錯誤。');
  }
  return data as unknown as Generated;
}
export function parseProject(text: string): Project {
  let p: unknown;
  try { p = JSON.parse(text); } catch { throw new Error('專案 JSON 格式錯誤。'); }
  if (!isObject(p) || p.version !== 1 || !string(p.title, 100) || !string(p.author, 40) || !Array.isArray(p.slides) || p.slides.length < 1 || p.slides.length > 20) throw new Error('專案格式錯誤，需包含 1–20 頁。');
  for (const s of p.slides) {
    if (!isObject(s) || typeof s.id !== 'string' || !layouts.some(l => l.id === s.layout) || !bounded(s.overlay, 0, 90) || !color(s.background) || !Array.isArray(s.images) || s.images.length !== 2 || !Array.isArray(s.texts) || s.texts.length !== 2) throw new Error('專案頁面格式錯誤。');
    for (const im of s.images) {
      if (!isObject(im) || !bounded(im.x, 0, 100) || !bounded(im.y, 0, 100) || !bounded(im.zoom, 1, 3)) throw new Error('專案圖片格式錯誤。');
      if (im.photo !== null && (!isObject(im.photo) || !safeImageUrl(im.photo.url) || !string(im.photo.name, 200) || !string(im.photo.tags, 200) || !string(im.photo.source, 50) || !safeLink(im.photo.sourceUrl) || !safeLink(im.photo.licenseUrl))) throw new Error('專案圖片網址或來源格式錯誤。');
    }
    for (const t of s.texts) {
      if (!isObject(t) || !string(t.text, 200) || !bounded(t.size, 24, 100) || !color(t.color) || !['serif', 'sans'].includes(String(t.font)) || typeof t.bold !== 'boolean' || !['left', 'center', 'right'].includes(String(t.align)) || !bounded(t.x, 5, 95) || !bounded(t.y, 5, 95)) throw new Error('專案文字格式錯誤。');
    }
  }
  const clean = p as unknown as Project;
  return { version: 1, title: clean.title, author: clean.author, slides: clean.slides.map(s => ({ ...s, id: crypto.randomUUID() })) };
}
function safeLink(value: unknown) { if (value === '') return true; try { return typeof value === 'string' && new URL(value).protocol === 'https:'; } catch { return false; } }
