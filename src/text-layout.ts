import { captionContent, textRegions, type CaptionStyle, type LanguageMode, type Slide, type TextBlock } from './model';
export type MeasureText = (text: string, style: CaptionStyle) => number;
export interface CaptionRun { style: CaptionStyle; lines: string[]; lineHeight: number; height: number; }
export function quoteFrames(slide: Slide) {
  const regions = textRegions(slide.layout);
  if (!slide.languageMode.includes('-') || (slide.layout !== 'single' && slide.layout !== 'text')) return slide.texts.map((block, i) => ({ block, rect: regions[i] }));
  const full = regions[0];
  const boundary = full.h * Math.max(.2, Math.min(.8, (slide.texts[0].y + slide.texts[1].y) / 200));
  const firstIsUpper = slide.texts[0].y <= slide.texts[1].y;
  return slide.texts.map((block, i) => {
    const upper = (i === 0) === firstIsUpper;
    const rect = { ...full, y: full.y + (upper ? 0 : boundary), h: upper ? boundary : full.h - boundary };
    return { rect, block: { ...block, y: (full.y + full.h * block.y / 100 - rect.y) / rect.h * 100 } };
  });
}
export function wrapText(text: string, width: number, measure: (text: string) => number): string[] {
  if (!text.trim()) return [];
  return text.split('\n').flatMap(paragraph => {
    const lines: string[] = []; let line = '';
    const tokens = paragraph.match(/[A-Za-z0-9]+(?:['’\-][A-Za-z0-9]+)*[.,!?;:]?|[ \t]+|./gu) || [];
    for (let token of tokens) {
      if (!line) token = token.trimStart();
      if (!token) continue;
      if (line && measure(line + token) > width) {
        if (/^[，。！？、；：）』」]/u.test(token)) {
          const chars = Array.from(line); let carry = '';
          while (chars.length && /^[，。！？、；：）』」]/u.test(chars.at(-1)!)) carry = chars.pop()! + carry;
          if (chars.length) carry = chars.pop()! + carry;
          token = carry + token; line = chars.join('');
        }
        if (line) lines.push(line.trimEnd());
        line = '';
      }
      token = line ? token : token.trimStart();
      if (measure(token) > width) {
        for (const char of Array.from(token)) {
          if (line && measure(line + char) > width) { lines.push(line); line = ''; }
          line += char;
        }
      } else line += token;
    }
    lines.push(line.trimEnd()); return lines;
  });
}
export function layoutQuote(block: TextBlock, mode: LanguageMode, rect: { x: number; y: number; w: number; h: number }, measure: MeasureText, maxHeight = rect.h * .78) {
  const content = captionContent(block, mode);
  const mainText = block.quoteStyle === 'marks' && content.main.trim() ? (mode.startsWith('zh') ? `「${content.main}」` : `“${content.main}”`) : content.main;
  const credit = [block.speaker.trim() ? `— ${block.speaker.trim()}` : '', block.source.trim()].filter(Boolean).join(' · ').replace(/\s+/g, ' ');
  const creditStyle: CaptionStyle = { ...(mode.includes('-') ? block.subtitle : block), size: Math.min(26, block.size * .45, block.subtitle.size * .8), bold: false };
  const x = rect.x + rect.w * block.x / 100;
  const padding = rect.w * .07;
  const width = Math.max(80, block.align === 'center' ? Math.min(x - rect.x - padding, rect.x + rect.w - padding - x) * 2 : block.align === 'left' ? rect.x + rect.w - padding - x : x - rect.x - padding);
  const run = (text: string, style: CaptionStyle, scale: number, leading: number, single = block.lineMode === 'single'): CaptionRun | null => {
    if (!text.trim()) return null;
    const scaled = { size: style.size * scale, font: style.font, bold: style.bold, color: style.color };
    const lines = single ? [text] : wrapText(text, width, line => measure(line, scaled));
    return { style: scaled, lines, lineHeight: scaled.size * leading, height: lines.length * scaled.size * leading };
  };
  let main: CaptionRun | null = null; let subtitle: CaptionRun | null = null; let attribution: CaptionRun | null = null; let gap = 0; let attributionGap = 0; let height = 0;
  const entries: [string, CaptionStyle][] = [[mainText, block], [content.subtitle, block.subtitle], [credit, creditStyle]];
  const fittedEntries: [string, CaptionStyle][] = block.lineMode === 'single' ? entries : [[credit, creditStyle]];
  const initialScale = Math.min(1, ...fittedEntries.map(([text, style]) => width / Math.max(1, measure(text, style))));
  for (let step = 0; step <= 99; step++) {
    const scale = initialScale * (1 - step * .01);
    main = run(mainText, block, scale, 1.5); subtitle = run(content.subtitle, block.subtitle, scale, 1.6); attribution = run(credit, creditStyle, scale, 1.4, true);
    gap = main && subtitle ? block.gap * scale : 0;
    attributionGap = attribution && (main || subtitle) ? 18 * scale : 0;
    height = (main?.height || 0) + gap + (subtitle?.height || 0) + attributionGap + (attribution?.height || 0);
    if (height <= maxHeight) break;
  }
  const center = Math.min(rect.y + rect.h - 45 - height / 2, Math.max(rect.y + 45 + height / 2, rect.y + rect.h * block.y / 100));
  const measuredWidth = Math.max(0, ...[main, subtitle, attribution].flatMap(r => r ? r.lines.map(line => measure(line, r.style)) : []));
  return { main, subtitle, attribution, gap, attributionGap, measuredWidth, x, top: center - height / 2, height };
}
