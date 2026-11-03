import test from 'node:test';
import assert from 'node:assert/strict';
import { newSlide, type CaptionStyle } from './model.ts';
import { quoteFrames, layoutQuote } from './text-layout.ts';
import { canvasPoint, moveTextBlock, quoteGeometry, resizeScale, resizeTextBlock } from './canvas-interaction.ts';
const measure = (text: string, style: CaptionStyle) => text.length * style.size * .5;
test('pointer coordinates account for canvas zoom and viewport offset', () => {
  assert.deepEqual(canvasPoint({ x: 112, y: 122 }, { left: 100, top: 50, width: 324, height: 405 }), { x: 40, y: 240 });
});
test('moving uses the rendered anchor and saves valid per-region percentages for every layout', () => {
  for (const layout of ['single', 'stack', 'side', 'text'] as const) {
    const s = newSlide([], '短句', '短句', layout, ['Short.', 'Short.']);
    const frame = quoteFrames(s)[1]; const quote = layoutQuote(frame.block, s.languageMode, frame.rect, measure);
    const geometry = quoteGeometry(1, frame.block, frame.rect, quote); assert.ok(geometry);
    const moved = moveTextBlock(s, geometry, { x: 30, y: 20 });
    assert.ok(moved.x > s.texts[1].x); assert.ok(moved.y > s.texts[1].y);
    const edge = moveTextBlock(s, geometry, { x: 10000, y: -10000 });
    assert.ok(edge.x >= 5 && edge.x <= 95 && edge.y >= 5 && edge.y <= 95);
    assert.equal(s.texts[1].x, 50);
  }
});
test('font resizing preserves both languages and enforces main/subtitle size hierarchy', () => {
  const t = newSlide([], '中文', '下一段', 'stack', ['English.', 'Next.']).texts[0];
  assert.equal(resizeTextBlock(t, 'main', 70).subtitle.size, 34);
  const small = resizeTextBlock(t, 'main', 10); assert.equal(small.size, 24); assert.equal(small.subtitle.size, 23);
  const sub = resizeTextBlock(t, 'subtitle', 100); assert.equal(sub.size, 56); assert.equal(sub.subtitle.size, 55);
  assert.equal(sub.text, '中文'); assert.equal(sub.en, 'English.'); assert.equal(t.size, 56);
});
test('an oversized quote card moves freely without fitting its bounds inside the canvas', () => {
  const s = newSlide([], '這是一句超出畫布但保留設定字級的很長很長很長很長的語錄', '下一段', 'stack', ['A long quote.', 'Next.']);
  s.texts[0].quoteStyle = 'card';
  const frame = quoteFrames(s)[0];
  const geometry = quoteGeometry(0, frame.block, frame.rect, layoutQuote(frame.block, s.languageMode, frame.rect, measure)); assert.ok(geometry);
  const moved = moveTextBlock(s, geometry, { x: 0, y: 20 });
  assert.equal(moved.x, s.texts[0].x); assert.ok(moved.y > s.texts[0].y);
  const horizontal = moveTextBlock(s, geometry, { x: -100, y: 0 });
  assert.ok(horizontal.x < s.texts[0].x); assert.equal(horizontal.y, s.texts[0].y);
});
test('opposite-corner dragging increases either font and crossing the pivot never reverses growth', () => {
  const bounds = { x: 100, y: 100, w: 200, h: 100 };
  assert.ok(resizeScale(bounds, { x: 300, y: 200 }, { x: 340, y: 220 }, 'main') > 1);
  assert.ok(resizeScale(bounds, { x: 100, y: 200 }, { x: 60, y: 220 }, 'subtitle') > 1);
  assert.equal(resizeScale(bounds, { x: 300, y: 200 }, { x: 0, y: 0 }, 'main'), .1);
});
