import test from 'node:test';
import assert from 'node:assert/strict';
import { applySlideSettings, newSlide, parseProject, type Photo } from './model.ts';

test('applying all settings copies both quote designs, layout, atmosphere and image transforms without replacing content', () => {
  const photo: Photo = { url: '/photos/forest.jpg', name: 'My photo', source: '本機', sourceUrl: '', licenseUrl: '', tags: '' };
  const source = newSlide([], '來源中文', '來源第二段', 'side', ['Source English', 'Source second'], 'en-zh');
  source.overlay = 75; source.background = '#123456';
  source.texts = source.texts.map((t, i) => ({ ...t, size: 80 - i, font: 'serif', color: '#abcdef', bold: false, subtitle: { size: 25 + i, font: 'lora', color: '#654321', bold: true }, gap: 10 + i, align: 'left', x: 23 + i, y: 35 + i, lineMode: 'wrap', quoteStyle: 'card', speaker: '來源作者', source: '來源書籍' }));
  source.images = source.images.map((slot, i) => ({ ...slot, x: 20 + i, y: 30 + i, zoom: 2 + i * .1 }));
  const target = newSlide([photo], '自己的中文', '自己的第二段', 'text', ['Own English', 'Own second'], 'zh');
  target.texts.forEach((t, i) => { t.speaker = `作者${i}`; t.source = `書籍${i}`; });
  const before = structuredClone({ source, target });
  const result = applySlideSettings(source, target);
  assert.equal(result.id, target.id);
  assert.equal(result.layout, source.layout); assert.equal(result.languageMode, source.languageMode);
  assert.equal(result.overlay, source.overlay); assert.equal(result.background, source.background);
  result.texts.forEach((t, i) => assert.deepEqual(t, { ...source.texts[i], text: target.texts[i].text, en: target.texts[i].en, speaker: target.texts[i].speaker, source: target.texts[i].source }));
  result.images.forEach((im, i) => assert.deepEqual(im, { ...source.images[i], photo: target.images[i].photo }));
  assert.deepEqual({ source, target }, before);
  result.texts[0].subtitle.size = 20; result.images[0].zoom = 1;
  assert.deepEqual({ source, target }, before);
});

test('applying settings preserves empty photo slots and remains a valid editable project', () => {
  const source = newSlide(); const target = newSlide([], '', '', 'single', ['', ''], 'en');
  const result = applySlideSettings(source, target);
  assert.ok(result.images.every(im => im.photo === null));
  assert.ok(result.texts.every(t => t.text === '' && t.en === ''));
  const p = parseProject(JSON.stringify({ version: 3, title: 'project', author: '@me', slides: [source, result] }));
  assert.equal(p.slides[1].layout, source.layout); assert.equal(p.slides[1].texts[0].size, source.texts[0].size);
});
