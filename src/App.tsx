import { CalendarDays, CircleDot, Inbox as InboxIcon, PieChart, Plus } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AddSheet, MoveSheet, SettingsSheet, SwapSheet } from './components/Sheets';
import { inBucket, isFull, useStore, weekFinished } from './lib/store';
import { UICtx, type Tab, type UI } from './lib/ui';
import { Buckets } from './screens/Buckets';
import { Inbox } from './screens/Inbox';
import { Onboarding } from './screens/Onboarding';
import { Review } from './screens/Review';
import { Week } from './screens/Week';

export function App() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<Tab>('week');
  const [adding, setAdding] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);
  const [swapIn, setSwapIn] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const ui = useMemo<UI>(() => ({
    placeThisWeek: (id) => {
      if (isFull(state)) {
        if (weekFinished(state)) { dispatch({ type: 'move', id, bucket: 'this_week', bonus: true }); return true; }
        setSwapIn(id); return false;
      }
      dispatch({ type: 'move', id, bucket: 'this_week' });
      return true;
    },
    openMove: setMoving,
    openAdd: () => setAdding(true),
    openSettings: () => setSettings(true),
    startReview: () => setReviewing(true),
    goTo: setTab,
  }), [state, dispatch]);

  // Quick add with N (desktop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && !['INPUT', 'TEXTAREA'].includes(el.tagName) && state.onboarded) {
        e.preventDefault(); setAdding(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.onboarded]);

  useEffect(() => { window.scrollTo(0, 0); }, [tab, reviewing]);

  if (!state.onboarded) return <Onboarding />;

  const inbox = inBucket(state, 'inbox').length;
  const tabs: Array<{ id: Tab | 'review'; label: string; icon: ReactNode; badge?: number }> = [
    { id: 'week', label: 'Week', icon: <CalendarDays size={24} strokeWidth={2.3} /> },
    { id: 'inbox', label: 'Inbox', icon: <InboxIcon size={24} strokeWidth={2.3} />, badge: inbox },
    { id: 'buckets', label: 'Buckets', icon: <PieChart size={24} strokeWidth={2.3} /> },
    { id: 'review', label: 'Review', icon: <CircleDot size={24} strokeWidth={2.3} /> },
  ];

  return (
    <UICtx.Provider value={ui}>
      {reviewing ? (
        <Review onClose={() => { setReviewing(false); setTab('week'); }} />
      ) : (
        <div className="mx-auto min-h-dvh max-w-[480px] pb-32">
          {tab === 'week' && <Week />}
          {tab === 'inbox' && <Inbox />}
          {tab === 'buckets' && <Buckets />}
          <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] items-center justify-around rounded-t-[30px] bg-white px-2 pt-3 shadow-[0_-6px_20px_rgba(43,42,51,.06)]" aria-label="Main">
            {tabs.slice(0, 2).map((t) => <TabButton key={t.id} {...t} on={tab === t.id} onClick={() => setTab(t.id as Tab)} />)}
            <button onClick={() => setAdding(true)} aria-label="Add a task (N)"
              className="-mt-11 grid size-[66px] place-items-center rounded-full border-[5px] border-bg bg-coral-d text-white shadow-[0_10px_22px_rgba(196,69,42,.38)] transition active:scale-95">
              <Plus size={30} strokeWidth={3} />
            </button>
            {tabs.slice(2).map((t) => <TabButton key={t.id} {...t} on={tab === t.id} onClick={() => (t.id === 'review' ? setReviewing(true) : setTab(t.id as Tab))} />)}
          </nav>
        </div>
      )}
      <AddSheet open={adding} onClose={() => setAdding(false)} />
      <MoveSheet taskId={moving} onClose={() => setMoving(null)} />
      <SwapSheet incomingId={swapIn} onClose={() => setSwapIn(null)} />
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </UICtx.Provider>
  );
}

function TabButton({ label, icon, badge, on, onClick }: { label: string; icon: ReactNode; badge?: number; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-current={on ? 'page' : undefined}
      className={`relative flex w-14 flex-col items-center gap-0.5 text-[11px] font-extrabold ${on ? 'text-coral-d' : 'text-muted'}`}>
      {icon}{label}
      {!!badge && <span className="absolute -top-1 right-1.5 rounded-full bg-coral-d px-1.5 text-[11px] text-white">{badge}</span>}
    </button>
  );
}
