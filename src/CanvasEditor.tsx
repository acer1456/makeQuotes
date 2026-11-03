import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { SlidePreview } from './SlidePreview';
import { WIDTH, HEIGHT, type Slide } from './model';
import { canvasPoint, moveTextBlock, resizeScale, resizeTextBlock, type Point, type QuoteGeometry } from './canvas-interaction';

type Part = 'move' | 'main' | 'subtitle';
interface Drag { pointerId: number; base: Slide; geometry: QuoteGeometry; part: Part; start: Point; client: Point; latest: Slide; moved: boolean; }
interface Props { slide: Slide; author: string; selected: number | null; onSelect: (index: number | null) => void; onChange: (slide: Slide) => void; }
export function CanvasEditor({ slide, author, selected, onSelect, onChange }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const latestSlide = useRef(slide); latestSlide.current = slide;
  const [draft, setDraft] = useState<{ base: Slide; slide: Slide } | null>(null);
  const [rendered, setRendered] = useState<{ slide: Slide; bounds: QuoteGeometry[] } | null>(null);
  const shown = draft?.base === slide ? draft.slide : slide;
  const onRendered = useCallback((bounds: QuoteGeometry[], renderedSlide: Slide) => setRendered({ slide: renderedSlide, bounds }), []);
  function cancel() { drag.current = null; setDraft(null); }
  function start(e: PointerEvent<HTMLButtonElement>, geometry: QuoteGeometry, part: Part) {
    if (e.button !== 0 || drag.current || rendered?.slide !== shown) return;
    e.preventDefault(); e.stopPropagation(); e.currentTarget.focus({ preventScroll: true });
    onSelect(geometry.index);
    const client = { x: e.clientX, y: e.clientY };
    drag.current = { pointerId: e.pointerId, base: slide, geometry, part, start: canvasPoint(client, root.current!.getBoundingClientRect()), client, latest: slide, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (latestSlide.current !== d.base) { cancel(); return; }
    const client = { x: e.clientX, y: e.clientY };
    if (!d.moved && Math.hypot(client.x - d.client.x, client.y - d.client.y) < 2) return;
    d.moved = true;
    const point = canvasPoint(client, root.current!.getBoundingClientRect());
    const original = d.base.texts[d.geometry.index];
    const block = d.part === 'move'
      ? moveTextBlock(d.base, d.geometry, { x: point.x - d.start.x, y: point.y - d.start.y })
      : resizeTextBlock(original, d.part, (d.part === 'main' ? original.size : original.subtitle.size) * resizeScale(d.geometry.bounds, d.start, point, d.part));
    d.latest = { ...d.base, texts: d.base.texts.map((t, i) => i === d.geometry.index ? block : t) };
    setDraft({ base: d.base, slide: d.latest });
  }
  function finish(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    move(e);
    cancel();
    if (d.moved && latestSlide.current === d.base && JSON.stringify(d.latest.texts) !== JSON.stringify(d.base.texts)) onChange(d.latest);
  }
  function keyboard(e: KeyboardEvent<HTMLButtonElement>, geometry: QuoteGeometry, part: Part) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) || drag.current || rendered?.slide !== slide) return;
    e.preventDefault();
    const step = e.shiftKey ? 20 : 2;
    const block = part === 'move'
      ? moveTextBlock(slide, geometry, { x: e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0, y: e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0 })
      : resizeTextBlock(slide.texts[geometry.index], part, (part === 'main' ? slide.texts[geometry.index].size : slide.texts[geometry.index].subtitle.size) + (['ArrowUp', 'ArrowRight'].includes(e.key) ? 1 : -1) * (e.shiftKey ? 5 : 1));
    onChange({ ...slide, texts: slide.texts.map((t, i) => i === geometry.index ? block : t) });
  }
  function control(geometry: QuoteGeometry, part: Part) {
    return {
      onPointerDown: (e: PointerEvent<HTMLButtonElement>) => start(e, geometry, part),
      onPointerMove: move, onPointerUp: finish,
      onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => { if (drag.current?.pointerId === e.pointerId) cancel(); },
      onLostPointerCapture: (e: PointerEvent<HTMLButtonElement>) => { if (drag.current?.pointerId === e.pointerId) cancel(); },
      onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => keyboard(e, geometry, part),
    };
  }
  return <div className="canvas-editor" ref={root} onKeyDownCapture={e => {
    if (e.key === 'Escape' || (drag.current && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z')) {
      e.preventDefault(); e.stopPropagation(); const wasDragging = !!drag.current; cancel(); if (!wasDragging) onSelect(null);
    }
  }}>
    <SlidePreview slide={shown} author={author} onRendered={onRendered}/>
    <div className="canvas-text-controls" onPointerDown={e => { if (e.target === e.currentTarget) onSelect(null); }}>
      {rendered?.slide.id === slide.id && rendered.bounds.map(g => {
        const active = selected === g.index; const block = shown.texts[g.index];
        return <div key={g.index} className={`canvas-quote ${active ? 'selected' : ''}`} style={{ left: `${(g.bounds.x + g.bounds.w / 2) / WIDTH * 100}%`, top: `${(g.bounds.y + g.bounds.h / 2) / HEIGHT * 100}%`, width: `${g.bounds.w / WIDTH * 100}%`, height: `${g.bounds.h / HEIGHT * 100}%` }}>
          <button className="canvas-quote-move" aria-label={`移動語錄 ${g.index + 1}`} aria-pressed={active} title="拖曳移動文字；方向鍵微調，Shift 加速" onFocus={() => { if (!active) onSelect(g.index); }} {...control(g, 'move')}/>
          {active && <>{g.mainSize !== null && <button className="canvas-font-handle main" aria-label={`調整語錄 ${g.index + 1} 主文字字級`} title={`主文字 ${block.size}px · 拖曳調整字級，方向鍵微調`} {...control(g, 'main')}>主</button>}{g.subtitleSize !== null && <button className="canvas-font-handle subtitle" aria-label={`調整語錄 ${g.index + 1} 副文字字級`} title={`副文字 ${block.subtitle.size}px · 拖曳調整字級，方向鍵微調`} {...control(g, 'subtitle')}>副</button>}</>}
        </div>;
      })}
    </div>
  </div>;
}
