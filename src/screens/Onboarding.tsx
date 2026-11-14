import { motion } from 'motion/react';
import { Check, ClipboardList, Plus, Sparkles } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { Sec } from '../components/Sec';
import { SwipeDeck, type Dir } from '../components/SwipeDeck';
import { AgeDot, BackButton, Button, Card, Confetti, DayChips, LinkButton, Steps } from '../components/ui';
import { laterBucket } from '../lib/buckets';
import { addDays, ageDays, bucketRanges, DAY, DAYS_LONG, fmtDay, fmtRange, planningWeekStart, reviewDateFor, weekStartOf } from '../lib/dates';
import { ReviewReminder } from '../components/ReviewReminder';
import { HowItWorks } from './HowItWorks';
import { DEFAULT_SETTINGS, useStore, type Bucket } from '../lib/store';
import { SAMPLE_TASKS } from '../lib/sample';

type Choice = 'this_week' | 'next_week' | 'later' | 'letgo' | 'inbox';
interface Draft { title: string; createdAt: number; choice: Choice | null }
type Source = 'sample' | 'paste' | 'fresh';

const LET_GO_AFTER_DAYS = 60;
/** Rough age for a pasted list, so age dots and the Let go default work on real lists. */
const LIST_AGES: Array<[string, number]> = [['This month', 3], ['A few months', 90], ['Over a year', 400]];

