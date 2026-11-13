import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BUCKET_NAME, BUCKET_STYLE, laterBucket, moveTargets } from '../lib/buckets';
import { DAYS_LONG } from '../lib/dates';
import { byOldest, MAX_LIMIT, MIN_LIMIT, openThisWeek, uid, useStore, weekCount, type Bucket } from '../lib/store';
import { useUI } from '../lib/ui';
import { Sec } from './Sec';
import { AgeDot, Button, DayChips, LinkButton, Range, Sheet } from './ui';

const chip = 'inline-flex h-9 items-center rounded-full px-3.5 font-display text-[15px] font-semibold transition';

/* ---------------- Add ---------------- */

const SHORTCUTS: Record<string, Bucket> = { '!tw': 'this_week', '!nw': 'next_week', '!tm': 'this_month', '!nm': 'next_month', '!oh': 'on_hold' };

export function AddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { placeThisWeek } = useUI();
  const [title, setTitle] = useState('');
  const [bucket, setBucket] = useState<Bucket>('inbox');
  const [added, setAdded] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const later = laterBucket(state.planWeekStart);
  const choices: Array<{ b: Bucket; label: string }> = [
    { b: 'inbox', label: 'Decide later' }, { b: 'this_week', label: 'This Week' }, { b: 'next_week', label: 'Next Week' }, { b: later, label: 'Later' },
  ];

  useEffect(() => { if (open) { setTitle(''); setBucket('inbox'); setAdded(null); } }, [open]);

  const submit = () => {
    let t = title, b = bucket;
    for (const [k, v] of Object.entries(SHORTCUTS)) if (t.toLowerCase().includes(k)) { b = v; t = t.replace(new RegExp(k, 'ig'), ''); }
    t = t.replace(/\s+/g, ' ').trim();
    if (!t) return;
    const id = uid();
    dispatch({ type: 'add', id, title: t, bucket: b === 'this_week' ? 'inbox' : b });
    setTitle('');
    if (b === 'this_week' && !placeThisWeek(id)) { onClose(); return; }
    setAdded(`Added to ${BUCKET_NAME[b]}`);
    input.current?.focus();
  };

  return (
    <Sheet open={open} onClose={onClose} label="Add a task">
      <h2 className="mt-1 font-display text-2xl font-semibold">Add a task</h2>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <input ref={input} autoFocus value={title} onChange={(e) => { setTitle(e.target.value); setAdded(null); }} placeholder="What is it?" aria-label="Task title"
          className="h-14 min-w-0 flex-1 rounded-full bg-white px-5 text-base font-semibold shadow-[var(--shadow-soft)] outline-none focus:ring-3 focus:ring-coral" />
        <button type="submit" aria-label="Add" disabled={!title.trim()} className="grid size-14 shrink-0 place-items-center rounded-full bg-coral-d text-white shadow-[var(--shadow-btn)] disabled:opacity-40">
          <Plus size={26} strokeWidth={3} />
        </button>
      </form>
      <div className="mt-4 font-display text-sm font-semibold text-muted">When?</div>
      <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Bucket">
        {choices.map(({ b, label }) => (
          <button key={b} role="radio" aria-checked={bucket === b} onClick={() => setBucket(b)}
            className={`${chip} ${bucket === b ? `${BUCKET_STYLE[b].bg} ring-3 ring-ink` : 'bg-white'}`}>{label}</button>
        ))}
      </div>
      <p className="mt-3 min-h-5 text-sm font-bold text-muted" aria-live="polite">{added}</p>
    </Sheet>
  );
}

/* ---------------- Move ---------------- */

