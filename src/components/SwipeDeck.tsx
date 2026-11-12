import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react';
import type { ReactNode } from 'react';

export type Dir = 'left' | 'right';

/**
 * A stack of one card with two under-cards. Drag right or left past the threshold to choose;
 * buttons outside the deck do the same thing.
 */
export function SwipeDeck({ cardKey, children, onSwipe, left, right, exitDir, height = 230, leftClass = 'bg-mint' }: {
  cardKey: string; children: ReactNode; onSwipe: (d: Dir) => void;
  left: string; right: string; exitDir: Dir | null; height?: number; leftClass?: string;
}) {
  return (
    <div className="relative" style={{ height: height + 30 }}>
      <div className="absolute inset-x-6 top-8 rounded-[30px] bg-[#F6D2C0]" style={{ height: height - 20 }} />
      <div className="absolute inset-x-3.5 top-4 rounded-[30px] bg-[#FBE1D3]" style={{ height: height - 10 }} />
      <AnimatePresence initial={false} custom={exitDir}>
        <Card key={cardKey} onSwipe={onSwipe} left={left} right={right} height={height} leftClass={leftClass}>{children}</Card>
      </AnimatePresence>
    </div>
  );
}

function Card({ children, onSwipe, left, right, height, leftClass }: { children: ReactNode; onSwipe: (d: Dir) => void; left: string; right: string; height: number; leftClass: string }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const rightOp = useTransform(x, [20, 110], [0, 1]);
  const leftOp = useTransform(x, [-110, -20], [1, 0]);
  const end = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 110 || info.velocity.x > 600) onSwipe('right');
    else if (info.offset.x < -110 || info.velocity.x < -600) onSwipe('left');
  };
  return (
    <motion.div
      className="absolute inset-x-0 top-0 flex touch-pan-y flex-col rounded-[30px] bg-white p-5 shadow-[var(--shadow-lift)] select-none"
      style={{ x, rotate, height }}
      drag="x" dragSnapToOrigin dragElastic={0.9} onDragEnd={end}
      initial={{ scale: 0.94, y: 14, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      variants={{ exit: (d: Dir | null) => ({ x: d === 'left' ? -420 : d === 'right' ? 420 : 0, y: d ? 0 : -30, opacity: 0, transition: { duration: 0.28 } }) }}
      exit="exit"
    >
      <motion.span style={{ opacity: rightOp }} className="pointer-events-none absolute top-4 right-4 rounded-full bg-coral px-3 py-1 font-display text-sm font-semibold">{right}</motion.span>
      <motion.span style={{ opacity: leftOp }} className={`pointer-events-none absolute top-4 right-4 rounded-full ${leftClass} px-3 py-1 font-display text-sm font-semibold`}>{left}</motion.span>
      {children}
      <div className="mt-auto flex justify-between text-[13px] font-extrabold text-muted">
        <span>← {left}</span><span>{right} →</span>
      </div>
    </motion.div>
  );
}
