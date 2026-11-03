import test from 'node:test';
import assert from 'node:assert/strict';
import { newSlide, parseGenerated, parseProject } from './model.ts';

const legacy = () => ({ version: 1, title: '第一版作品', author: '@original', slides: [{ id: 'old-slide', layout: 'single', images: [{ photo: null, x: 50, y: 50, zoom: 1 }, { photo: null, x: 50, y: 50, zoom: 1 }], texts: [0, 1].map(i => ({ text: `原有第 ${i + 1} 段`, size: 24, color: '#ffffff', font: 'serif', bold: true, align: 'center', x: 32, y: i ? 72 : 28 })), overlay: 32, background: '#274139' }] });

test('new bilingual captions default to sans with a smaller independent subtitle', () => {
  const slide = newSlide();
  assert.equal(slide.texts[0].font, 'sans');
  assert.equal(slide.texts[0].size, 56);
  assert.equal(slide.languageMode, 'zh-en');
  assert.equal(slide.texts[0].subtitle.font, 'sans');
  assert.equal(slide.texts[0].subtitle.size, 34);
  assert.ok(slide.texts[0].subtitle.size < slide.texts[0].size);
});

test('version one imports preserve visible text, fonts and positions without inventing translations', () => {
  const old = legacy();
  const p = parseProject(JSON.stringify(old));
  assert.equal(p.version, 3);
  assert.equal(p.slides[0].languageMode, 'zh');
  assert.equal(p.slides[0].texts[0].text, '原有第 1 段');
  assert.equal(p.slides[0].texts[0].en, '');
  assert.equal(p.slides[0].texts[0].font, 'serif');
  assert.equal(p.slides[0].texts[0].x, 32);
  assert.equal(p.slides[0].texts[0].y, 28);
  assert.equal(p.slides[0].texts[0].size, 24);
  assert.ok(p.slides[0].texts[0].subtitle.size < 24);
});

test('AI response requires Chinese and English for each photo quote', () => {
  const slide = { top: { zh: '慢慢來', en: 'Take your time.' }, bottom: { zh: '每一步都算數', en: 'Every step counts.' }, imageQuery: 'forest', layout: 'stack' };
  const result = parseGenerated(JSON.stringify({ title: '一步一步', slides: [slide] }), 1);
  assert.equal(result.slides[0].top.en, 'Take your time.');
  assert.equal(result.slides[0].bottom.zh, '每一步都算數');
  assert.throws(() => parseGenerated(JSON.stringify({ title: '缺少翻譯', slides: [{ ...slide, top: { zh: '慢慢來', en: '' } }] }), 1), /中英|翻譯|內容/);
});

test('version two imports reject malformed subtitle settings and unknown language modes', () => {
  const p = { version: 2, title: '雙語', author: '', slides: [newSlide()] };
  p.slides[0].languageMode = 'unknown' as never;
  assert.throws(() => parseProject(JSON.stringify(p)), /語言|格式/);
  p.slides[0].languageMode = 'zh-en';
  p.slides[0].texts[0].subtitle = { size: 100, color: '#ffffff', font: 'sans', bold: false };
  assert.throws(() => parseProject(JSON.stringify(p)), /副文字|格式/);
});
