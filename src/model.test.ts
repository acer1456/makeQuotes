import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGenerated, parseProject, imageRects, newSlide, type Project } from './model.ts';

test('AI output accepts fenced JSON and rejects incorrect slide counts', () => {
  const slide = { top: '慢慢來', bottom: '也是一種前進', imageQuery: 'forest', layout: 'stack' };
  const text = '```json\n' + JSON.stringify({ title: '慢慢來', slides: [slide, slide] }) + '\n```';
  const result = parseGenerated(text, 2) as { slides: unknown[] };
  assert.equal(result.slides.length, 2);
  assert.throws(() => parseGenerated(text, 3), /頁數/);
  assert.throws(() => parseGenerated('{"slides":[{"top":42}]}', 1), /內容|文字/);
});

test('import refuses executable image URLs and malformed projects', () => {
  assert.throws(() => parseProject('{"version":1,"title":"x","slides":[{"images":[{"url":"javascript:alert(1)"}]}]}'), /專案|圖片|格式/);
  assert.throws(() => parseProject('{}'), /專案|格式/);
});

test('split layouts cover exactly the 1080 by 1350 canvas', () => {
  assert.deepEqual(imageRects('stack'), [{ x: 0, y: 0, w: 1080, h: 675 }, { x: 0, y: 675, w: 1080, h: 675 }]);
  assert.deepEqual(imageRects('side'), [{ x: 0, y: 0, w: 540, h: 1350 }, { x: 540, y: 0, w: 540, h: 1350 }]);
});

test('project round trip preserves edits while excluding unknown root data', () => {
  const original: Project = { version: 1, title: '復健小日記', author: '@test', slides: [newSlide([], '第一步', '慢慢來', 'text')] };
  original.slides[0].texts[0].color = '#274139';
  const restored = parseProject(JSON.stringify({ ...original, apiKey: 'never-import-this' }));
  assert.equal(restored.title, original.title);
  assert.deepEqual(restored.slides[0].texts, original.slides[0].texts);
  assert.equal(restored.slides[0].layout, 'text');
  assert.notEqual(restored.slides[0].id, original.slides[0].id);
  assert.ok(!JSON.stringify(restored).includes('never-import-this'));
});

test('project import rejects non-finite dimensions and credential-bearing image URLs', () => {
  const p: Project = { version: 1, title: 'test', author: '', slides: [newSlide()] };
  p.slides[0].texts[0].size = 200;
  assert.throws(() => parseProject(JSON.stringify(p)), /文字格式/);
  p.slides[0].texts[0].size = 54;
  p.slides[0].images[0].photo = { url: 'https://secret:password@example.com/photo.jpg', name: 'x', source: 'test', sourceUrl: '', licenseUrl: '', tags: '' };
  assert.throws(() => parseProject(JSON.stringify(p)), /圖片網址/);
});
