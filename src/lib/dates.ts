export const DAY = 86_400_000;

export const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const addDays = (t: number, n: number) => {
  const d = new Date(t);
  d.setDate(d.getDate() + n);
  return d.getTime();
};

/** Days since the week started (0 = first day of the week). */
const dayInWeek = (t: number, weekStartDay: number) => (new Date(t).getDay() - weekStartDay + 7) % 7;

export const weekStartOf = (t: number, weekStartDay: number) => addDays(startOfDay(t), -dayInWeek(t, weekStartDay));

/**
 * Which week a plan made now is for. From the 4th day of the week on
 * (Thu–Sun for Mon weeks), planning is for the upcoming week.
 */
export const planningWeekStart = (t: number, weekStartDay: number) => {
  const ws = weekStartOf(t, weekStartDay);
  return dayInWeek(t, weekStartDay) >= 3 ? addDays(ws, 7) : ws;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const fmtDay = (t: number) => {
  const d = new Date(t);
  return `${DAYS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

export const fmtRange = (a: number, b: number) => {
  const x = new Date(a), y = new Date(b);
  if (startOfDay(a) === startOfDay(b)) return `${MONTHS[x.getMonth()]} ${x.getDate()}`;
  return x.getMonth() === y.getMonth()
    ? `${MONTHS[x.getMonth()]} ${x.getDate()} – ${y.getDate()}`
    : `${MONTHS[x.getMonth()]} ${x.getDate()} – ${MONTHS[y.getMonth()]} ${y.getDate()}`;
};

/**
 * Bucket date ranges for a planned week. Buckets never overlap and the nearest
 * one wins. "This month" is the month the week mostly falls in (its 4th day).
 */
export function bucketRanges(weekStart: number) {
  const nextStart = addDays(weekStart, 7);
  const laterStart = addDays(weekStart, 14);
  const mid = new Date(addDays(weekStart, 3));
  const monthEnd = new Date(mid.getFullYear(), mid.getMonth() + 1, 0).getTime();
  const nextMonth = new Date(mid.getFullYear(), mid.getMonth() + 1, 1);
  return {
    thisWeek: fmtRange(weekStart, addDays(weekStart, 6)),
    nextWeek: fmtRange(nextStart, addDays(nextStart, 6)),
    later: laterStart <= monthEnd ? fmtRange(laterStart, monthEnd) : null,
    nextMonth: MONTHS_LONG[nextMonth.getMonth()],
  };
}

export const ageDays = (createdAt: number, now = Date.now()) => Math.max(0, Math.floor((startOfDay(now) - startOfDay(createdAt)) / DAY));

/** The review that closes a planned week: its review day, or the day after the week if the review day is the first day. */
export const reviewDateFor = (planWeekStart: number, reviewDay: number, weekStartDay: number) =>
  addDays(planWeekStart, (reviewDay - weekStartDay + 7) % 7 || 7);
