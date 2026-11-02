import { captionContent, type CaptionStyle, type LanguageMode, type TextBlock } from './model';
export type MeasureText = (text: string, style: CaptionStyle) => number;
export interface CaptionRun { style: CaptionStyle; lines: string[]; lineHeight: number; height: number; }
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
          const chars = Array.from(line); token = chars.pop()! + token; line = chars.join('');
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
  const x = rect.x + rect.w * block.x / 100;
  const padding = rect.w * .07;
  const width = Math.max(80, block.align === 'center' ? Math.min(x - rect.x - padding, rect.x + rect.w - padding - x) * 2 : block.align === 'left' ? rect.x + rect.w - padding - x : x - rect.x - padding);
  const run = (text: string, style: CaptionStyle, scale: number, leading: number): CaptionRun | null => {
    if (!text.trim()) return null;
    const scaled = { size: style.size * scale, font: style.font, bold: style.bold, color: style.color };
    const lines = wrapText(text, width, line => measure(line, scaled));
    return { style: scaled, lines, lineHeight: scaled.size * leading, height: lines.length * scaled.size * leading };
  };
  let main: CaptionRun | null = null; let subtitle: CaptionRun | null = null; let gap = 0; let height = 0;
  for (let step = 0; step <= 99; step++) {
    const scale = 1 - step * .01;
    main = run(content.main, block, scale, 1.5); subtitle = run(content.subtitle, block.subtitle, scale, 1.6);
    gap = main && subtitle ? block.gap * scale : 0;
    height = (main?.height || 0) + gap + (subtitle?.height || 0);
    if (height <= maxHeight) break;
  }
  const center = Math.min(rect.y + rect.h - 45 - height / 2, Math.max(rect.y + 45 + height / 2, rect.y + rect.h * block.y / 100));
  return { main, subtitle, gap, x, top: center - height / 2, height };
}
