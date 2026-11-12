import { bucketRanges } from './dates';
import type { Bucket, MoveTarget } from './store';

export const BUCKET_STYLE: Record<Bucket, { bg: string; tint: string; dot: string }> = {
  inbox: { bg: 'bg-white', tint: 'bg-white', dot: 'bg-muted' },
  this_week: { bg: 'bg-coral', tint: 'bg-coral-t', dot: 'bg-coral' },
  next_week: { bg: 'bg-peach', tint: 'bg-peach-t', dot: 'bg-peach' },
  this_month: { bg: 'bg-mint', tint: 'bg-mint-t', dot: 'bg-mint' },
  next_month: { bg: 'bg-sky', tint: 'bg-sky-t', dot: 'bg-sky' },
  on_hold: { bg: 'bg-lav', tint: 'bg-lav-t', dot: 'bg-lav' },
  parked: { bg: 'bg-lav', tint: 'bg-lav-t', dot: 'bg-lav' },
  trash: { bg: 'bg-white', tint: 'bg-white', dot: 'bg-muted' },
  done: { bg: 'bg-mint', tint: 'bg-mint-t', dot: 'bg-mint' },
};

export const BUCKET_NAME: Record<Bucket, string> = {
  inbox: 'Inbox', this_week: 'This Week', next_week: 'Next Week', this_month: 'Later this month',
  next_month: 'Next Month', on_hold: 'On Hold', parked: 'Let go', trash: 'Deleted', done: 'Done',
};

/** Buckets a task can be moved into for a planned week, hiding "Later this month" when it has no days left. */
export function moveTargets(planWeekStart: number): Array<{ b: MoveTarget; label: string; sub?: string }> {
  const r = bucketRanges(planWeekStart);
  return [
    { b: 'this_week' as const, label: 'This Week', sub: r.thisWeek },
    { b: 'next_week' as const, label: 'Next Week', sub: r.nextWeek },
    ...(r.later ? [{ b: 'this_month' as const, label: 'Later this month', sub: r.later }] : []),
    { b: 'next_month' as const, label: 'Next Month', sub: r.nextMonth },
    { b: 'on_hold' as const, label: 'On Hold', sub: 'No date' },
  ];
}

/** "Later" in quick choices: later this month if it exists, otherwise next month. */
export const laterBucket = (planWeekStart: number): MoveTarget => (bucketRanges(planWeekStart).later ? 'this_month' : 'next_month');
