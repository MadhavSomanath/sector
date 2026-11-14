import { CalendarPlus } from 'lucide-react';
import { downloadReviewEvent, googleReviewLink } from '../lib/calendar';
import { DAYS_LONG, fmtDay } from '../lib/dates';

/** Add the weekly review to the phone's calendar: the prototype can't send reminders itself. */
export function ReviewReminder({ firstReview, className = 'mt-3 bg-white' }: { firstReview: number; className?: string }) {
  return (
    <div className={`rounded-[26px] px-4 py-3.5 text-center ${className}`}>
      <button onClick={() => downloadReviewEvent(firstReview)} className="inline-flex h-11 items-center gap-2 rounded-full bg-lav-t px-5 font-display font-semibold">
        <CalendarPlus size={20} />Add review to my calendar
      </button>
      <p className="mt-2 text-[13px] font-bold text-muted">
        Every {DAYS_LONG[new Date(firstReview).getDay()]} at 10:00, from {fmtDay(firstReview)}.{' '}
        <a href={googleReviewLink(firstReview)} target="_blank" rel="noreferrer" className="underline underline-offset-2">Use Google Calendar</a>
      </p>
    </div>
  );
}
