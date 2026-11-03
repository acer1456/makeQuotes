import { captionContent, textRegions, type CaptionStyle, type LanguageMode, type Slide, type TextBlock } from './model';
export type MeasureText = (text: string, style: CaptionStyle) => number;
export interface CaptionRun { style: CaptionStyle; lines: string[]; lineHeight: number; height: number; }
export function quoteFrames(slide: Slide) {
  const regions = textRegions(slide.layout);
  return slide.texts.map((block, i) => ({ block, rect: regions[i] }));
}
export function layoutQuote(block: TextBlock, mode: LanguageMode, rect: { x: number; y: number; w: number; h: number }, measure: MeasureText) {
  const content = captionContent(block, mode);
  const mainText = block.quoteStyle === 'marks' && content.main.trim() ? (mode.startsWith('zh') ? `「${content.main}」` : `“${content.main}”`) : content.main;
  const credit = [block.speaker.trim() ? `— ${block.speaker.trim()}` : '', block.source.trim()].filter(Boolean).join(' · ').replace(/\s+/g, ' ');
  const creditStyle: CaptionStyle = { ...(mode.includes('-') ? block.subtitle : block), size: Math.min(26, block.size * .45, block.subtitle.size * .8), bold: false };
  const x = rect.x + rect.w * block.x / 100;
  const run = (text: string, style: CaptionStyle, leading: number, single = block.lineMode === 'single'): CaptionRun | null => {
    if (!text.trim()) return null;
    const lines = single ? [text] : text.split('\n');
    return { style, lines, lineHeight: style.size * leading, height: lines.length * style.size * leading };
  };
  const main = run(mainText, block, 1.5);
  const subtitle = run(content.subtitle, block.subtitle, 1.6);
  const attribution = run(credit, creditStyle, 1.4, true);
  const gap = main && subtitle ? block.gap : 0;
  const attributionGap = attribution && (main || subtitle) ? 18 : 0;
  const height = (main?.height || 0) + gap + (subtitle?.height || 0) + attributionGap + (attribution?.height || 0);
  const center = rect.y + rect.h * block.y / 100;
  const measuredWidth = Math.max(0, ...[main, subtitle, attribution].flatMap(r => r ? r.lines.map(line => measure(line, r.style)) : []));
  return { main, subtitle, attribution, gap, attributionGap, measuredWidth, x, top: center - height / 2, height };
}
