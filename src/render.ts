import { WIDTH, HEIGHT, fontFamily, imageRects, captionContent, type CaptionStyle, type LanguageMode, type Slide, type TextBlock } from './model';
import { photoUrl } from './assets';
import { layoutQuote, quoteFrames } from './text-layout';
import { quoteGeometry, type QuoteGeometry } from './canvas-interaction';
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
function drawText(ctx: CanvasRenderingContext2D, block: TextBlock, r: { x: number; y: number; w: number; h: number }, mode: LanguageMode) {
  const quote = layoutQuote(block, mode, r, (text, style) => { ctx.font = `${style.bold ? 700 : 400} ${style.size}px ${fontFamily(style.font)}`; return ctx.measureText(text).width; });
  ctx.save();
  if (block.quoteStyle === 'card' && quote.height) {
    const left = block.align === 'center' ? quote.x - quote.measuredWidth / 2 : block.align === 'right' ? quote.x - quote.measuredWidth : quote.x;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(left - 28, quote.top - 20, quote.measuredWidth + 56, quote.height + 40);
    ctx.fillStyle = block.color; ctx.fillRect(left - 28, quote.top - 20, 4, quote.height + 40);
  }
  ctx.textBaseline = 'middle'; ctx.textAlign = block.align;
  ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 9; ctx.shadowOffsetY = 2;
  let top = quote.top;
  for (const run of [quote.main, quote.subtitle, quote.attribution]) {
    if (!run) continue;
    if (run === quote.attribution) top += quote.attributionGap;
    ctx.font = `${run.style.bold ? 700 : 400} ${run.style.size}px ${fontFamily(run.style.font)}`; ctx.fillStyle = run.style.color;
    run.lines.forEach((line, n) => ctx.fillText(line, quote.x, top + (n + .5) * run.lineHeight));
    top += run.height + (run === quote.main ? quote.gap : 0);
  }
  ctx.restore();
  return quote;
}
export async function renderSlide(canvas: HTMLCanvasElement, slide: Slide, author: string, width = WIDTH, strict = false): Promise<QuoteGeometry[]> {
  const rects = imageRects(slide.layout);
  const [loaded] = await Promise.all([
    Promise.all(rects.map(async (_, i) => { const p = slide.images[i]?.photo; if (slide.layout === 'text' || !p) return null; try { return await loadImage(p.url); } catch (e) { if (strict) throw e; return null; } })),
    Promise.all(slide.texts.flatMap(t => { const content = captionContent(t, slide.languageMode); const credit = `${t.speaker} ${t.source}`; const loadFont = (text: string, style: CaptionStyle) => document.fonts.load(`${style.bold ? 700 : 400} ${style.size}px ${fontFamily(style.font)}`, text || '字').catch(() => []); return [loadFont(content.main + (t.quoteStyle === 'marks' ? '「」“”' : ''), t), loadFont(content.subtitle, t.subtitle), ...(credit.trim() ? [loadFont(credit, { ...t, bold: false }), loadFont(credit, { ...t.subtitle, bold: false })] : [])]; })),
    document.fonts.load(`400 27px ${fontFamily('serif')}`, author || '字').catch(() => []),
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
  const geometries = quoteFrames(slide).flatMap((frame, i) => {
    const geometry = quoteGeometry(i, frame.block, frame.rect, drawText(ctx, frame.block, frame.rect, slide.languageMode));
    return geometry ? [geometry] : [];
  });
  if (author) { ctx.font = `400 27px ${fontFamily('serif')}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = slide.texts[1].color; ctx.shadowColor = '#0008'; ctx.shadowBlur = 8; ctx.fillText(author, WIDTH / 2, HEIGHT - 55); }
  canvas.width = buffer.width; canvas.height = buffer.height; canvas.getContext('2d')!.drawImage(buffer, 0, 0);
  return geometries;
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
