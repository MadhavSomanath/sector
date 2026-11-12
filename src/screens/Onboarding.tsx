import { motion } from 'motion/react';
import { Check, ClipboardList, Plus, Sparkles } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { Sec } from '../components/Sec';
import { SwipeDeck, type Dir } from '../components/SwipeDeck';
import { AgeDot, BackButton, Button, Card, Confetti, DayChips, LinkButton, Range, Steps } from '../components/ui';
import { laterBucket } from '../lib/buckets';
import { addDays, ageDays, bucketRanges, DAY, fmtRange, planningWeekStart, weekStartOf } from '../lib/dates';
import { DEFAULT_SETTINGS, useStore, type Bucket } from '../lib/store';
import { SAMPLE_TASKS } from '../lib/sample';

type Choice = 'this_week' | 'next_week' | 'later' | 'letgo' | 'inbox';
interface Draft { title: string; createdAt: number; choice: Choice | null }
type Source = 'sample' | 'paste' | 'fresh';

const LET_GO_AFTER_DAYS = 60;

export function Onboarding() {
  const { dispatch } = useStore();
  const startedAt = useRef(Date.now());
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<Source>('sample');
  const [paste, setPaste] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [i, setI] = useState(0);
  const [exitDir, setExitDir] = useState<Dir | null>(null);
  const [limit, setLimit] = useState(DEFAULT_SETTINGS.limit);
  const [reviewDay, setReviewDay] = useState(DEFAULT_SETTINGS.reviewDay);

  const now = Date.now();
  const planStart = planningWeekStart(now, DEFAULT_SETTINGS.weekStartDay);
  const lateWeek = planStart !== weekStartOf(now, DEFAULT_SETTINGS.weekStartDay);
  const ranges = bucketRanges(planStart);
  const picksThisWeek = drafts.filter((d) => d.choice === 'this_week').length;
  const count = (c: Choice) => drafts.filter((d) => d.choice === c).length;

  const bring = () => {
    if (source === 'fresh') { setDrafts([]); setStep(4); return; }
    const list: Draft[] = source === 'sample'
      ? SAMPLE_TASKS.map(([title, age]) => ({ title, createdAt: now - age * DAY, choice: null }))
      : paste.split('\n').map((l) => l.replace(/^\s*([-*•]|\d+[.)])\s*/, '').trim()).filter(Boolean).map((title) => ({ title, createdAt: now, choice: null }));
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
    const map: Record<Choice, Bucket> = { this_week: 'this_week', next_week: 'next_week', later: laterBucket(planStart), letgo: 'parked', inbox: 'inbox' };
    dispatch({
      type: 'onboard',
      tasks: drafts.map((d) => ({ title: d.title, createdAt: d.createdAt, bucket: map[d.choice ?? 'inbox'] })),
      settings: { ...DEFAULT_SETTINGS, limit, reviewDay },
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

  if (step === 1) return <Idea onBack={() => setStep(0)} onDone={() => setStep(2)} />;

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
    const weekFull = picksThisWeek >= limit;
    const btn = 'flex h-14 items-center justify-center gap-1.5 rounded-full font-display text-base font-semibold shadow-[var(--shadow-soft)] transition active:scale-[.97] disabled:opacity-40';
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
              onSwipe={(dir) => (dir === 'right' ? (weekFull ? undefined : choose('this_week', 'right')) : choose('later', 'left'))}>
              <AgeDot createdAt={d.createdAt} long />
              <div className="mt-3 font-display text-[25px] leading-tight font-semibold">{d.title}</div>
              {old && <p className="mt-3 rounded-2xl bg-lav-t px-3 py-2.5 text-sm leading-snug font-bold text-[#4E4380]">It's been waiting a while, so it's set to <b>Let go</b>. Pick another to keep it.</p>}
            </SwipeDeck>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          <button className={`${btn} bg-coral`} disabled={weekFull} onClick={() => choose('this_week', 'right')}>{weekFull ? 'Week full' : 'This Week'}</button>
          <button className={`${btn} bg-peach`} onClick={() => choose('next_week')}>Next Week</button>
          <button className={`${btn} bg-mint`} onClick={() => choose('later', 'left')}>Later</button>
          <button className={`${btn} bg-lav ${old ? 'outline-4 outline-offset-2 outline-ink' : ''}`} onClick={() => choose('letgo')}>
            {old && <Check size={18} strokeWidth={3} />}Let go
          </button>
        </div>
        <div className="flex-1" />
        <p className="mt-4 text-center text-sm font-semibold text-muted">Let go = parked, never lost. Bring it back anytime.</p>
        <LinkButton className="mx-auto pb-0" onClick={sortLater}>Sort the rest later</LinkButton>
      </Shell>
    );
  }

  if (step === 4)
    return (
      <Shell>
        <div className="mb-4 flex items-center gap-3"><BackButton onClick={backToSort} /><Steps n={3} of={4} /></div>
        <h1 className="font-display text-[30px] leading-tight font-bold">Set your week</h1>
        <p className="mt-2 text-muted">You can change these later.</p>
        <Card className="mt-5">
          <div className="font-display text-[17px] font-semibold">Week limit</div>
          <div className="mt-3 text-center font-display text-[52px] leading-none font-bold text-coral-d">{limit} <span className="text-lg font-semibold text-muted">tasks</span></div>
          <div className="mt-3"><Range label="Week limit" value={limit} min={Math.max(10, picksThisWeek)} max={60} onChange={setLimit} /></div>
          <div className="flex justify-between text-[13px] font-extrabold text-muted"><span>{Math.max(10, picksThisWeek)}</span><span>60</span></div>
          <p className="mt-2 text-sm font-semibold text-muted">Most people start with 20.</p>
        </Card>
        <Card className="mt-3.5">
          <div className="font-display text-[17px] font-semibold">Review day</div>
          <DayChips label="Review day" value={reviewDay} onChange={setReviewDay} />
          <p className="mt-2.5 text-sm font-semibold text-muted">10 minutes to plan the next week. Weeks run Mon – Sun.</p>
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
        <div><div className="font-display text-[17px] font-semibold">this week</div><div className="text-[13px] font-bold text-muted">{limit - tw > 0 ? `Room for ${limit - tw} more` : 'Full week'} · {fmtRange(planStart, addDays(planStart, 6))}</div></div>
      </div>
      {lg > 0 && (
        <div className="mt-2.5 flex items-center justify-center gap-3.5 rounded-[26px] bg-lav-t px-4 py-4">
          <b className="font-display text-[40px] leading-none text-[#5B4BB8]">{lg}</b>
          <div><div className="font-display text-[17px] font-semibold">let go</div><div className="text-[13px] font-bold text-muted">Parked safely, restore anytime</div></div>
        </div>
      )}
      {rest.length > 0 && <p className="mt-3 text-center text-sm font-semibold text-muted">Plus {rest.join(' and ')}.</p>}
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

const SLIDES = [
  { title: <>Ask <span className="text-coral-d">when</span>, not what</>, sub: "Every task gets one slot in time. That's the only folder." },
  { title: <>Your week has a limit</>, sub: "When it's full, something moves out. No more fantasy weeks." },
  { title: <>80% is a win</>, sub: "Finish most of your week and it counts. Nobody's perfect." },
];

function Idea({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const go = (k: number) => ref.current?.scrollTo({ left: k * ref.current.clientWidth, behavior: 'smooth' });
  return (
    <Shell>
      <div className="mb-3.5 flex h-10 items-center"><BackButton onClick={onBack} /><div className="flex-1" /><LinkButton className="p-0" onClick={onDone}>Skip</LinkButton></div>
      <div ref={ref} className="no-scrollbar -mx-[22px] flex flex-1 snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => setN(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
        {SLIDES.map((s, k) => (
          <section key={k} className="flex w-full shrink-0 snap-center flex-col px-[22px]" aria-label={`${k + 1} of 3`}>
            <div className={`relative grid h-[330px] place-items-center overflow-hidden rounded-[32px] shadow-[var(--shadow-lift)] ${k === 2 ? 'bg-mint-t' : 'bg-white'}`}>
              {k === 0 && (
                <div className="flex w-[230px] flex-col gap-2">
                  {[['bg-coral', 'This Week'], ['bg-peach', 'Next Week'], ['bg-mint', 'Later this month'], ['bg-sky', 'Next Month'], ['bg-lav', 'On Hold']].map(([c, l], j) => (
                    <div key={l} className={`flex h-[42px] items-center rounded-full px-[18px] font-display text-[15px] font-semibold ${c}`} style={{ marginLeft: j * 12 }}>{l}</div>
                  ))}
                </div>
              )}
              {k === 1 && (
                <>
                  <div className="grid grid-cols-5 gap-2.5">{Array.from({ length: 20 }, (_, j) => <span key={j} className={`size-[30px] rounded-[10px] ${j < 14 ? 'bg-coral' : 'bg-coral-t'}`} />)}</div>
                  <div className="absolute bottom-5 rounded-full bg-bg px-3.5 py-1.5 font-display font-semibold">14 / 20</div>
                </>
              )}
              {k === 2 && (
                <>
                  <Sec pose="win" className="w-[200px]" />
                  <div className="absolute bottom-5 rounded-full bg-white px-3.5 py-1.5 font-display font-semibold">16 of 20 = win week!</div>
                </>
              )}
            </div>
            <h2 className="mt-6 font-display text-[30px] leading-tight font-bold">{s.title}</h2>
            <p className="mt-2 text-muted">{s.sub}</p>
          </section>
        ))}
      </div>
      <div className="my-5 flex justify-center gap-1.5" aria-hidden>
        {SLIDES.map((_, k) => <span key={k} className={`h-2 rounded-full transition-all ${k === n ? 'w-[22px] bg-coral' : 'w-2 bg-line'}`} />)}
      </div>
      <Button onClick={() => {
        const el = ref.current;
        const at = el ? Math.round(el.scrollLeft / el.clientWidth) : n;
        if (at < 2) go(at + 1); else onDone();
      }}>{n < 2 ? 'Next' : 'Got it'}</Button>
    </Shell>
  );
}
