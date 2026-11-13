import { Check, Minus, Plus } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Sec } from '../components/Sec';
import { AgeDot, BackButton, Button, Confetti, Steps } from '../components/ui';
import { BUCKET_STYLE, laterBucket } from '../lib/buckets';
import { addDays, DAYS_LONG, fmtRange, planningWeekStart } from '../lib/dates';
import { byOldest, doneThisWeek, inBucket, MAX_LIMIT, MIN_LIMIT, openThisWeek, reviewDate, reviewDue, suggestLimit, useStore, weekCount, winAt, type Bucket } from '../lib/store';

type Decision = 'keep' | Bucket;

export function Review({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const startedAt = useRef(Date.now());
  const [step, setStep] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [pulled, setPulled] = useState<string[]>([]);

  // Snapshot the week as it was when the review started.
  const leftovers = useMemo(() => openThisWeek(state).sort(byOldest), []);
  const done = doneThisWeek(state).length;
  const total = weekCount(state);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const win = total > 0 && done >= winAt(total);

  const calibrating = state.calibrating;
  const suggested = total === 0 ? 10 : suggestLimit(done);
  const [newLimit, setNewLimit] = useState(suggested);
  const limit = calibrating ? newLimit : state.settings.limit;

  const newWeek = planningWeekStart(Date.now(), state.settings.weekStartDay);
  const weekLabel = fmtRange(newWeek, addDays(newWeek, 6));
  const later = laterBucket(newWeek);
  const kept = leftovers.filter((t) => decisions[t.id] === 'keep').length;
  const candidates = [...inBucket(state, 'next_week'), ...inBucket(state, 'this_month')].sort(byOldest);
  const planned = kept + pulled.length;
  const over = planned - limit;
  const allDecided = leftovers.every((t) => decisions[t.id]);
  const count = (pred: (d: Decision | undefined) => boolean) => leftovers.filter((t) => pred(decisions[t.id])).length;

  const lock = () => {
    const moves: Record<string, Bucket> = {};
    for (const t of leftovers) { const d = decisions[t.id]; if (d && d !== 'keep') moves[t.id] = d; }
    for (const id of pulled) moves[id] = 'this_week';
    dispatch({
      type: 'lockWeek', moves, score: pct, limit: calibrating ? newLimit : undefined,
      minutes: Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)),
    });
    onClose();
  };

  if (!reviewDue(state)) {
    const opens = reviewDate(state);
    const when = `${DAYS_LONG[new Date(opens).getDay()]}, ${fmtRange(opens, opens)}`;
    return (
      <main className="pb-safe relative mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden px-[22px] pt-6">
        <div className="mb-4"><BackButton label="Close review" onClick={onClose} /></div>
        <div className="text-sm font-extrabold text-muted">Weekly review</div>
        <h1 className="font-display text-[30px] leading-tight font-bold">Not quite yet</h1>
        <div className="mt-4 flex flex-col items-center rounded-[32px] bg-white px-5 py-6 text-center shadow-[var(--shadow-lift)]">
          <Sec pose="when" className="w-32" />
          <p className="mt-2 font-display text-xl font-semibold">
            {calibrating ? `Your learning week runs until ${when}.` : `Your review opens ${when}.`}
          </p>
          <p className="mt-1 text-sm font-semibold text-muted">
            {done} of {total} done so far. {calibrating ? 'Then Sec suggests a limit from what you finished.' : 'Keep going!'}
          </p>
        </div>
        <p className="mt-3 text-center text-sm font-semibold text-muted">You can change your review day in Settings.</p>
        <Footer><Button onClick={onClose}>Back to my week</Button></Footer>
      </main>
    );
  }

  const titles = [calibrating ? 'Your learning week' : 'How did it go?', 'Leftovers', 'Plan next week'];

  return (
    <main className="pb-safe relative mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden px-[22px] pt-6">
      <div className="mb-4 flex items-center gap-3">
        <BackButton label={step === 0 ? 'Close review' : 'Back'} onClick={() => (step === 0 ? onClose() : setStep(step - 1))} />
        <Steps n={step + 1} of={3} />
      </div>
      <div className="text-sm font-extrabold text-muted">Weekly review · step {step + 1} of 3</div>
      <h1 className="font-display text-[30px] leading-tight font-bold">{titles[step]}</h1>

      {step === 0 && calibrating && (
        <>
          <div className="mt-4 flex flex-col items-center rounded-[32px] bg-white px-5 py-6 text-center shadow-[var(--shadow-lift)]">
            <Sec pose="when" className="w-32" />
            <p className="mt-2 font-display text-xl font-semibold">
              {total === 0 ? 'Nothing planned yet, so here’s a starting point.' : `You finished ${done} of ${total}.`}
            </p>
            <p className="mt-1 text-sm font-semibold text-muted">Let’s set your week limit from that.</p>
            <div className="mt-4 flex items-center gap-5">
              <StepButton label="Lower limit" disabled={newLimit <= MIN_LIMIT} onClick={() => setNewLimit(newLimit - 1)}><Minus size={22} strokeWidth={3} /></StepButton>
              <div className="w-20 font-display text-[52px] leading-none font-bold text-coral-d" aria-live="polite">{newLimit}</div>
              <StepButton label="Raise limit" disabled={newLimit >= MAX_LIMIT} onClick={() => setNewLimit(newLimit + 1)}><Plus size={22} strokeWidth={3} /></StepButton>
            </div>
            <div className="mt-1 font-bold text-muted">tasks a week</div>
            <p className="mt-3 text-sm font-semibold text-muted">
              {total > 0 && winAt(newLimit) === done
                ? `Finish ${done} again and it’s a win week.`
                : `A win week means finishing ${winAt(newLimit)} of ${newLimit}.`}
            </p>
          </div>
          <Footer><Button onClick={() => setStep(1)}>Use {newLimit} and continue</Button></Footer>
        </>
      )}

      {step === 0 && !calibrating && (
        <>
          {win && <Confetti />}
          <div className="mt-4 flex flex-col items-center rounded-[32px] bg-white px-5 py-6 text-center shadow-[var(--shadow-lift)]">
            <Sec pose={win ? 'win' : 'plain'} className="w-40" />
            <div className="mt-2 font-display text-[52px] leading-none font-bold text-coral-d">{pct}%</div>
            <div className="mt-1 font-bold text-muted">{done} of {total} done</div>
            <p className="mt-3 font-display text-xl font-semibold">
              {total === 0 ? 'A fresh start.' : win ? 'Win week!' : 'Good effort. Every week is practice.'}
            </p>
            {!win && total > 0 && suggestLimit(done) < limit && (
              <p className="mt-1 text-sm font-semibold text-muted">Smaller weeks are easier to win. A limit of {suggestLimit(done)} would fit what you finished.</p>
            )}
          </div>
          <Footer><Button onClick={() => setStep(1)}>Next</Button></Footer>
        </>
      )}

      {step === 1 && (
        <>
          <p className="mt-1 text-muted">{leftovers.length ? 'Pick what happens to each one. Nothing rolls over on its own.' : 'Nothing left over. Nice!'}</p>
          {leftovers.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <button onClick={() => setDecisions(Object.fromEntries(leftovers.map((t) => [t.id, 'next_week'])))}
                className="h-10 rounded-full bg-peach px-4 font-display text-[15px] font-semibold">Push all to Next Week</button>
              <span className={`text-[13px] font-extrabold ${kept > limit ? 'text-coral-d' : 'text-muted'}`}>Keeping {kept} of {limit}</span>
            </div>
          )}
          <div className="no-scrollbar -mx-[22px] mt-3 flex flex-col gap-2.5 overflow-y-auto px-[22px] pb-2">
            {leftovers.map((t) => (
              <div key={t.id} className="rounded-[22px] bg-white p-3.5 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-2"><b className="leading-snug">{t.title}</b><AgeDot createdAt={t.createdAt} /></div>
                <div className="mt-2.5 flex flex-wrap gap-1" role="radiogroup" aria-label={`What happens to ${t.title}`}>
                  {([['keep', 'Keep', 'bg-coral'], ['next_week', 'Next Week', BUCKET_STYLE.next_week.bg], [later, 'Later', BUCKET_STYLE[later].bg], ['parked', 'Let go', 'bg-lav'], ['trash', 'Delete', 'bg-ink text-white']] as Array<[Decision, string, string]>).map(([d, label, bg]) => (
                    <button key={d} role="radio" aria-checked={decisions[t.id] === d} onClick={() => setDecisions({ ...decisions, [t.id]: d })}
                      className={`h-9 flex-auto rounded-full px-2 font-display text-[13px] font-semibold whitespace-nowrap transition ${decisions[t.id] === d ? `${bg} ring-2 ring-ink ring-offset-1` : 'bg-bg'}`}>{label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Footer>
            <Button disabled={!allDecided} onClick={() => setStep(2)}>
              {allDecided ? 'Next' : `${leftovers.filter((t) => !decisions[t.id]).length} still to decide`}
            </Button>
          </Footer>
        </>
      )}

      {step === 2 && (
        <>
          <p className="mt-1 text-muted">Bring tasks into {weekLabel}, up to your limit.</p>
          <div className="mt-3 rounded-[22px] bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl font-bold">{planned} <small className="text-base text-muted">/ {limit}</small></span>
              <span className="text-[13px] font-extrabold text-muted">{kept} kept · {pulled.length} pulled</span>
            </div>
            {leftovers.length > 0 && (
              <p className="mt-1 text-[13px] font-bold text-muted">
                {count((d) => !!d && !['keep', 'parked', 'trash'].includes(d))} pushed later · {count((d) => d === 'parked')} let go · {count((d) => d === 'trash')} deleted
              </p>
            )}
          </div>
          {over > 0 && (
            <div className="mt-3 rounded-[20px] bg-peach-t px-4 py-3 text-sm font-bold">
              That’s {over} over your limit. <button className="underline underline-offset-2" onClick={() => setStep(1)}>Push {over === 1 ? 'one' : 'some'} back</button>
            </div>
          )}
          {candidates.length === 0 && <p className="mt-6 text-center font-semibold text-muted">Nothing waiting in Next Week or later this month.</p>}
          <div className="no-scrollbar -mx-[22px] mt-3 flex flex-col gap-2 overflow-y-auto px-[22px] pb-2">
            {candidates.map((t) => {
              const on = pulled.includes(t.id);
              const blocked = !on && planned >= limit;
              return (
                <button key={t.id} disabled={blocked} aria-pressed={on} onClick={() => setPulled(on ? pulled.filter((x) => x !== t.id) : [...pulled, t.id])}
                  className={`flex items-center gap-3 rounded-[20px] border-[2.5px] bg-white px-3.5 py-3 text-left transition disabled:opacity-40 ${on ? 'border-coral-d' : 'border-transparent'}`}>
                  <span className={`grid size-[26px] shrink-0 place-items-center rounded-full ${on ? 'bg-coral-d' : 'border-3 border-line'}`}>{on && <Check size={15} strokeWidth={3.5} className="text-white" />}</span>
                  <span className="flex-1 leading-snug font-bold">{t.title}</span>
                  <span className={`size-3 shrink-0 rounded-[4px] ${BUCKET_STYLE[t.bucket].bg}`} title={t.bucket === 'next_week' ? 'Next Week' : 'Later this month'} />
                  <AgeDot createdAt={t.createdAt} />
                </button>
              );
            })}
          </div>
          <Footer><Button disabled={over > 0} onClick={lock}>Lock in my week</Button></Footer>
        </>
      )}
    </main>
  );
}

const StepButton = ({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) => (
  <button aria-label={label} disabled={disabled} onClick={onClick}
    className="grid size-12 place-items-center rounded-full bg-bg transition active:scale-95 disabled:opacity-30">{children}</button>
);

const Footer = ({ children }: { children: ReactNode }) => (
  <>
    <div className="min-h-6 flex-1" />
    <div className="sticky bottom-0 bg-bg pt-2 pb-1">{children}</div>
  </>
);
