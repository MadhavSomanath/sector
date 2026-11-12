import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, X } from 'lucide-react';
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ageDays } from '../lib/dates';

export function Button({ className = '', variant = 'primary', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  const base = 'flex h-14 w-full items-center justify-center gap-2 rounded-full font-display text-lg font-semibold transition active:scale-[.98] disabled:opacity-40 disabled:active:scale-100';
  const look = variant === 'primary' ? 'bg-coral-d text-white shadow-[var(--shadow-btn)]' : 'bg-white text-ink shadow-[var(--shadow-soft)]';
  return <button {...p} className={`${base} ${look} ${className}`} />;
}

export const LinkButton = ({ className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} className={`p-3 text-[15px] font-bold text-muted underline underline-offset-4 ${className}`} />
);

export const IconButton = ({ label, children, className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => (
  <button {...p} aria-label={label} className={`grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-[var(--shadow-soft)] ${className}`}>{children}</button>
);

export const BackButton = (p: { onClick: () => void; label?: string }) => (
  <IconButton label={p.label ?? 'Back'} onClick={p.onClick}><ChevronLeft size={22} strokeWidth={2.6} /></IconButton>
);

export function AgeDot({ createdAt, long = false }: { createdAt: number; long?: boolean }) {
  const d = ageDays(createdAt);
  const color = d < 7 ? 'bg-age-g' : d <= 30 ? 'bg-age-y' : 'bg-age-r';
  const text = d === 0 ? 'Today' : long ? `${d} day${d === 1 ? '' : 's'}` : `${d}d`;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-extrabold text-muted" title={`Added ${d === 0 ? 'today' : `${d} day${d === 1 ? '' : 's'} ago`}`}>
      <span className={`size-2.5 rounded-full ${color}`} />
      {text}
    </span>
  );
}

export const Steps = ({ n, of }: { n: number; of: number }) => (
  <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={of} aria-valuenow={n}>
    {Array.from({ length: of }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i < n ? 'bg-coral' : 'bg-line'}`} />)}
  </div>
);

export function Range({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  const fill = `${((value - min) / (max - min)) * 100}%`;
  return (
    <input type="range" aria-label={label} className="sector-range" min={min} max={max} value={value}
      style={{ ['--fill' as string]: fill }} onChange={(e) => onChange(Number(e.target.value))} />
  );
}

export function DayChips({ value, onChange, label }: { value: number; onChange: (d: number) => void; label: string }) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return (
    <div className="mt-3 flex gap-1.5" role="radiogroup" aria-label={label}>
      {order.map((d) => (
        <button key={d} role="radio" aria-checked={value === d} aria-label={names[d]} onClick={() => onChange(d)}
          className={`grid h-11 flex-1 place-items-center rounded-full font-display text-[15px] font-semibold transition ${value === d ? 'bg-coral-d text-white' : 'bg-bg'}`}>
          {letters[d]}
        </button>
      ))}
    </div>
  );
}

/** Bottom sheet over a dimmed backdrop. */
export function Sheet({ open, onClose, children, label, peek }: { open: boolean; onClose: () => void; children: ReactNode; label: string; peek?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 mx-auto max-w-[480px]" role="dialog" aria-modal="true" aria-label={label}>
          <motion.div className="absolute inset-0 bg-ink/40" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div className="pb-safe absolute inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[34px] bg-bg px-5 pt-3"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }}>
            {peek}
            <div className="mx-auto mb-2 h-1.5 w-11 rounded-full bg-line" />
            <button onClick={onClose} aria-label="Close" className="absolute top-3.5 right-4 grid size-9 place-items-center rounded-full bg-white"><X size={18} strokeWidth={2.6} /></button>
            <div className="no-scrollbar -mx-5 max-h-[calc(92dvh-40px)] overflow-y-auto px-5 pt-1 pb-3">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const CONFETTI = ['#F2765A', '#FFB677', '#7FCFA6', '#7DB8F5', '#A99BF0'];
export function Confetti({ count = 26 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 37) % 100;
        const round = i % 3 === 0;
        return (
          <motion.i key={i} className="absolute block"
            style={{ left: `${left}%`, top: -20, width: round ? 9 : 13, height: round ? 9 : 6, borderRadius: round ? 9 : 3, background: CONFETTI[i % 5] }}
            initial={{ y: -20, rotate: 0, opacity: 1 }}
            animate={{ y: 520 + (i % 5) * 40, rotate: (i % 2 ? 1 : -1) * 260, opacity: 0 }}
            transition={{ duration: 2.4 + (i % 4) * 0.3, delay: (i % 7) * 0.08, ease: 'easeOut' }} />
        );
      })}
    </div>
  );
}

export const Card = ({ className = '', children }: { className?: string; children: ReactNode }) => (
  <div className={`rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)] ${className}`}>{children}</div>
);
