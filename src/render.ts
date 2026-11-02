import { WIDTH, HEIGHT, fontFamily, imageRects, textRegions, type Slide, type TextBlock } from './model';
import { photoUrl } from './assets';
const imageCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = window.setTimeout(() => { img.src = ''; reject(new Error('圖片載入逾時')); }, 20000);
    img.onload = () => { clearTimeout(timeout); resolve(img); };
    img.onerror = () => { clearTimeout(timeout); reject(new Error('圖片無法載入，請更換圖片或上傳本機檔案。')); };
    img.src = photoUrl(url);
  }).catch(e => { imageCache.delete(url); throw e; });
  if (imageCache.size >= 48) imageCache.delete(imageCache.keys().next().value!);
  imageCache.set(url, promise);
  return promise;
}
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  return text.split('\n').flatMap(paragraph => {
    const lines: string[] = []; let line = '';
    for (const char of Array.from(paragraph)) {
      if (line && ctx.measureText(line + char).width > width) { lines.push(line); line = ''; }
      line += char;
    }
    lines.push(line); return lines;
  });
}
function drawText(ctx: CanvasRenderingContext2D, block: TextBlock, r: { x: number; y: number; w: number; h: number }) {
  if (!block.text.trim()) return;
  const padding = r.w * .07;
  const anchorX = r.x + r.w * block.x / 100;
  const maxWidth = Math.max(80, block.align === 'center' ? Math.min(anchorX - r.x - padding, r.x + r.w - padding - anchorX) * 2 : block.align === 'left' ? r.x + r.w - padding - anchorX : anchorX - r.x - padding);
  let size = block.size;
  let lines: string[] = [];
  do { ctx.font = `${block.bold ? 700 : 400} ${size}px ${fontFamily(block.font)}`; lines = wrap(ctx, block.text, maxWidth); if (lines.length * size * 1.5 <= r.h * .78) break; size -= 1; } while (size > 16);
  const total = lines.length * size * 1.5;
  const targetY = r.y + r.h * block.y / 100;
  const y = Math.min(r.y + r.h - 45 - total / 2, Math.max(r.y + 45 + total / 2, targetY));
  ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
  ctx.textBaseline = 'middle'; ctx.textAlign = block.align; ctx.fillStyle = block.color;
  ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 9; ctx.shadowOffsetY = 2;
  lines.forEach((line, i) => ctx.fillText(line, anchorX, y - total / 2 + (i + .5) * size * 1.5));
  ctx.restore();
}
export async function renderSlide(canvas: HTMLCanvasElement, slide: Slide, author: string, width = WIDTH, strict = false): Promise<void> {
  const rects = imageRects(slide.layout);
  const [loaded] = await Promise.all([
    Promise.all(rects.map(async (_, i) => { const p = slide.images[i]?.photo; if (slide.layout === 'text' || !p) return null; try { return await loadImage(p.url); } catch (e) { if (strict) throw e; return null; } })),
    Promise.all(slide.texts.map(t => document.fonts.load(`${t.bold ? 700 : 400} ${t.size}px ${fontFamily(t.font)}`, t.text || '字').catch(() => []))),
  ]);
  // Draw to a private buffer so stale asynchronous renders cannot partially paint a newer preview.
  const buffer = document.createElement('canvas'); buffer.width = width; buffer.height = width * HEIGHT / WIDTH;
  const ctx = buffer.getContext('2d')!; ctx.scale(width / WIDTH, width / WIDTH);
  ctx.fillStyle = slide.background; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (slide.layout !== 'text') rects.forEach((r, i) => {
    const image = loaded[i];
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    if (image) {
      const slot = slide.images[i]; const scale = Math.max(r.w / image.naturalWidth, r.h / image.naturalHeight) * slot.zoom;
      const w = image.naturalWidth * scale; const h = image.naturalHeight * scale;
      ctx.drawImage(image, r.x - (w - r.w) * slot.x / 100, r.y - (h - r.h) * slot.y / 100, w, h);
    } else {
      ctx.fillStyle = '#354d43'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#a6b5ad'; ctx.textAlign = 'center'; ctx.font = '28px sans-serif'; ctx.fillText(slide.images[i]?.photo ? '圖片無法載入 · 請更換' : '加入你的照片', r.x + r.w / 2, r.y + r.h - 70);
    }
    ctx.fillStyle = `rgba(0,0,0,${slide.overlay / 100})`; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.restore();
  });
  slide.texts.forEach((t, i) => drawText(ctx, t, textRegions(slide.layout)[i]));
  if (author) { ctx.font = `400 27px ${fontFamily('serif')}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = slide.texts[1].color; ctx.shadowColor = '#0008'; ctx.shadowBlur = 8; ctx.fillText(author, WIDTH / 2, HEIGHT - 55, WIDTH * .8); }
  canvas.width = buffer.width; canvas.height = buffer.height; canvas.getContext('2d')!.drawImage(buffer, 0, 0);
}
export async function slideBlob(slide: Slide, author: string): Promise<Blob> {
  const canvas = document.createElement('canvas'); await renderSlide(canvas, slide, author, WIDTH, true);
  return new Promise((resolve, reject) => { try { canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('圖片匯出失敗。')), 'image/png'); } catch { reject(new Error('此圖片不允許跨來源匯出，請下載原圖後使用本機上傳。')); } });
}
export function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export async function localPhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('請選擇 JPG、PNG 或 WebP 圖片。');
  if (file.size > 10 * 1024 * 1024) throw new Error('圖片需小於 10 MB。');
  const url = URL.createObjectURL(file);
  try { const image = await loadImage(url); const scale = Math.min(1, 2000 / Math.max(image.width, image.height)); const c = document.createElement('canvas'); c.width = image.width * scale; c.height = image.height * scale; c.getContext('2d')!.drawImage(image, 0, 0, c.width, c.height); return c.toDataURL('image/png'); } finally { URL.revokeObjectURL(url); imageCache.delete(url); }
}
