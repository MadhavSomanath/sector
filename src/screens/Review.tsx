import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Sec } from '../components/Sec';
import { AgeDot, BackButton, Button, Confetti, Range, Steps } from '../components/ui';
import { BUCKET_STYLE, laterBucket } from '../lib/buckets';
import { addDays, fmtRange, planningWeekStart } from '../lib/dates';
import { byOldest, doneThisWeek, inBucket, openThisWeek, useStore, weekCount, type Bucket } from '../lib/store';

type Decision = 'keep' | Bucket;
const STEP_TITLES = ['How did it go?', 'Leftovers', 'Pull forward', 'Will it fit?', 'Lock it in'];

export function Review({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const startedAt = useRef(Date.now());
  const [step, setStep] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [pulled, setPulled] = useState<string[]>([]);
  const [hours, setHours] = useState(20);

  // Snapshot the week as it was when the review started.
  const leftovers = useMemo(() => openThisWeek(state).sort(byOldest), []);
  const done = doneThisWeek(state).length;
  const total = weekCount(state);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const win = total > 0 && pct >= 80;

  const newWeek = planningWeekStart(Date.now(), state.settings.weekStartDay);
  const later = laterBucket(newWeek);
  const limit = state.settings.limit;
  const kept = leftovers.filter((t) => decisions[t.id] === 'keep').length;
  const room = limit - kept;
  const candidates = [...inBucket(state, 'next_week'), ...inBucket(state, 'this_month')].sort(byOldest);
  const planned = kept + pulled.length;
  const allDecided = leftovers.every((t) => decisions[t.id]);

  const lock = () => {
    const moves: Record<string, Bucket> = {};
    for (const t of leftovers) { const d = decisions[t.id]; if (d && d !== 'keep') moves[t.id] = d; }
    for (const id of pulled) moves[id] = 'this_week';
    dispatch({ type: 'lockWeek', moves, score: pct, minutes: Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)) });
    onClose();
  };

  return (
    <main className="pb-safe relative mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden px-[22px] pt-6">
      <div className="mb-4 flex items-center gap-3">
        <BackButton label={step === 0 ? 'Close review' : 'Back'} onClick={() => (step === 0 ? onClose() : setStep(step - 1))} />
        <Steps n={step + 1} of={5} />
      </div>
      <div className="text-sm font-extrabold text-muted">Weekly review · step {step + 1} of 5</div>
      <h1 className="font-display text-[30px] leading-tight font-bold">{STEP_TITLES[step]}</h1>

      {step === 0 && (
        <>
          {win && <Confetti />}
          <div className="mt-4 flex flex-col items-center rounded-[32px] bg-white px-5 py-6 text-center shadow-[var(--shadow-lift)]">
            <Sec pose={win ? 'win' : 'plain'} className="w-40" />
            <div className="mt-2 font-display text-[52px] leading-none font-bold text-coral-d">{pct}%</div>
            <div className="mt-1 font-bold text-muted">{done} of {total} done</div>
            <p className="mt-3 font-display text-xl font-semibold">
              {total === 0 ? 'A fresh start.' : win ? 'Win week!' : 'Good effort. Every week is practice.'}
            </p>
            {!win && total > 0 && Math.max(10, Math.ceil(done / 0.8)) < limit && (
              <p className="mt-1 text-sm font-semibold text-muted">
                Smaller weeks are easier to win. You finished {done}; a limit near {Math.max(10, Math.ceil(done / 0.8))} might fit better.
              </p>
            )}
          </div>
          <Footer><Button onClick={() => setStep(1)}>Next</Button></Footer>
        </>
      )}

      {step === 1 && (
        <>
          <p className="mt-1 text-muted">{leftovers.length ? 'Pick what happens to each one. Nothing rolls over on its own.' : 'Nothing left over. Nice!'}</p>
          {leftovers.length > 0 && (
            <button onClick={() => setDecisions(Object.fromEntries(leftovers.map((t) => [t.id, 'next_week'])))}
              className="mt-3 h-10 self-start rounded-full bg-peach px-4 font-display text-[15px] font-semibold">Push all to Next Week</button>
          )}
          <div className="no-scrollbar -mx-[22px] mt-3 flex flex-col gap-2.5 overflow-y-auto px-[22px] pb-2">
            {leftovers.map((t) => (
              <div key={t.id} className="rounded-[22px] bg-white p-3.5 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-2"><b className="leading-snug">{t.title}</b><AgeDot createdAt={t.createdAt} /></div>
                <div className="mt-2.5 flex flex-wrap gap-1" role="radiogroup" aria-label={`What happens to ${t.title}`}>
                  {([['keep', 'Keep', 'bg-coral'], ['next_week', 'Next Week', BUCKET_STYLE.next_week.bg], [later, 'Later', BUCKET_STYLE[later].bg], ['parked', 'Let go', 'bg-lav'], ['trash', 'Delete', 'bg-ink text-white']] as Array<[Decision, string, string]>).map(([d, label, bg]) => (
                    <button key={d} role="radio" aria-checked={decisions[t.id] === d} onClick={() => setDecisions({ ...decisions, [t.id]: d })}
                      className={`h-9 flex-auto whitespace-nowrap rounded-full px-2 font-display text-[13px] font-semibold transition ${decisions[t.id] === d ? `${bg} ring-2 ring-ink ring-offset-1` : 'bg-bg'}`}>{label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Footer>
            <Button disabled={!allDecided} onClick={() => { setPulled((p) => p.slice(0, Math.max(0, room))); setStep(2); }}>
              {allDecided ? 'Next' : `${leftovers.filter((t) => !decisions[t.id]).length} still to decide`}
            </Button>
          </Footer>
        </>
      )}

      {step === 2 && (
        <>
          <p className="mt-1 text-muted">Bring tasks into {fmtRange(newWeek, addDays(newWeek, 6))}, up to your limit.</p>
          <div className="mt-3 rounded-[22px] bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
            <div className="flex items-baseline justify-between"><span className="font-display text-2xl font-bold">{planned} <small className="text-base text-muted">/ {limit}</small></span><span className="text-[13px] font-extrabold text-muted">{kept} kept · {pulled.length} pulled</span></div>
          </div>
          {candidates.length === 0 && <p className="mt-6 text-center font-semibold text-muted">Nothing waiting in Next Week or later this month.</p>}
          <div className="no-scrollbar -mx-[22px] mt-3 flex flex-col gap-2 overflow-y-auto px-[22px] pb-2">
            {candidates.map((t) => {
              const on = pulled.includes(t.id);
              const blocked = !on && planned >= limit;
              return (
                <button key={t.id} disabled={blocked} aria-pressed={on} onClick={() => setPulled(on ? pulled.filter((x) => x !== t.id) : [...pulled, t.id])}
                  className={`flex items-center gap-3 rounded-[20px] border-[2.5px] bg-white px-3.5 py-3 text-left transition disabled:opacity-40 ${on ? 'border-coral-d' : 'border-transparent'}`}>
                  <span className={`grid size-[26px] shrink-0 place-items-center rounded-full ${on ? 'bg-coral-d' : 'border-3 border-line'}`}>{on && <Check size={15} strokeWidth={3.5} className="text-white" />}</span>
                  <span className="flex-1 font-bold leading-snug">{t.title}</span>
                  <span className={`size-3 shrink-0 rounded-[4px] ${BUCKET_STYLE[t.bucket].bg}`} title={t.bucket === 'next_week' ? 'Next Week' : 'Later this month'} />
                  <AgeDot createdAt={t.createdAt} />
                </button>
              );
            })}
          </div>
          {planned >= limit && candidates.length > pulled.length && <p className="mt-2 text-center text-sm font-bold text-coral-d">Week's full. Unpick one to swap.</p>}
          <Footer><Button onClick={() => setStep(3)}>Next</Button></Footer>
        </>
      )}

      {step === 3 && (
        <>
          <p className="mt-1 text-muted">A rough check: about an hour per task.</p>
          <div className="mt-4 rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)]">
            <div className="font-display font-semibold">Free hours next week, outside meetings</div>
            <div className="mt-2 text-center font-display text-[44px] leading-none font-bold text-coral-d">{hours}<span className="text-lg text-muted">h</span></div>
            <Range label="Free hours" value={hours} min={0} max={50} onChange={setHours} />
          </div>
          <div className={`mt-3 flex items-center gap-3 rounded-[24px] p-4 ${planned <= hours ? 'bg-mint-t' : 'bg-peach-t'}`}>
            <Sec pose={planned <= hours ? 'plain' : 'full'} className="w-16 shrink-0" />
            <div>
              <b className="font-display text-lg font-semibold">{planned <= hours ? 'Looks like it fits' : "That's tight"}</b>
              <p className="text-sm font-semibold text-muted">{planned} tasks for about {hours} free hours.{planned > hours && ' Go back and push a few out.'}</p>
            </div>
          </div>
          <Footer>
            {planned > hours && <button onClick={() => setStep(1)} className="mb-2 h-12 w-full rounded-full bg-white font-display font-semibold shadow-[var(--shadow-soft)]">Push some out</button>}
            <Button onClick={() => setStep(4)}>Next</Button>
          </Footer>
        </>
      )}

      {step === 4 && (
        <>
          <motion.div className="mt-4 flex flex-col items-center rounded-[32px] bg-white px-5 py-6 text-center shadow-[var(--shadow-lift)]" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Sec pose="hello" className="w-36" />
            <div className="mt-2 font-display text-[44px] leading-none font-bold text-coral-d">{planned}</div>
            <div className="font-bold text-muted">tasks for {fmtRange(newWeek, addDays(newWeek, 6))}</div>
            <p className="mt-3 text-sm font-semibold text-muted">
              {[
                `${leftovers.filter((t) => decisions[t.id] && !['keep', 'parked', 'trash'].includes(decisions[t.id])).length} pushed later`,
                `${leftovers.filter((t) => decisions[t.id] === 'parked').length} let go`,
                `${leftovers.filter((t) => decisions[t.id] === 'trash').length} deleted`,
              ].join(' · ')}
            </p>
          </motion.div>
          <Footer><Button onClick={lock}>Lock in my week</Button></Footer>
        </>
      )}
    </main>
  );
}

const Footer = ({ children }: { children: ReactNode }) => (
  <>
    <div className="min-h-6 flex-1" />
    <div className="sticky bottom-0 bg-bg pt-2 pb-1">{children}</div>
  </>
);
