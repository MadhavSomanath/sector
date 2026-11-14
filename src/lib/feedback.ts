import { bonusDone, plannedDone, reviewDate, weekCount, type State } from './store';

/** Google Form for tester feedback. Answers collect in the linked "Sector feedback (Responses)" sheet. */
const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSecioEyBUsouaUXRbvEie24FuaDB5hG46gwfd2lcYTRA0ql8Q/viewform';
const FIELD = { from: 'entry.952966125', weeks: 'entry.920142879', reviews: 'entry.1664220910', thisWeek: 'entry.1159784499' };
const DAY = 86_400_000;

const reviews = (s: State) => s.events.filter((e) => e.type === 'review_done').length;

/** Show the after-review card for the first two reviews, until it's opened or dismissed. */
export function askAfterReview(s: State) {
  const n = reviews(s);
  if (n < 1 || n > 2) return false;
  const lastReview = Math.max(...s.events.filter((e) => e.type === 'review_done').map((e) => e.t));
  return !s.events.some((e) => e.type.startsWith('feedback_') && e.t >= lastReview);
}

/** Pre-filled form link: only counts, never task names. */
export function feedbackLink(s: State, from: 'Settings' | 'After review', now = Date.now()) {
  const setup = s.events.find((e) => e.type === 'onboarding_done')?.t ?? now;
  const days = Math.max(1, Math.ceil((now - setup) / DAY));
  const overdue = now >= reviewDate(s) + DAY && s.weekLockedAt < reviewDate(s);
  const bonus = bonusDone(s).length;
  const q = new URLSearchParams({
    [FIELD.from]: from,
    [FIELD.weeks]: `Week ${reviews(s) + 1} (${days} day${days === 1 ? '' : 's'} since setup)`,
    [FIELD.reviews]: `${reviews(s)} done${overdue ? ', current one overdue' : ''}`,
    [FIELD.thisWeek]: `${weekCount(s)} planned, ${plannedDone(s).length} done${bonus ? ` + ${bonus} bonus` : ''}, ${s.calibrating ? 'learning week' : `limit ${s.settings.limit}`}`,
  });
  return `${FORM}?${q}`;
}
