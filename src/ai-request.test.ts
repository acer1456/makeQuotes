import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCarousel } from './api.ts';

test('actual OpenRouter request guides connected bilingual emotional dialogue and preserves model/schema', async t => {
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  let request: { model: string; messages: { role: string; content: string }[]; response_format?: { type: string } } | undefined;
  const generated = { title: '安心的愛', slides: Array.from({ length: 3 }, () => ({ top: { zh: '想說的話還沒打完', en: 'Before I finished typing', speaker: '', source: '' }, bottom: { zh: '你已經安靜地等著', en: 'You were already waiting', speaker: '', source: '' }, imageQuery: 'couple window', layout: 'stack' })) };
  globalThis.fetch = async (_url, init) => { request = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(generated) } }] }), { status: 200 }); };
  const result = await generateCarousel('test-key', { id: 'provider/chosen-model', name: 'Chosen', free: false, structured: true }, '寫暗戀裡沒有說出口的話', 3, new AbortController().signal);
  assert.equal(result.slides.length, 3); assert.ok(request);
  assert.equal(request.model, 'provider/chosen-model'); assert.equal(request.response_format?.type, 'json_schema');
  assert.equal(request.messages.at(-1)?.content, '寫暗戀裡沒有說出口的話');
  const system = request.messages.find(m => m.role === 'system')!.content;
  assert.match(system, /恰好 3 頁/); assert.match(system, /跨頁/); assert.match(system, /上句/); assert.match(system, /下句/); assert.match(system, /未完/);
  assert.match(system, /對應英文/); assert.match(system, /原創範例/);
  assert.doesNotMatch(system, /每段維持一句/);
});
