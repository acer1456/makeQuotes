import { newSlide, type Photo, type Project } from './model';
const stock = (id: string, name: string, image: string, tags: string): Photo => ({ url: `/photos/${id}.jpg`, name, source: 'Unsplash', sourceUrl: `https://images.unsplash.com/${image}`, licenseUrl: 'https://unsplash.com/license', tags });
export const photos = [
  stock('forest', '光落下的地方', 'photo-1441974231531-c6227db76b6e', 'forest trees nature green 森林 自然 光'),
  stock('ocean', '海的呼吸', 'photo-1475924156734-496f6cac6ec1', 'ocean sea beach calm 海 平靜'),
  stock('coffee', '留一點時間給自己', 'photo-1442512595331-e89e73853f31', 'coffee cafe warm 咖啡 日常 休息'),
  stock('flowers', '在風裡慢慢生長', 'photo-1490750967868-88aa4486c946', 'flowers spring bloom 花 草地 成長'),
  stock('mountain', '每一步都算數', 'photo-1464822759023-fed622ff2c3b', 'mountain hiking nature 山 走路 步伐 復健'),
  stock('lake', '安靜，也有力量', 'photo-1470770841072-f978cf4d019e', 'lake reflection calm 湖 倒影 平靜'),
  stock('path', '走向更喜歡的生活', 'photo-1448375240586-882707db888b', 'forest path walk healing 森林 步道 走路'),
  stock('sky', '容許自己有喘息的空白', 'photo-1500534623283-312aade485b7', 'landscape sky meadow field 草原 天空 自然'),
];
export function initialProject(): Project {
  const captions = [['慢慢來，\n也是一種前進', '讓身體，\n找回自己的節奏'], ['把生活調回\n剛剛好的速度', '今天的你，\n已經很努力了'], ['在日常裡，\n練習更溫柔的自己', '休息，是為了\n走更長的路'], ['允許自己\n有喘息的空白', '不必每一刻，\n都用力向前'], ['一步一步，\n走向更喜歡的生活', '把耐心，\n也留一點給自己']];
  const english: [string, string][] = [['Slow progress\nis still progress.', 'Let your body\nfind its own rhythm.'], ['Bring life back\nto your own pace.', 'You have done\nenough for today.'], ['Practice being kinder\nto yourself.', 'Rest helps you\ngo further.'], ['Give yourself\nroom to breathe.', 'You do not have to\nkeep pushing.'], ['One step at a time,\ntoward a life you love.', 'Save a little patience\nfor yourself.']];
  return { version: 2, title: '一點一點，找回自己的節奏', author: '@slow.rehab', slides: captions.map(([a, b], i) => newSlide([photos[(i * 2) % photos.length], photos[(i * 2 + 1) % photos.length]], a, b, 'stack', english[i])) };
}