export function MoveSheet({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { placeThisWeek } = useUI();
  const task = state.tasks.find((t) => t.id === taskId);
  const targets = moveTargets(state.planWeekStart).filter((t) => t.b !== task?.bucket);
  const move = (b: Bucket) => {
    if (!task) return;
    onClose();
    if (b === 'this_week') placeThisWeek(task.id);
    else dispatch({ type: 'move', id: task.id, bucket: b });
  };
  const gone = task?.bucket === 'parked' || task?.bucket === 'trash';
  return (
    <Sheet open={!!task} onClose={onClose} label="Move task">
      {task && (
        <>
          <div className="mt-1 pr-10 text-sm font-extrabold text-muted">In {BUCKET_NAME[task.bucket]} · <AgeDot createdAt={task.createdAt} long /></div>
          <h2 className="mt-1 pr-6 font-display text-2xl leading-tight font-semibold">{task.title}</h2>
          {gone ? (
            <Button className="mt-5" onClick={() => move('inbox')}>Bring back to Inbox</Button>
          ) : (
            <>
              <div className="mt-4 font-display text-sm font-semibold text-muted">Move to</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {targets.map((t) => (
                  <button key={t.b} onClick={() => move(t.b)} className={`flex h-[58px] flex-col items-center justify-center rounded-[22px] font-display font-semibold shadow-[var(--shadow-soft)] ${BUCKET_STYLE[t.b].bg}`}>
                    {t.label}<small className="font-sans text-[11px] font-extrabold opacity-70">{t.sub}</small>
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => move('parked')} className="h-12 rounded-full bg-lav-t font-display font-semibold">Let go</button>
                <button onClick={() => move('trash')} className="h-12 rounded-full bg-white font-display font-semibold">Delete</button>
              </div>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}

/* ---------------- Swap ---------------- */

export function SwapSheet({ incomingId, onClose }: { incomingId: string | null; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const incoming = state.tasks.find((t) => t.id === incomingId);
  const candidates = openThisWeek(state).filter((t) => !t.bonus).sort(byOldest).slice(0, 5);
  const [outId, setOutId] = useState<string | null>(null);
  useEffect(() => { if (incomingId) setOutId(null); }, [incomingId]);
  const selected = outId ?? candidates[0]?.id;
  const done = weekCount(state) - openThisWeek(state).length;

  return (
    <Sheet open={!!incoming} onClose={onClose} label="Your week is full"
      peek={<div className="pointer-events-none absolute -top-[92px] right-5 w-[104px]"><Sec pose="full" /></div>}>
      {incoming && (
        <>
          <h2 className="mt-2 font-display text-[26px] font-semibold">Your week's full!</h2>
          <p className="mt-1 text-[15px] text-muted">{state.settings.limit} of {state.settings.limit}. Move one out to make room.</p>
          <div className="mt-3 flex items-center gap-2.5 rounded-[22px] border-[2.5px] border-dashed border-coral bg-white px-3.5 py-3">
            <Plus size={20} className="shrink-0 text-coral-d" strokeWidth={3} />
            <b className="flex-1 text-[15px]">{incoming.title}</b>
            <span className="rounded-full bg-coral-t px-2 py-0.5 text-[11px] font-extrabold text-coral-d">Adding</span>
          </div>
          {candidates.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-muted">All {done} tasks this week are done. Nice! Raise the limit to fit this one, or plan it for later.</p>
          ) : (
            <>
              <div className="mt-3 font-display text-sm font-semibold text-muted">Pick one to move to Next Week · oldest first</div>
              <div className="mt-2 flex flex-col gap-1.5" role="radiogroup" aria-label="Task to move out">
                {candidates.map((t, k) => (
                  <button key={t.id} role="radio" aria-checked={selected === t.id} onClick={() => setOutId(t.id)}
                    className={`flex items-center gap-2.5 rounded-[18px] border-[2.5px] bg-white px-3 py-2.5 text-left ${selected === t.id ? 'border-coral-d' : 'border-transparent'}`}>
                    <span className={`size-[22px] shrink-0 rounded-full ${selected === t.id ? 'border-[6px] border-coral-d' : 'border-3 border-line'}`} />
                    <span className="flex-1 text-[15px] leading-snug font-bold">{t.title}{k === 0 && <small className="block text-xs font-extrabold text-coral-d">Oldest pick</small>}</span>
                    <AgeDot createdAt={t.createdAt} />
                  </button>
                ))}
              </div>
              <Button className="mt-4" onClick={() => { if (selected) dispatch({ type: 'swap', outId: selected, to: 'next_week', inId: incoming.id }); onClose(); }}>Move to Next Week &amp; add</Button>
            </>
          )}
          <div className="text-center">
            <LinkButton className="text-[13px]" onClick={() => { dispatch({ type: 'raiseLimit', inId: incoming.id }); onClose(); }}>
              Raise my limit to {state.settings.limit + 1}
            </LinkButton>
          </div>
        </>
      )}
    </Sheet>
  );
}

/* ---------------- Settings ---------------- */

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (open) { setConfirmReset(false); setCopied(false); } }, [open]);
  const s = state.settings;
  const min = Math.max(MIN_LIMIT, Math.min(weekCount(state), MAX_LIMIT));
  const set = (patch: Partial<typeof s>) => dispatch({ type: 'settings', patch });

  const copy = async () => {
    const counts = Object.fromEntries((['inbox', 'this_week', 'next_week', 'this_month', 'next_month', 'on_hold', 'parked', 'trash', 'done'] as Bucket[])
      .map((b) => [b, state.tasks.filter((t) => t.bucket === b).length]));
    const report = { settings: s, limitRaises: state.limitRaises, counts, events: state.events };
    try { await navigator.clipboard.writeText(JSON.stringify(report, null, 2)); setCopied(true); } catch { setCopied(false); }
  };

  return (
    <Sheet open={open} onClose={onClose} label="Settings">
      <h2 className="mt-1 font-display text-2xl font-semibold">Settings</h2>
      <div className="mt-4 rounded-[24px] bg-white p-4">
        {state.calibrating ? (
          <>
            <div className="font-display font-semibold">Week limit</div>
            <p className="mt-1 text-sm font-semibold text-muted">Learning week. Your first review suggests a limit from what you finish.</p>
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between font-display font-semibold">Week limit <span className="text-2xl text-coral-d">{s.limit}</span></div>
            <Range label="Week limit" value={s.limit} min={min} max={MAX_LIMIT} onChange={(v) => set({ limit: v })} />
            <div className="flex justify-between text-xs font-extrabold text-muted"><span>{min}</span><span>{MAX_LIMIT}</span></div>
          </>
        )}
      </div>
      <div className="mt-3 rounded-[24px] bg-white p-4">
        <div className="font-display font-semibold">Review day · {DAYS_LONG[s.reviewDay]}</div>
        <DayChips label="Review day" value={s.reviewDay} onChange={(d) => set({ reviewDay: d })} />
      </div>
      <div className="mt-3 rounded-[24px] bg-white p-4">
        <div className="font-display font-semibold">Week starts on</div>
        <div className="mt-3 flex gap-2">
          {[1, 0].map((d) => (
            <button key={d} onClick={() => set({ weekStartDay: d })} className={`h-11 flex-1 rounded-full font-display font-semibold ${s.weekStartDay === d ? 'bg-coral-d text-white' : 'bg-bg'}`}>{DAYS_LONG[d]}</button>
          ))}
        </div>
        <p className="mt-2 text-xs font-bold text-muted">Takes effect from the next review.</p>
      </div>
      <div className="mt-3 rounded-[24px] bg-white p-4">
        <div className="font-display font-semibold">Testing</div>
        <p className="mt-1 text-sm font-semibold text-muted">Everything stays on this device. Copy your usage notes to share feedback.</p>
        <div className="mt-3 flex gap-2">
          <button onClick={copy} className="h-11 flex-1 rounded-full bg-bg font-display font-semibold">{copied ? 'Copied!' : 'Copy usage notes'}</button>
          {confirmReset ? (
            <button onClick={() => { dispatch({ type: 'reset' }); onClose(); }} className="h-11 flex-1 rounded-full bg-coral-d font-display font-semibold text-white">Erase everything</button>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="h-11 flex-1 rounded-full bg-bg font-display font-semibold">Start over</button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
