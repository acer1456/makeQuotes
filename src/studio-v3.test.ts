import test from 'node:test';
import assert from 'node:assert/strict';
import { newSlide, parseProject, fonts } from './model.ts';
import { layoutQuote } from './text-layout.ts';
const measure = (text: string, style: { size: number }) => Array.from(text).length * style.size * .6;
test('single-line quotes retain chosen font sizes even when wider than the canvas', () => {
  const slide = newSlide([], '慢慢來，也是前進'.repeat(6), '下一段', 'stack', ['Every small step is still progress. '.repeat(4), 'Next.']);
  assert.equal(slide.texts[0].lineMode, 'single');
  const run = layoutQuote(slide.texts[0], 'zh-en', { x: 0, y: 0, w: 540, h: 1350 }, measure);
  assert.equal(run.main?.lines.length, 1); assert.equal(run.subtitle?.lines.length, 1);
  assert.equal(run.main!.style.size, slide.texts[0].size);
  assert.ok(run.measuredWidth > 540);
  assert.equal(run.subtitle!.style.size, slide.texts[0].subtitle.size);
  assert.ok(run.main!.style.size > run.subtitle!.style.size);
});
test('manual wrapping remains available and quote attribution participates in layout', () => {
  const t = newSlide([], '慢慢來\n也是前進', '下一段', 'stack', ['Take your time.\nEvery step counts.', 'Next.']).texts[0];
  t.lineMode = 'wrap'; t.quoteStyle = 'marks'; t.speaker = '作者'; t.source = '一本書';
  const run = layoutQuote(t, 'zh-en', { x: 0, y: 0, w: 1080, h: 675 }, measure);
  assert.equal(run.main?.lines.length, 2); assert.ok(run.main?.lines[0].startsWith('「'));
  assert.ok(run.attribution?.lines[0].includes('作者')); assert.ok(run.attribution?.lines[0].includes('一本書'));
  assert.ok(run.attribution!.style.size < run.main!.style.size);
});
test('long quote sources retain their size and may extend beyond the canvas', () => {
  const t = newSlide().texts[0]; t.lineMode = 'wrap'; t.speaker = 'Alex'; t.source = 'A very long source title '.repeat(5);
  const run = layoutQuote(t, 'zh-en', { x: 0, y: 0, w: 540, h: 675 }, measure);
  assert.ok(run.measuredWidth > 540);
  assert.equal(run.attribution!.style.size, Math.min(26, t.size * .45, t.subtitle.size * .8));
});
test('project round trip preserves English fonts, quote styles, credits and line modes', () => {
  const slide = newSlide(); slide.texts[0].subtitle.font = 'lora'; slide.texts[0].quoteStyle = 'card'; slide.texts[0].speaker = 'Alex'; slide.texts[0].source = 'A book';
  const p = parseProject(JSON.stringify({ version: 3, title: 'project', author: '@test', slides: [slide], apiKey: 'do-not-export' }));
  assert.equal(p.version, 3); assert.equal(p.slides[0].texts[0].subtitle.font, 'lora');
  assert.equal(p.slides[0].texts[0].quoteStyle, 'card'); assert.equal(p.slides[0].texts[0].source, 'A book');
  assert.equal(p.slides[0].texts[0].lineMode, 'single'); assert.ok(!JSON.stringify(p).includes('do-not-export'));
});
test('version two imports preserve old wrapping and do not invent quote sources', () => {
  const slide = newSlide();
  const p = parseProject(JSON.stringify({ version: 2, title: 'old', author: '', slides: [slide] }));
  assert.equal(p.version, 3); assert.equal(p.slides[0].texts[0].lineMode, 'wrap');
  assert.equal(p.slides[0].texts[0].quoteStyle, 'plain'); assert.equal(p.slides[0].texts[0].speaker, '');
});
test('font catalog offers licensed Chinese and English alternatives and rejects unknown fonts', () => {
  assert.ok(fonts.length >= 10); assert.ok(fonts.some(f => f.id === 'lora')); assert.ok(fonts.some(f => f.id === 'iansui'));
  const slide = newSlide(); slide.texts[0].font = 'untrusted-font' as never;
  assert.throws(() => parseProject(JSON.stringify({ version: 3, title: 'x', author: '', slides: [slide] })), /格式/);
});