export function Onboarding() {
  const { dispatch } = useStore();
  const startedAt = useRef(Date.now());
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<Source>('sample');
  const [paste, setPaste] = useState('');
  const [pasteAge, setPasteAge] = useState(LIST_AGES[0][1]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [i, setI] = useState(0);
  const [exitDir, setExitDir] = useState<Dir | null>(null);
  const [reviewDay, setReviewDay] = useState(DEFAULT_SETTINGS.reviewDay);

  const now = Date.now();
  const planStart = planningWeekStart(now, DEFAULT_SETTINGS.weekStartDay);
  const lateWeek = planStart !== weekStartOf(now, DEFAULT_SETTINGS.weekStartDay);
  const ranges = bucketRanges(planStart);
  const later = laterBucket(planStart);
  const firstReview = reviewDateFor(planStart, reviewDay, DEFAULT_SETTINGS.weekStartDay);
  const picksThisWeek = drafts.filter((d) => d.choice === 'this_week').length;
  const count = (c: Choice) => drafts.filter((d) => d.choice === c).length;

  const bring = () => {
    if (source === 'fresh') { setDrafts([]); setStep(4); return; }
    const list: Draft[] = source === 'sample'
      ? SAMPLE_TASKS.map(([title, age]) => ({ title, createdAt: now - age * DAY, choice: null }))
      : paste.split('\n').map((l) => l.replace(/^\s*([-*•]|\d+[.)])\s*/, '').trim()).filter(Boolean).map((title) => ({ title, createdAt: now - pasteAge * DAY, choice: null }));
    setDrafts(list); setI(0); setStep(3);
  };

  const choose = (c: Choice, dir: Dir | null = null) => {
    setExitDir(dir);
    setDrafts((ds) => ds.map((d, n) => (n === i ? { ...d, choice: c } : d)));
    if (i + 1 >= drafts.length) setTimeout(() => setStep(4), 200);
    setI(i + 1);
  };
  const undo = () => {
    if (i === 0) { setStep(2); return; }
    setExitDir(null);
    setDrafts((ds) => ds.map((d, n) => (n === i - 1 ? { ...d, choice: null } : d)));
    setI(i - 1);
  };
  /** Back from "Set your week": reopen the last sorted card (or the "sort later" point). */
  const backToSort = () => {
    if (!drafts.length) { setStep(2); return; }
    const k = Math.max(0, Math.min(i, drafts.length) - 1);
    setExitDir(null);
    setDrafts((ds) => ds.map((d, n) => (n >= k ? { ...d, choice: null } : d)));
    setI(k);
    setStep(3);
  };
  const sortLater = () => {
    setDrafts((ds) => ds.map((d, n) => (n >= i ? { ...d, choice: 'inbox' } : d)));
    setStep(4);
  };

  const finish = () => {
    const map: Record<Choice, Bucket> = { this_week: 'this_week', next_week: 'next_week', later, letgo: 'parked', inbox: 'inbox' };
    dispatch({
      type: 'onboard',
      tasks: drafts.map((d) => ({ title: d.title, createdAt: d.createdAt, bucket: map[d.choice ?? 'inbox'] })),
      reviewDay,
      minutes: Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)),
    });
  };

  /* ---------------- screens ---------------- */

  if (step === 0)
    return (
      <Shell>
        <div className="relative mt-4 grid h-[330px] place-items-center">
          <div className="absolute top-1/2 left-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral-t" />
          <motion.div className="relative w-[230px]" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 14 }}>
            <Sec pose="hello" label="Sec waving hello" />
          </motion.div>
        </div>
        <div className="flex-1" />
        <h1 className="text-center font-display text-[30px] leading-tight font-bold">Hi, I'm Sec!</h1>
        <p className="mt-2 text-center text-base text-muted">I help you plan a week that actually fits.</p>
        <div className="h-7" />
        <Button onClick={() => setStep(1)}>Let's go</Button>
      </Shell>
    );

  if (step === 1) return <HowItWorks reviewDay={reviewDay} onBack={() => setStep(0)} onDone={() => setStep(2)} doneLabel="Let’s set up" />;

  if (step === 2)
    return (
      <Shell>
        <div className="mb-4 flex items-center gap-3"><BackButton onClick={() => setStep(1)} /><Steps n={1} of={4} /></div>
        <h1 className="font-display text-[30px] leading-tight font-bold">Bring your tasks</h1>
        <p className="mt-2 text-muted">You'll sort them together next.</p>
        <div className="mt-6 flex flex-col gap-3" role="radiogroup" aria-label="Where tasks come from">
          <Option on={source === 'sample'} onClick={() => setSource('sample')} icon={<Sparkles size={24} className="text-coral-d" />} tint="bg-coral-t"
            title="Try sample tasks" sub={`${SAMPLE_TASKS.length} everyday tasks, some old`} />
          <Option on={source === 'paste'} onClick={() => setSource('paste')} icon={<ClipboardList size={24} className="text-[#2F6FB3]" />} tint="bg-sky-t"
            title="Paste a list" sub="One task per line" />
          {source === 'paste' && (
            <textarea value={paste} onChange={(e) => setPaste(e.target.value)} autoFocus rows={5} aria-label="Your tasks, one per line"
              placeholder={'Book dentist\nRenew passport\nCall the bank'}
              className="w-full resize-none rounded-[22px] border-0 bg-white p-4 text-base shadow-[var(--shadow-soft)] outline-none focus:ring-3 focus:ring-coral" />
          )}
          {source === 'paste' && (
            <div>
              <div className="px-1 font-display text-[15px] font-semibold">How old is this list?</div>
              <div className="mt-2 flex gap-2" role="radiogroup" aria-label="How old is this list">
                {LIST_AGES.map(([label, days]) => (
                  <button key={label} role="radio" aria-checked={pasteAge === days} onClick={() => setPasteAge(days)}
                    className={`h-10 flex-1 rounded-full font-display text-[14px] font-semibold transition ${pasteAge === days ? 'bg-coral-d text-white' : 'bg-white shadow-[var(--shadow-soft)]'}`}>{label}</button>
                ))}
              </div>
              <p className="mt-2 px-1 text-[13px] font-bold text-muted">Older tasks start set to Let go, so you can clear them out fast.</p>
            </div>
          )}
          <Option on={source === 'fresh'} onClick={() => setSource('fresh')} icon={<Plus size={24} className="text-[#2E8A5C]" />} tint="bg-mint-t"
            title="Start fresh" sub="Empty week, clean slate" />
        </div>
        <div className="flex-1" />
        <Button className="mt-6" disabled={source === 'paste' && !paste.trim()} onClick={bring}>
          {source === 'fresh' ? 'Continue' : 'Start sorting'}
        </Button>
      </Shell>
    );

  if (step === 3) {
    const d = drafts[Math.min(i, drafts.length - 1)];
    const old = d && ageDays(d.createdAt) > LET_GO_AFTER_DAYS;
    const btn = 'flex h-[60px] items-center justify-center gap-1.5 rounded-full font-display text-base font-semibold shadow-[var(--shadow-soft)] transition active:scale-[.97] disabled:opacity-40';
    return (
      <Shell>
        <div className="mb-3 flex items-center gap-3"><BackButton onClick={undo} label={i === 0 ? 'Back' : 'Undo last'} /><Steps n={2} of={4} /></div>
        <div className="flex items-center gap-2">
          <Sec pose="when" className="w-16 shrink-0" />
          <div>
            <h1 className="font-display text-[22px] font-semibold">When?</h1>
            <div className="text-sm font-extrabold text-muted">Task {Math.min(i + 1, drafts.length)} of {drafts.length} · {picksThisWeek} this week</div>
          </div>
        </div>
        {lateWeek && <p className="mt-2 text-[13px] font-bold text-muted">It's late in the week, so This Week means your upcoming week, {ranges.thisWeek}.</p>}
        <div className="mt-3">
          {d && (
            <SwipeDeck cardKey={String(i)} exitDir={exitDir} height={old ? 250 : 210} left="Later" right="This Week"
              onSwipe={(dir) => (dir === 'right' ? choose('this_week', 'right') : choose('later', 'left'))}>
              <AgeDot createdAt={d.createdAt} long />
              <div className="mt-3 font-display text-[25px] leading-tight font-semibold">{d.title}</div>
              {old && <p className="mt-3 rounded-2xl bg-lav-t px-3 py-2.5 text-sm leading-snug font-bold text-[#4E4380]">It's been waiting a while, so it's set to <b>Let go</b>. Pick another to keep it.</p>}
            </SwipeDeck>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          <button className={`${btn} bg-coral`} onClick={() => choose('this_week', 'right')}><Label sub={ranges.thisWeek}>This Week</Label></button>
          <button className={`${btn} bg-peach`} onClick={() => choose('next_week')}><Label sub={ranges.nextWeek}>Next Week</Label></button>
          <button className={`${btn} ${later === 'this_month' ? 'bg-mint' : 'bg-sky'}`} onClick={() => choose('later', 'left')}><Label sub={later === 'this_month' ? ranges.later! : ranges.nextMonth}>Later</Label></button>
          <button className={`${btn} bg-lav ${old ? 'outline-4 outline-offset-2 outline-ink' : ''}`} onClick={() => choose('letgo')}>
            {old && <Check size={18} strokeWidth={3} />}<Label sub="Parked, not deleted">Let go</Label>
          </button>
        </div>
        <div className="flex-1" />
        <p className="mt-4 text-center text-sm font-semibold text-muted">Swipe right for This Week, left for Later.</p>
        <LinkButton className="mx-auto pb-0" onClick={sortLater}>Sort the rest later</LinkButton>
      </Shell>
    );
  }

  if (step === 4)
    return (
      <Shell>
        <div className="mb-4 flex items-center gap-3"><BackButton onClick={backToSort} /><Steps n={3} of={4} /></div>
        <h1 className="font-display text-[30px] leading-tight font-bold">Set your week</h1>
        <p className="mt-2 text-muted">One choice, and you can change it later.</p>
        <Card className="mt-5 flex items-center gap-3 bg-lav-t">
          <Sec pose="when" className="w-16 shrink-0" />
          <div>
            <div className="font-display text-[17px] font-semibold">Your first week is a learning week</div>
            <p className="mt-1 text-sm font-semibold text-muted">{fmtRange(planStart, addDays(planStart, 6))}. No limit yet. Sec counts what you finish, then suggests a limit at your first review.</p>
          </div>
        </Card>
        <Card className="mt-3.5">
          <div className="font-display text-[17px] font-semibold">Review day</div>
          <DayChips label="Review day" value={reviewDay} onChange={setReviewDay} />
          <p className="mt-2.5 text-sm font-semibold text-muted">Every {DAYS_LONG[reviewDay]}, a few minutes to close the week and plan the next. Your first review is <b className="text-ink">{fmtDay(firstReview)}</b>.</p>
        </Card>
        <div className="flex-1" />
        <Button className="mt-6" onClick={() => setStep(5)}>Looks good</Button>
      </Shell>
    );

  // step 5: done
  const minutes = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
  const tw = count('this_week'), lg = count('letgo');
  const rest = [count('next_week') && `${count('next_week')} next week`, count('later') && `${count('later')} later`, count('inbox') && `${count('inbox')} in your Inbox`].filter(Boolean);
  return (
    <Shell className="bg-mint-t">
      <Confetti />
      <motion.div className="mx-auto mt-2 w-[190px]" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 10 }}>
        <Sec pose="win" label="Sec celebrating" />
      </motion.div>
      <h1 className="mt-2 text-center font-display text-[30px] leading-tight font-bold">You're all set!</h1>
      <p className="mt-2 mb-5 text-center text-muted">
        {drafts.length ? `${drafts.length} tasks sorted in ${minutes} minute${minutes === 1 ? '' : 's'}.` : 'A clean week, ready to fill.'}
      </p>
      <div className="flex items-center justify-center gap-3.5 rounded-[26px] bg-white px-4 py-4">
        <b className="font-display text-[40px] leading-none text-coral-d">{tw}</b>
        <div><div className="font-display text-[17px] font-semibold">this week</div><div className="text-[13px] font-bold text-muted">{fmtRange(planStart, addDays(planStart, 6))} · learning week</div></div>
      </div>
      {lg > 0 && (
        <div className="mt-2.5 flex items-center justify-center gap-3.5 rounded-[26px] bg-lav-t px-4 py-4">
          <b className="font-display text-[40px] leading-none text-[#5B4BB8]">{lg}</b>
          <div><div className="font-display text-[17px] font-semibold">let go</div><div className="text-[13px] font-bold text-muted">Parked safely, restore anytime</div></div>
        </div>
      )}
      {rest.length > 0 && <p className="mt-3 text-center text-sm font-semibold text-muted">Plus {rest.join(' and ')}.</p>}
      <ReviewReminder firstReview={firstReview} />
      <div className="flex-1" />
      <Button className="mt-6" onClick={finish}>See my week</Button>
    </Shell>
  );
}

