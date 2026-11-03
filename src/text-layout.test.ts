import test from 'node:test';
import assert from 'node:assert/strict';
import { newSlide, captionContent, type CaptionStyle } from './model.ts';
import { layoutQuote, quoteFrames } from './text-layout.ts';
const rect = { x: 0, y: 0, w: 1080, h: 675 };
const measure = (text: string, style: CaptionStyle) => Array.from(text).length * style.size * .6;

test('all four modes select the correct language without mutating saved content', () => {
  const t = newSlide([], '慢慢來', '每一步都算數', 'stack', ['Take your time.', 'Every step counts.']).texts[0];
  assert.deepEqual(captionContent(t, 'zh-en'), { main: '慢慢來', subtitle: 'Take your time.' });
  assert.deepEqual(captionContent(t, 'en-zh'), { main: 'Take your time.', subtitle: '慢慢來' });
  assert.deepEqual(captionContent(t, 'zh'), { main: '慢慢來', subtitle: '' });
  assert.deepEqual(captionContent(t, 'en'), { main: 'Take your time.', subtitle: '' });
  assert.equal(t.en, 'Take your time.');
  assert.equal(t.text, '慢慢來');
});

test('manual line breaks are preserved without width-based wrapping or resizing', () => {
  const t = newSlide([], '慢慢來\n也是前進', '下一段', 'stack', ['A long English sentence that stays on one line.\nNext line.', 'Next.']).texts[0];
  t.lineMode = 'wrap';
  const run = layoutQuote(t, 'zh-en', { ...rect, w: 100, h: 50 }, measure);
  assert.deepEqual(run.main?.lines, ['慢慢來', '也是前進']);
  assert.deepEqual(run.subtitle?.lines, ['A long English sentence that stays on one line.', 'Next line.']);
  assert.equal(run.main?.style.size, t.size); assert.equal(run.subtitle?.style.size, t.subtitle.size);
  assert.ok(run.height > 50); assert.equal(run.top + run.height / 2, 25);
});

test('overlapping quote positions remain exactly as the user set them in every layout', () => {
  for (const layout of ['single', 'text', 'stack', 'side'] as const) {
    const slide = newSlide([], '慢慢來'.repeat(30), '也是前進', layout, ['Take your time.'.repeat(20), 'Next.']);
    slide.texts.forEach(t => { t.x = 95; t.y = 5; });
    const frames = quoteFrames(slide);
    frames.forEach(f => {
      const run = layoutQuote(f.block, slide.languageMode, f.rect, measure);
      assert.equal(run.main?.style.size, f.block.size);
      assert.equal(run.x, f.rect.x + f.rect.w * .95);
      assert.ok(Math.abs(run.top + run.height / 2 - (f.rect.y + f.rect.h * .05)) < .001);
    });
    if (layout === 'single' || layout === 'text') assert.deepEqual(frames[0].rect, frames[1].rect);
  }
});

test('single-language mode leaves no subtitle gap and keeps independently selected fonts', () => {
  const t = newSlide([], '慢慢來', '下一段', 'stack', ['Take your time.', 'Next.']).texts[0];
  t.font = 'serif'; t.subtitle.font = 'sans';
  const both = layoutQuote(t, 'en-zh', rect, measure);
  assert.equal(both.main?.style.font, 'serif'); assert.equal(both.subtitle?.style.font, 'sans');
  const one = layoutQuote(t, 'zh', rect, measure);
  assert.equal(one.subtitle, null); assert.equal(one.gap, 0);
  assert.equal(one.height, one.main?.height);
  const empty = layoutQuote({ ...t, en: '' }, 'en', rect, measure);
  assert.equal(empty.height, 0);
});
