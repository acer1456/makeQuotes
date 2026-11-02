import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function IconButton({ label, children, onClick, disabled = false, className = '' }: { label: string; children: ReactNode; onClick: () => void; disabled?: boolean; className?: string }) { return <button className={`icon-button ${className}`} aria-label={label} title={label} onClick={onClick} disabled={disabled}>{children}</button>; }
export function Slider({ label, value, min = 0, max = 100, step = 1, suffix = '', onChange }: { label: string; value: number; min?: number; max?: number; step?: number; suffix?: string; onChange: (v: number) => void }) { return <label className="slider-row"><span>{label}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} /><output>{Number.isInteger(value) ? value : value.toFixed(1)}{suffix}</output></label>; }
export function Modal({ title, children, onClose, wide = false, busy = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'wide' : ''}`} aria-label={title} onCancel={e => { e.preventDefault(); if (!busy) close.current(); }} onClick={e => { if (e.target === ref.current && !busy) close.current(); }}><div className="modal-shell"><header><h2>{title}</h2><IconButton label="關閉" onClick={onClose} disabled={busy}><X size={20}/></IconButton></header>{children}</div></dialog>;
}
