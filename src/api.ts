import { parseGenerated, type Photo, type Generated } from './model';
export interface Model { id: string; name: string; free: boolean; structured: boolean; }
async function readJson(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error) {
    const code = response.status;
    const message = code === 401 ? 'API Key 無效，請檢查設定。' : code === 402 ? 'OpenRouter 額度不足，請儲值或選擇免費模型。' : code === 429 ? '請求過於頻繁，請稍後再試。' : data?.error?.message || `服務暫時無法使用（${code}）。`;
    throw new Error(message);
  }
  return data;
}
export async function loadModels(signal?: AbortSignal): Promise<Model[]> {
  const data = await readJson(await fetch('https://openrouter.ai/api/v1/models', { signal: signal || AbortSignal.timeout(20000) }));
  if (!Array.isArray(data?.data)) throw new Error('無法讀取模型清單。');
  return data.data.filter((m: { architecture?: { output_modalities?: string[] } }) => m.architecture?.output_modalities?.includes('text')).map((m: { id: string; name: string; pricing?: { prompt: string; completion: string }; supported_parameters?: string[] }) => ({ id: m.id, name: m.name, free: Number(m.pricing?.prompt) === 0 && Number(m.pricing?.completion) === 0, structured: !!m.supported_parameters?.includes('structured_outputs') })).sort((a: Model, b: Model) => a.name.localeCompare(b.name));
}
export async function generateCarousel(key: string, model: Model, prompt: string, count: number, signal: AbortSignal): Promise<Generated> {
  const quote = { type: 'object', additionalProperties: false, properties: { zh: { type: 'string' }, en: { type: 'string' }, speaker: { type: 'string' }, source: { type: 'string' } }, required: ['zh', 'en', 'speaker', 'source'] };
  const schema = { type: 'object', additionalProperties: false, properties: { title: { type: 'string' }, slides: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { top: quote, bottom: quote, imageQuery: { type: 'string' }, layout: { type: 'string', enum: ['single', 'stack', 'side', 'text'] } }, required: ['top', 'bottom', 'imageQuery', 'layout'] } } }, required: ['title', 'slides'] };
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${key.trim()}`, 'Content-Type': 'application/json', 'X-Title': 'Slow Carousel Studio' }, signal,
    body: JSON.stringify({ model: model.id, messages: [{ role: 'system', content: `你是繁體中文 IG 輪播編輯。根據使用者主題產生恰好 ${count} 頁、有起承轉合的內容。簡短、溫柔、具體，不使用 emoji。若涉及復健或醫療，僅提供一般衛教，不診斷、不保證療效、不提供危險動作，必要時提醒個別評估。每頁 top、bottom 都包含 zh（繁體中文）與 en（對應英文），兩種語言語意一致，英文自然簡潔，不要逐字硬譯。每段中文 8–35 字，英文 3–18 個單字，每段維持一句，不要換行。speaker、source 只在使用者提供可確認的作者與來源時填入，否則留空；不可把原創文案假託給名人，也不要在正文重複作者或來源；imageQuery 是 1–3 個英文自然／生活照片搜尋詞，不要中文字；layout 可用 single、stack、side、text，以 stack 為主。只輸出 JSON：{"title":"標題","slides":[{"top":{"zh":"上方中文","en":"Upper English quote","speaker":"","source":""},"bottom":{"zh":"下方中文","en":"Lower English quote","speaker":"","source":""},"imageQuery":"forest sunlight","layout":"stack"}]}。不要模仿附件原文。` }, { role: 'user', content: prompt }], ...(model.structured ? { response_format: { type: 'json_schema', json_schema: { name: 'carousel', strict: true, schema } }, provider: { require_parameters: true } } : {}) }),
  });
  const data = await readJson(response);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('模型沒有回傳文字內容，請更換文字模型。');
  return parseGenerated(content, count);
}
export async function searchPhotos(query: string, key = '', signal?: AbortSignal): Promise<Photo[]> {
  if (!key.trim()) {
    const params = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: `${query.replace(/["|{}]/g, '').slice(0, 100)} filetype:bitmap incategory:CC-Zero`, gsrnamespace: '6', gsrlimit: '18', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1600', format: 'json', origin: '*' });
    const data = await readJson(await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { signal: signal || AbortSignal.timeout(20000) }));
    const pages = Object.values(data?.query?.pages || {}) as { title: string; index: number; imageinfo?: { thumburl?: string; url: string; descriptionurl: string; extmetadata: Record<string, { value: string }> }[] }[];
    return pages.sort((a, b) => a.index - b.index).flatMap(p => {
      const image = p.imageinfo?.[0];
      if (!image || image.extmetadata?.LicenseShortName?.value !== 'CC0' || image.extmetadata?.Restrictions?.value) return [];
      const author = new DOMParser().parseFromString(image.extmetadata.Artist?.value || '', 'text/html').body.textContent?.trim();
      return [{ url: image.thumburl || image.url, name: (author || p.title.replace(/^File:/, '')).slice(0, 200), source: 'Wikimedia · CC0', sourceUrl: image.descriptionurl, licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/', tags: p.title.replace(/^File:/, '').slice(0, 200) }];
    });
  }
  const params = new URLSearchParams({ query, per_page: '18', size: 'large' });
  const data = await readJson(await fetch(`https://api.pexels.com/v1/search?${params}`, { headers: { Authorization: key.trim() }, signal: signal || AbortSignal.timeout(20000) }));
  if (!Array.isArray(data?.photos)) throw new Error('圖庫回傳格式錯誤。');
  return data.photos.map((p: { src: { large2x: string }; photographer: string; url: string; alt: string }) => ({ url: p.src.large2x, name: p.photographer, source: 'Pexels', sourceUrl: p.url, licenseUrl: 'https://www.pexels.com/license/', tags: p.alt || query }));
}
