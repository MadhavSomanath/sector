import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { planningWeekStart } from './dates';

export type Bucket = 'inbox' | 'this_week' | 'next_week' | 'this_month' | 'next_month' | 'on_hold' | 'parked' | 'trash' | 'done';
export type MoveTarget = Exclude<Bucket, 'inbox' | 'done'>;

export interface Task {
  id: string;
  title: string;
  bucket: Bucket;
  createdAt: number;
  movedAt: number;
  completedAt?: number;
}

export interface Settings {
  limit: number;
  /** 0 = Sunday … 6 = Saturday */
  weekStartDay: number;
  reviewDay: number;
}

export interface TestEvent { t: number; type: string; d?: Record<string, unknown> }

export interface State {
  version: 1;
  onboarded: boolean;
  tasks: Task[];
  settings: Settings;
  /** Start of the week the This Week bucket is planned for. */
  planWeekStart: number;
  /** When the current week was locked in (onboarding or review). Done tasks after this count toward the week. */
  weekLockedAt: number;
  limitRaises: number;
  events: TestEvent[];
}

export interface Incoming { taskId: string }

export type Action =
  | { type: 'reset' }
  | { type: 'onboard'; tasks: Array<{ title: string; bucket: Bucket; createdAt: number }>; settings: Settings; minutes: number }
  | { type: 'add'; title: string; bucket: Bucket; id: string }
  | { type: 'move'; id: string; bucket: Bucket }
  | { type: 'toggleDone'; id: string }
  | { type: 'swap'; outId: string; to: MoveTarget; inId: string }
  | { type: 'raiseLimit'; inId: string }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'lockWeek'; moves: Record<string, Bucket>; minutes: number; score: number };

const KEY = 'sector-proto-v1';
export const DEFAULT_SETTINGS: Settings = { limit: 20, weekStartDay: 1, reviewDay: 6 };

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function initial(): State {
  const now = Date.now();
  return {
    version: 1, onboarded: false, tasks: [], settings: DEFAULT_SETTINGS,
    planWeekStart: planningWeekStart(now, DEFAULT_SETTINGS.weekStartDay),
    weekLockedAt: now, limitRaises: 0, events: [],
  };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s.version === 1) return s;
    }
  } catch { /* storage blocked or corrupt: start fresh */ }
  return initial();
}

function reducer(s: State, a: Action): State {
  const now = Date.now();
  const log = (type: string, d?: Record<string, unknown>) => [...s.events, { t: now, type, d }];
  const put = (id: string, bucket: Bucket) => (t: Task) =>
    t.id === id ? { ...t, bucket, movedAt: now, completedAt: bucket === 'done' ? now : undefined } : t;

  switch (a.type) {
    case 'reset':
      return initial();
    case 'onboard':
      return {
        ...s, onboarded: true, settings: a.settings,
        tasks: a.tasks.map((t) => ({ id: uid(), title: t.title, bucket: t.bucket, createdAt: t.createdAt, movedAt: now })),
        planWeekStart: planningWeekStart(now, a.settings.weekStartDay), weekLockedAt: now,
        events: log('onboarding_done', { tasks: a.tasks.length, minutes: a.minutes, limit: a.settings.limit }),
      };
    case 'add':
      return { ...s, tasks: [...s.tasks, { id: a.id, title: a.title, bucket: a.bucket, createdAt: now, movedAt: now }], events: log('task_added', { bucket: a.bucket }) };
    case 'move': {
      const from = s.tasks.find((t) => t.id === a.id)?.bucket;
      return { ...s, tasks: s.tasks.map(put(a.id, a.bucket)), events: log('task_moved', { from, to: a.bucket }) };
    }
    case 'toggleDone': {
      const t = s.tasks.find((x) => x.id === a.id);
      if (!t) return s;
      const done = t.bucket !== 'done';
      return { ...s, tasks: s.tasks.map(put(a.id, done ? 'done' : 'this_week')), events: log(done ? 'task_done' : 'task_undone') };
    }
    case 'swap':
      return {
        ...s, tasks: s.tasks.map(put(a.outId, a.to)).map(put(a.inId, 'this_week')),
        events: log('swap', { to: a.to, outAge: s.tasks.find((t) => t.id === a.outId)?.createdAt }),
      };
    case 'raiseLimit':
      return {
        ...s, settings: { ...s.settings, limit: s.settings.limit + 1 }, limitRaises: s.limitRaises + 1,
        tasks: s.tasks.map(put(a.inId, 'this_week')), events: log('limit_raised', { limit: s.settings.limit + 1 }),
      };
    case 'settings':
      return { ...s, settings: { ...s.settings, ...a.patch }, events: log('settings', a.patch) };
    case 'lockWeek': {
      let tasks = s.tasks;
      for (const [id, b] of Object.entries(a.moves)) tasks = tasks.map(put(id, b));
      return {
        ...s, tasks, planWeekStart: planningWeekStart(now, s.settings.weekStartDay), weekLockedAt: now,
        events: log('review_done', { minutes: a.minutes, score: a.score, planned: tasks.filter((t) => t.bucket === 'this_week').length }),
      };
    }
  }
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}

/* ---------- selectors ---------- */

export const openThisWeek = (s: State) => s.tasks.filter((t) => t.bucket === 'this_week');
export const doneThisWeek = (s: State) => s.tasks.filter((t) => t.bucket === 'done' && (t.completedAt ?? 0) >= s.weekLockedAt);
/** Tasks counted against the limit: open and done this week. */
export const weekCount = (s: State) => openThisWeek(s).length + doneThisWeek(s).length;
export const isFull = (s: State) => weekCount(s) >= s.settings.limit;
export const inBucket = (s: State, b: Bucket) => s.tasks.filter((t) => t.bucket === b);
export const byOldest = (a: Task, b: Task) => a.createdAt - b.createdAt;
export const byNewest = (a: Task, b: Task) => b.createdAt - a.createdAt;
