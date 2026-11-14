/** A repeating calendar event for the weekly review, so people come back on review day. */

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const TITLE = 'Sector: weekly review';
const pad = (n: number) => String(n).padStart(2, '0');
/** Floating local time, e.g. 20261121T100000 (10:00 wherever the person is). */
const stamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

function times(firstReview: number) {
  const start = new Date(firstReview);
  start.setHours(10, 0, 0, 0);
  return { start, end: new Date(start.getTime() + 15 * 60_000) };
}

export function downloadReviewEvent(firstReview: number) {
  const { start, end } = times(firstReview);
  const url = location.origin;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sector//Weekly review//EN', 'BEGIN:VEVENT',
    `UID:sector-review-${start.getTime()}@sector`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[start.getDay()]}`,
    `SUMMARY:${TITLE}`, `DESCRIPTION:Close the week and plan the next: ${url}`, `URL:${url}`,
    'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', `DESCRIPTION:${TITLE}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'sector-weekly-review.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

export function googleReviewLink(firstReview: number) {
  const { start, end } = times(firstReview);
  const q = new URLSearchParams({
    action: 'TEMPLATE', text: TITLE, dates: `${stamp(start)}/${stamp(end)}`,
    details: `Close the week and plan the next: ${location.origin}`, recur: `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[start.getDay()]}`,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
