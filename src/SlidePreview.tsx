import { useEffect, useRef, useState } from 'react';
import { renderSlide } from './render';
import { type Slide } from './model';
export function SlidePreview({ slide, author, thumb = false }: { slide: Slide; author: string; thumb?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    const canvas = document.createElement('canvas');
    renderSlide(canvas, slide, author, thumb ? 216 : 1080).then(() => { if (active && ref.current) { ref.current.width = canvas.width; ref.current.height = canvas.height; ref.current.getContext('2d')!.drawImage(canvas, 0, 0); setError(false); setLoaded(true); } }).catch(() => { if (active) { setError(true); setLoaded(true); } });
    return () => { active = false; };
  }, [slide, author, thumb]);
  return <div className={`slide-preview ${error ? 'render-error' : ''}`}><canvas ref={ref} width={thumb ? 216 : 1080} height={thumb ? 270 : 1350} role="img" aria-label={`${slide.texts[0].text}；${slide.texts[1].text}`} />{!loaded && <span className="preview-loading" aria-label="載入預覽中"/>}{error && <span>預覽失敗，請重新載入或更換圖片</span>}</div>;
}
