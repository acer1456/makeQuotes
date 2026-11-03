import { useEffect, useRef, useState } from 'react';
import { renderSlide } from './render';
import { captionContent, type Slide } from './model';
import type { QuoteGeometry } from './canvas-interaction';
export function SlidePreview({ slide, author, thumb = false, onRendered }: { slide: Slide; author: string; thumb?: boolean; onRendered?: (bounds: QuoteGeometry[], slide: Slide) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    const canvas = document.createElement('canvas');
    renderSlide(canvas, slide, author, thumb ? 216 : 1080).then(bounds => { if (active && ref.current) { ref.current.width = canvas.width; ref.current.height = canvas.height; ref.current.getContext('2d')!.drawImage(canvas, 0, 0); setError(false); setLoaded(true); onRendered?.(bounds, slide); } }).catch(() => { if (active) { setError(true); setLoaded(true); } });
    return () => { active = false; };
  }, [slide, author, thumb, onRendered]);
  return <div className={`slide-preview ${error ? 'render-error' : ''}`}><canvas ref={ref} width={thumb ? 216 : 1080} height={thumb ? 270 : 1350} role="img" aria-label={slide.texts.map(t => { const c = captionContent(t, slide.languageMode); return [c.main, c.subtitle].filter(Boolean).join(' / '); }).join('；')} />{!loaded && <span className="preview-loading" aria-label="載入預覽中"/>}{error && <span>預覽失敗，請重新載入或更換圖片</span>}</div>;
}
