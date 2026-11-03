export const fonts = [
  { id: 'sans', label: '思源黑體', family: 'Noto Sans TC', group: '中文', license: 'notosanstc' },
  { id: 'serif', label: '思源宋體', family: 'Noto Serif TC', group: '中文', license: 'notoseriftc' },
  { id: 'wenkai', label: '霞鶩文楷 TC', family: 'LXGW WenKai TC', group: '中文', license: 'lxgwwenkaitc' },
  { id: 'iansui', label: '芫荽 Iansui', family: 'Iansui', group: '中文', license: 'iansui' },
  { id: 'huninn', label: '圓體 Huninn', family: 'Huninn', group: '中文', license: 'huninn' },
  { id: 'inter', label: 'Inter · 簡潔黑體', family: 'Inter', group: 'English', license: 'inter' },
  { id: 'lora', label: 'Lora · 文學襯線', family: 'Lora', group: 'English', license: 'lora' },
  { id: 'playfair', label: 'Playfair Display · 典雅襯線', family: 'Playfair Display', group: 'English', license: 'playfairdisplay' },
  { id: 'montserrat', label: 'Montserrat · 幾何黑體', family: 'Montserrat', group: 'English', license: 'montserrat' },
  { id: 'dm-sans', label: 'DM Sans · 柔和黑體', family: 'DM Sans', group: 'English', license: 'dmsans' },
  { id: 'cormorant', label: 'Cormorant Garamond · 古典襯線', family: 'Cormorant Garamond', group: 'English', license: 'cormorantgaramond' },
] as const;
export type Font = typeof fonts[number]['id'];
export const isFont = (value: unknown): value is Font => fonts.some(f => f.id === value);
export function fontFamily(font: Font) {
  const family = fonts.find(f => f.id === font)?.family || 'Noto Sans TC';
  return `"${family}", ${font === 'serif' ? '"Songti TC", serif' : '"Noto Sans TC", system-ui, sans-serif'}`;
}
