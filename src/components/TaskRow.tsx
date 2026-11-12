import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Task } from '../lib/store';
import { AgeDot } from './ui';

export function TaskRow({ task, onToggle, onOpen, extra }: { task: Task; onToggle?: () => void; onOpen: () => void; extra?: ReactNode }) {
  const done = task.bucket === 'done';
  if (done)
    return (
      <div className="flex items-center gap-3 px-3.5 py-1.5">
        <button onClick={onToggle} aria-label={`Mark "${task.title}" not done`} className="grid size-[26px] shrink-0 place-items-center rounded-full bg-mint">
          <Check size={15} strokeWidth={3.5} className="text-white" />
        </button>
        <span className="text-base font-semibold text-muted line-through">{task.title}</span>
      </div>
    );
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
      className="flex items-center gap-3 rounded-[22px] bg-white px-3.5 py-3 shadow-[var(--shadow-soft)]">
      {onToggle && (
        <button onClick={onToggle} aria-label={`Mark "${task.title}" done`}
          className="grid size-[26px] shrink-0 place-items-center rounded-full border-3 border-line transition hover:border-mint active:scale-90" />
      )}
      <button onClick={onOpen} className="min-w-0 flex-1 text-left" aria-label={`Move "${task.title}"`}>
        <b className="block text-base leading-snug font-bold">{task.title}</b>
        <span className="mt-0.5 flex items-center gap-2"><AgeDot createdAt={task.createdAt} />{extra}</span>
      </button>
    </motion.div>
  );
}
