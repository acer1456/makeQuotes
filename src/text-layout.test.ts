import test from 'node:test';
import assert from 'node:assert/strict';
import { newSlide, captionContent, type CaptionStyle } from './model.ts';
import { wrapText, layoutQuote } from './text-layout.ts';
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

test('English wraps at words and preserves deliberate newlines', () => {
  assert.deepEqual(wrapText('Slow progress is still progress.', 13, s => s.length), ['Slow progress', 'is still', 'progress.']);
  assert.deepEqual(wrapText('Take your time.\nEvery step counts.', 100, s => s.length), ['Take your time.', 'Every step counts.']);
  assert.deepEqual(wrapText('abcdefghijkl', 5, s => s.length), ['abcde', 'fghij', 'kl']);
});

test('CJK punctuation stays with the preceding character when wrapping', () => {
  const lines = wrapText('慢慢來，也是前進。', 3, s => s.length);
  assert.ok(lines.every(line => !/^[，。！？]/.test(line)));
  assert.equal(lines.join(''), '慢慢來，也是前進。');
});

test('bilingual runs fit together inside a region and subtitles stay smaller', () => {
  const t = newSlide([], '慢慢來'.repeat(35), '下一段', 'stack', ['Every small step counts. '.repeat(10), 'Next.']).texts[0];
  const runs = layoutQuote(t, 'zh-en', rect, measure);
  assert.ok(runs.main && runs.subtitle);
  assert.ok(runs.main.style.size > runs.subtitle.style.size);
  assert.ok(runs.height <= rect.h * .78 + .1);
  assert.ok(runs.top >= 0 && runs.top + runs.height <= rect.h);
  assert.ok(runs.main.height + runs.gap + runs.subtitle.height <= runs.height + .1);
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