/* ---------------- pieces ---------------- */

function Shell({ children, className = 'bg-bg' }: { children: ReactNode; className?: string }) {
  return <main className={`pb-safe relative mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden px-[22px] pt-6 ${className}`}>{children}</main>;
}

function Option({ on, onClick, icon, tint, title, sub }: { on: boolean; onClick: () => void; icon: ReactNode; tint: string; title: string; sub: string }) {
  return (
    <button role="radio" aria-checked={on} onClick={onClick}
      className={`flex items-center gap-3.5 rounded-[26px] border-3 bg-white p-4 text-left transition ${on ? 'border-coral shadow-[var(--shadow-lift)]' : 'border-transparent shadow-[var(--shadow-soft)]'}`}>
      <span className={`grid size-[52px] shrink-0 place-items-center rounded-[18px] ${tint}`}>{icon}</span>
      <span className="flex-1"><b className="block font-display text-lg font-semibold">{title}</b><small className="text-sm font-semibold text-muted">{sub}</small></span>
      <span className={`grid size-[26px] shrink-0 place-items-center rounded-full ${on ? 'bg-coral-d' : 'border-3 border-line'}`}>{on && <Check size={15} strokeWidth={3.5} className="text-white" />}</span>
    </button>
  );
}

const Label = ({ children, sub }: { children: ReactNode; sub: string }) => (
  <span className="flex flex-col items-center leading-tight">{children}<small className="font-sans text-[11px] font-extrabold opacity-70">{sub}</small></span>
);
