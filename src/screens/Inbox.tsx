import { useState } from 'react';
import { Sec } from '../components/Sec';
import { SwipeDeck, type Dir } from '../components/SwipeDeck';
import { AgeDot } from '../components/ui';
import { BUCKET_NAME, BUCKET_STYLE, laterBucket, moveTargets } from '../lib/buckets';
import { byOldest, inBucket, useStore, weekCount, type Bucket } from '../lib/store';
import { useUI } from '../lib/ui';

export function Inbox() {
  const { state, dispatch } = useStore();
  const { placeThisWeek, goTo } = useUI();
  const [exitDir, setExitDir] = useState<Dir | null>(null);
  const items = inBucket(state, 'inbox').sort(byOldest);
  const task = items[0];
  const targets = moveTargets(state.planWeekStart);
  const later = laterBucket(state.planWeekStart);

  const send = (b: Bucket, dir: Dir | null = null) => {
    if (!task) return;
    setExitDir(dir);
    if (b === 'this_week') placeThisWeek(task.id);
    else dispatch({ type: 'move', id: task.id, bucket: b });
  };

  if (!task)
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
        <Sec pose="hold" className="w-40" />
        <h1 className="mt-3 font-display text-2xl font-bold">Inbox is clear</h1>
        <p className="mt-1 font-semibold text-muted">Every task has a “when”.</p>
        <button onClick={() => goTo('week')} className="mt-5 h-12 rounded-full bg-white px-6 font-display font-semibold shadow-[var(--shadow-soft)]">Back to my week</button>
      </div>
    );

  return (
    <div className="flex min-h-[calc(100dvh-100px)] flex-col px-[22px] pt-6">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-semibold">Inbox</span>
        <span className="text-sm font-extrabold text-muted">{items.length} left</span>
      </div>
      <div className="mt-1 flex items-end">
        <h1 className="font-display text-[38px] font-bold">When?</h1>
        <Sec pose="when" className="relative z-10 -mb-3.5 ml-auto w-[84px]" />
      </div>
      <SwipeDeck cardKey={task.id} exitDir={exitDir} height={200} left={BUCKET_NAME[later]} right="This Week" leftClass={BUCKET_STYLE[later].bg}
        onSwipe={(d) => send(d === 'right' ? 'this_week' : later, d)}>
        <AgeDot createdAt={task.createdAt} long />
        <div className="mt-3 font-display text-[25px] leading-tight font-semibold">{task.title}</div>
      </SwipeDeck>
      <div className="flex-1" />
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {targets.map((t) => (
          <button key={t.b} onClick={() => send(t.b, t.b === 'this_week' ? 'right' : t.b === later ? 'left' : null)}
            className={`flex h-14 items-center justify-center gap-1.5 rounded-full font-display text-base font-semibold shadow-[var(--shadow-soft)] transition active:scale-[.97] ${BUCKET_STYLE[t.b].bg}`}>
            {t.label}
            {t.b === 'this_week' && <small className="font-sans text-xs font-extrabold opacity-75">{weekCount(state)}/{state.settings.limit}</small>}
          </button>
        ))}
        <button onClick={() => send('trash')} className={`flex h-14 items-center justify-center rounded-full bg-white font-display text-base font-semibold shadow-[var(--shadow-soft)] ${targets.length % 2 ? '' : 'col-span-2'}`}>Delete</button>
      </div>
      <p className="mt-3 mb-2 text-center text-sm font-semibold text-muted">Tap a bucket or swipe the card.</p>
    </div>
  );
}
