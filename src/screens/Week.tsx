import { AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { SecFace, Sec } from '../components/Sec';
import { TaskRow } from '../components/TaskRow';
import { addDays, DAYS_LONG, DAYS_SHORT, fmtRange, startOfDay, weekStartOf } from '../lib/dates';
import { byNewest, doneThisWeek, inBucket, openThisWeek, reviewDue, useStore, weekCount, winAt as winAtFor } from '../lib/store';
import { useUI } from '../lib/ui';

export function Week() {
  const { state, dispatch } = useStore();
  const ui = useUI();
  const [showDone, setShowDone] = useState(true);
  const now = Date.now();
  const today = startOfDay(now);
  const ws = state.planWeekStart;
  const upcoming = ws > weekStartOf(now, state.settings.weekStartDay);
  const open = openThisWeek(state).sort(byNewest);
  const done = doneThisWeek(state).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const count = weekCount(state);
  const limit = state.settings.limit;
  const winAt = winAtFor(count);
  const inbox = inBucket(state, 'inbox').length;
  const due = reviewDue(state, now);
  const weekOver = now >= addDays(ws, 7);
  const isReviewDay = new Date(now).getDay() === state.settings.reviewDay;

  return (
    <div className="px-[22px] pt-6">
      <header className="flex items-start justify-between">
        <div>
          <div className="text-sm font-extrabold text-muted">{fmtRange(ws, addDays(ws, 6))}{upcoming && ` · starts ${DAYS_LONG[new Date(ws).getDay()]}`}{weekOver && ' · ended'}</div>
          <h1 className="font-display text-[30px] leading-tight font-bold">This Week</h1>
        </div>
        <button onClick={ui.openSettings} aria-label="Settings" className="grid size-11 place-items-center rounded-full bg-white shadow-[var(--shadow-soft)]">
          <SecFace className="w-[34px]" />
        </button>
      </header>

      <div className="mt-3 flex gap-1.5" aria-label="Week days">
        {Array.from({ length: 7 }, (_, k) => {
          const d = addDays(ws, k);
          const date = new Date(d);
          const isToday = d === today, past = d < today, review = date.getDay() === state.settings.reviewDay;
          return (
            <div key={k} className={`relative flex-1 rounded-2xl pt-1.5 pb-2 text-center ${isToday ? 'bg-coral-d text-white' : past ? 'opacity-50' : review ? 'bg-lav-t' : 'bg-white shadow-[var(--shadow-soft)]'}`}>
              <small className={`block text-[11px] font-extrabold ${isToday ? 'text-[#FFE3DB]' : 'text-muted'}`}>{DAYS_SHORT[date.getDay()]}</small>
              <b className="font-display text-[17px] font-semibold">{date.getDate()}</b>
              {review && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-lav px-1.5 text-[9px] font-extrabold text-ink">review</span>}
            </div>
          );
        })}
      </div>

      {state.calibrating ? (
        <div className="mt-4 rounded-[26px] bg-white px-4 py-3.5 shadow-[var(--shadow-soft)]">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[26px] font-bold">{count} <small className="text-base text-muted">planned</small></span>
            <span className="text-[13px] font-extrabold text-muted">{done.length} done</span>
          </div>
          <p className="mt-1.5 text-[13px] font-bold text-muted">
            {count > 20 ? 'Big week! Learning week, so no limit yet. We’ll see how it goes.' : 'Learning week: no limit yet. Your first review suggests one.'}
          </p>
        </div>
      ) : (
      <div className="mt-4 rounded-[26px] bg-white px-4 py-3.5 shadow-[var(--shadow-soft)]">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-[26px] font-bold">{count} <small className="text-base text-muted">/ {limit}</small></span>
          <span className="text-[13px] font-extrabold text-muted">{count ? `${done.length} done · win at ${winAt}` : 'Room for the week'}</span>
        </div>
        <div className="mt-2.5 flex gap-[3px]" aria-hidden>
          {limit <= 30
            ? Array.from({ length: limit }, (_, k) => <span key={k} className={`h-2.5 flex-1 rounded-full ${k < done.length ? 'bg-coral-d' : k < count ? 'bg-coral' : 'bg-coral-t'}`} />)
            : <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-coral-t"><span className="block h-full rounded-full bg-coral" style={{ width: `${(count / limit) * 100}%` }} /></span>}
        </div>
      </div>
      )}

      {due && (
        <Nudge tint="bg-lav-t" onClick={ui.startReview}
          title={weekOver ? 'Last week is still open' : isReviewDay ? 'It’s review day' : 'Your review is ready'}
          sub={weekOver ? 'A few minutes to close it and plan this week' : 'A few minutes to close the week and plan the next'} />
      )}
      {inbox > 0 && (
        <Nudge tint="bg-peach-t" onClick={() => ui.goTo('inbox')} title={`${inbox} in your Inbox`} sub="Answer “when?” for each" />
      )}

      {open.length === 0 && done.length === 0 ? (
        <div className="mt-8 flex flex-col items-center text-center">
          <Sec pose="hold" className="w-32" />
          <p className="mt-2 font-display text-lg font-semibold">Nothing planned yet</p>
          <p className="mt-1 max-w-64 text-sm font-semibold text-muted">Tap + to add a task, or bring one in from Buckets.</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {open.map((t) => <TaskRow key={t.id} task={t} onOpen={() => ui.openMove(t.id)} onToggle={() => dispatch({ type: 'toggleDone', id: t.id })} />)}
          </AnimatePresence>
          {open.length === 0 && <p className="py-3 text-center font-display font-semibold text-muted">All done for this week!</p>}
        </div>
      )}

      {done.length > 0 && (
        <section className="mt-5">
          <button onClick={() => setShowDone(!showDone)} aria-expanded={showDone} className="flex w-full items-center justify-between px-1 font-display font-semibold text-muted">
            Done · {done.length}<ChevronRight size={18} className={`transition ${showDone ? 'rotate-90' : ''}`} />
          </button>
          {showDone && <div className="mt-1">{done.map((t) => <TaskRow key={t.id} task={t} onOpen={() => {}} onToggle={() => dispatch({ type: 'toggleDone', id: t.id })} />)}</div>}
        </section>
      )}
    </div>
  );
}

function Nudge({ tint, title, sub, onClick }: { tint: string; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`mt-3 flex w-full items-center gap-3 rounded-[22px] px-4 py-3 text-left ${tint}`}>
      <span className="flex-1"><b className="block font-display text-[17px] font-semibold">{title}</b><span className="text-sm font-semibold text-muted">{sub}</span></span>
      <ChevronRight size={20} />
    </button>
  );
}
