import { WIDTH, HEIGHT, textRegions, type Slide, type TextBlock } from './model';
import type { layoutQuote } from './text-layout';
export interface Rect { x: number; y: number; w: number; h: number; }
export interface Point { x: number; y: number; }
export interface QuoteGeometry { index: number; bounds: Rect; frame: Rect; anchorX: number; centerY: number; mainSize: number | null; subtitleSize: number | null; }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export function quoteGeometry(index: number, block: TextBlock, frame: Rect, quote: ReturnType<typeof layoutQuote>): QuoteGeometry | null {
  if (!quote.height) return null;
  const padX = block.quoteStyle === 'card' ? 28 : 0; const padY = block.quoteStyle === 'card' ? 20 : 0;
  const left = quote.x - (block.align === 'center' ? quote.measuredWidth / 2 : block.align === 'right' ? quote.measuredWidth : 0);
  return { index, bounds: { x: left - padX, y: quote.top - padY, w: quote.measuredWidth + 2 * padX, h: quote.height + 2 * padY }, frame, anchorX: quote.x, centerY: quote.top + quote.height / 2, mainSize: quote.main?.style.size ?? null, subtitleSize: quote.subtitle?.style.size ?? null };
}
export function canvasPoint(client: Point, rect: { left: number; top: number; width: number; height: number }): Point {
  return { x: (client.x - rect.left) * WIDTH / rect.width, y: (client.y - rect.top) * HEIGHT / rect.height };
}
export function moveTextBlock(slide: Slide, geometry: QuoteGeometry, delta: Point): TextBlock {
  const { anchorX, centerY, index } = geometry;
  const region = textRegions(slide.layout)[index];
  const x = anchorX + delta.x;
  const y = centerY + delta.y;
  const percent = (value: number) => Math.round(clamp(value, 5, 95) * 10) / 10;
  return { ...slide.texts[index], x: percent((x - region.x) / region.w * 100), y: percent((y - region.y) / region.h * 100) };
}
export function resizeTextBlock(block: TextBlock, part: 'main' | 'subtitle', size: number): TextBlock {
  if (part === 'subtitle') return { ...block, subtitle: { ...block.subtitle, size: clamp(Math.round(size), 16, Math.min(60, block.size - 1)) } };
  const mainSize = clamp(Math.round(size), 24, 100);
  return { ...block, size: mainSize, subtitle: { ...block.subtitle, size: Math.min(block.subtitle.size, mainSize - 1) } };
}
export function resizeScale(bounds: Rect, start: Point, current: Point, part: 'main' | 'subtitle'): number {
  const pivot = { x: bounds.x + (part === 'subtitle' ? bounds.w : 0), y: bounds.y };
  const dx = start.x - pivot.x; const dy = start.y - pivot.y;
  return Math.max(.1, ((current.x - pivot.x) * dx + (current.y - pivot.y) * dy) / Math.max(1, dx * dx + dy * dy));
}
