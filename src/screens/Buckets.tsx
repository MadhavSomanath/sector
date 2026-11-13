import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Sec } from '../components/Sec';
import { TaskRow } from '../components/TaskRow';
import { BUCKET_STYLE } from '../lib/buckets';
import { bucketRanges } from '../lib/dates';
import { byOldest, inBucket, useStore, weekCount, type Bucket } from '../lib/store';
import { useUI } from '../lib/ui';

export function Buckets() {
  const { state } = useStore();
  const ui = useUI();
  const r = bucketRanges(state.planWeekStart);
  const sections: Array<{ b: Bucket; title: string; sub: string }> = [
    { b: 'next_week', title: 'Next Week', sub: r.nextWeek },
    { b: 'this_month', title: 'Later this month', sub: r.later ?? 'Rest of the month' },
    { b: 'next_month', title: 'Next Month', sub: r.nextMonth },
    { b: 'on_hold', title: 'On Hold', sub: 'No date' },
  ];
  const shown = sections.filter((s) => inBucket(state, s.b).length > 0);

  return (
    <div className="px-[22px] pt-6">
      <h1 className="font-display text-[30px] font-bold">Buckets</h1>
      <p className="mt-1 font-semibold text-muted">Everything after this week. Tap a task to move it.</p>

      <button onClick={() => ui.goTo('week')} className="mt-4 flex w-full items-center gap-3 rounded-[22px] bg-coral-t px-4 py-3 text-left">
        <span className="size-3.5 rounded-[5px] bg-coral" />
        <span className="flex-1 font-display text-[17px] font-semibold">This Week <span className="text-sm text-muted">{r.thisWeek}</span></span>
        <span className="text-sm font-extrabold text-coral-d">{state.calibrating ? `${weekCount(state)} planned` : `${weekCount(state)} / ${state.settings.limit}`}</span>
        <ChevronRight size={18} />
      </button>

      {shown.length === 0 && (
        <div className="mt-8 flex flex-col items-center text-center">
          <Sec pose="hold" className="w-28" />
          <p className="mt-2 font-display text-lg font-semibold">Nothing planned after this week</p>
        </div>
      )}

      {shown.map((s) => {
        const tasks = inBucket(state, s.b).sort(byOldest);
        return (
          <section key={s.b} className="mt-6">
            <h2 className="flex items-center gap-2 px-1 font-display text-lg font-semibold">
              <span className={`size-3.5 rounded-[5px] ${BUCKET_STYLE[s.b].bg}`} />{s.title}
              <span className="text-sm font-semibold text-muted">{s.sub}</span>
              <span className="ml-auto text-sm text-muted">{tasks.length}</span>
            </h2>
            <div className="mt-2 flex flex-col gap-2">{tasks.map((t) => <TaskRow key={t.id} task={t} onOpen={() => ui.openMove(t.id)} />)}</div>
          </section>
        );
      })}

      <Gone title="Let go" sub="Parked, never lost" bucket="parked" />
      <Gone title="Deleted" sub="Kept for 30 days" bucket="trash" />
    </div>
  );
}

function Gone({ title, sub, bucket }: { title: string; sub: string; bucket: Bucket }) {
  const { state } = useStore();
  const ui = useUI();
  const [open, setOpen] = useState(false);
  const tasks = inBucket(state, bucket).sort(byOldest);
  if (!tasks.length) return null;
  return (
    <section className="mt-6">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-2 px-1 font-display text-lg font-semibold text-muted">
        {title} <span className="text-sm">{sub}</span><span className="ml-auto text-sm">{tasks.length}</span>
        <ChevronRight size={18} className={`transition ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="mt-2 flex flex-col gap-2 opacity-80">{tasks.map((t) => <TaskRow key={t.id} task={t} onOpen={() => ui.openMove(t.id)} />)}</div>}
    </section>
  );
}
