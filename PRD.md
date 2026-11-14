# Sector: Product Requirements

**Status:** Draft · **Updated:** 2026-11-13 · **Stage:** prototype, tested with a small group first

## 1. Summary

- **Problem:** task apps make it easy to collect tasks, but hard to finish them. Most tasks get done within days or not at all, and the backlog grows into a list of guilt.
- **Idea:** change the question from *"What do I have to do?"* to *"**When** will I do this, and is there time?"*
- **Product:** a task app where time is the only way to organize. Every task sits in one time bucket. This Week has a hard limit. A short weekly review moves tasks between buckets. Old tasks get flagged so letting go feels safe.
- **North-star metric:** weekly completion rate (tasks done ÷ tasks in This Week on Monday). Target: 70% or more by week 4.

## 2. Problem and evidence

| Finding | Source | What it means |
|---|---|---|
| People rebuild time buckets by hand with priorities (P1 = today, P3 = "this week or next") | [r/todoist](https://www.reddit.com/r/todoist/comments/1xmwit9/anyone_else_frustrated_with_todoists_priority/) | Make time buckets the core, not a hack |
| Managing the list takes more effort than adding to it | [r/ticktick](https://www.reddit.com/r/ticktick/comments/1xg3juj/ticktick_task_management_tool/), [r/todoist](https://www.reddit.com/r/todoist/comments/1x4rp6l/how_much_time_do_you_spend_managing_your_tasks_in/) | Two questions only. Projects and labels stay optional |
| Median to-do is done in 0.5 days; about half are never done | [arXiv 2609.15904](https://arxiv.org/pdf/2609.15904) | Flag aging tasks, make deleting safe |
| 68% of to-dos are done within a week | [CHI 2004](https://hci.rwth-aachen.de/materials/conferences/CHI2004/1p735.pdf) | The week is the right planning rhythm |
| A list that's never reviewed turns into a wish list | [r/GetDisciplined](https://photon.lemmy.world/post/lemmy.world/6159232) | The weekly review is the core ritual |

**Gap:** Todoist, TickTick and Things treat "when" as an optional due date. Sunsama and Motion plan by the hour and are heavy. Nothing light is built around the **week**, with a limit and a 10-minute review.

## 3. Users

Solo users with full calendars who already use a task app and feel behind: managers, consultants, freelancers, students.

- **Planner with too many meetings:** wants to know on Monday what fits this week.
- **Freelancer with chaotic input:** wants one inbox and fast sorting.
- **Serial reorganizer:** wants a system strict enough to stop tinkering.

## 4. Goals and metrics

| Type | Metric | Target |
|---|---|---|
| North star | Weekly completion rate (median) | ≥ 70% |
| Activation | Finish first sort + first weekly review | ≥ 60% |
| Habit | Finish the review 3 of 4 weeks | ≥ 45% |
| Health | Median age of tasks in This Week | ≤ 5 days |
| Retention | Week-4 retention | ≥ 35% |
| Guardrail | Weeks where the limit gets raised | Track (high = limit too painful) |

**Not in v1:** hour-by-hour time blocking, teams and sharing, deep project management, AI.

## 5. How it works

**Principles**
1. Time is the only folder.
2. Two questions per task: *What is it? When?*
3. The limit is a feature, set from what you actually finish. Adding past it means choosing what moves out.
4. 80% is a win week. Never shame a miss.
5. Letting go is safe. Parked and deleted tasks can be restored.
6. The weekly review takes 10 minutes.

**Buckets.** Each task sits in exactly one, in time order. Buckets never overlap:

```
 Nov 9 ─── 15 │ 16 ─── 22 │ 23 ──── 30 │ December │ no date
  THIS WEEK   │ NEXT WEEK │ LATER THIS │   NEXT   │ ON HOLD
  (limit)     │           │   MONTH    │  MONTH   │
```

- Weeks run Monday to Sunday by default; the review is on Saturday. Both are user settings.
- The nearest bucket wins: if Next Week spans two months, tasks stay in Next Week.
- Empty buckets are hidden.
- Tasks never move on their own. Moves happen in the review, or by hand.
- **Learning week:** the first week has no limit. At the first review the app suggests one from what got done (done ÷ 0.8, rounded down, minimum 3), so finishing the same amount again is a win week. The user can adjust it before locking in.
- **Age dot** on every task: 🟢 under 7 days · 🟡 7–30 days · 🔴 over 30 days.

## 6. Requirements

**P0 = MVP · P1 = soon after · P2 = later**

| Area | Requirement | P |
|---|---|---|
| Capture | Quick add from anywhere (`N` on desktop, + button on phone) | P0 |
| | Shortcuts in the title: `!tw` `!nw` `!tm` `!nm` `!oh` | P0 |
| | Share sheet / browser extension; email-to-inbox; voice | P1–P2 |
| Inbox sort | One card at a time, "When?" with 5 bucket buttons plus Delete | P0 |
| | Swipe shortcuts (right = This Week, left = Later) and keyboard 1–5 | P0 |
| | Inbox badge and a nudge for items older than 48 hours | P0 |
| Buckets & limit | 5 bucket lists, drag and bulk move | P0 |
| | This Week shows "14 / 20" | P0 |
| | Adding past the limit opens a **swap sheet**: pick one task (oldest suggested first) to move to Next Week | P0 |
| | Learning week first, then a limit suggested at the first review (3–60, adjustable in Settings) | P0 |
| | Once every planned task is done, tasks pulled in are **bonus**: they don't count against the limit or the score | P0 |
| | Re-suggest the limit every few reviews from recent weeks | P1 |
| | Rename a task in place | P0 |
| | Optional labels and due dates | P0 / P1 |
| Letting go | Age dot on every task | P0 |
| | Clean-up view for tasks over 30 days: delete all, park all, or one by one | P0 |
| | Trash keeps tasks for 30 days; parked tasks go to the Parking Lot (reviewed monthly) | P0 / P1 |
| Weekly review | 3 steps: score (or limit calibration after the learning week) → leftovers (keep / push / let go / delete, none skipped) → plan next week up to the limit from any later bucket, and lock in | P0 |
| | Opens on review day and stays open until done, however late; before that, the Review tab only shows progress | P0 |
| | Reminder on review day | P0 |
| | Monthly rollover: Next Month becomes Later this month | P1 |
| Capacity | Google Calendar, read-only free/busy: show free hours, and add a fit check to the review once connected (no guessed hours per task) | P1 |
| | Effort sizes (S / M / L) and a warning above 80% of free hours | P1 |
| Progress | Week score, with 80% or more = win week (rounded down, so 4 of 5 or 2 of 3 counts) | P0 |
| | 12-week trend and review streak | P1 |
| Onboarding | How a week works in 4 swipes (also in Settings) → import / paste (with a rough list age) / start fresh → first sort → pick review day → add the review to the calendar | P0 |
| | Import from CSV (P0), Todoist / TickTick / To Do APIs (P1) | P0 / P1 |
| | Tasks older than 60 days start set to "Let go" in the first sort | P0 |
| | Setup Thursday–Sunday: "This Week" means the upcoming week | P0 |
| Later | Recurring routines, critical recurring tasks outside the limit | P2 |

## 7. Key flows

1. **First run:** method → bring tasks → first sort → set week → This Week
2. **Daily:** open This Week → tick or swipe tasks off → quick add → sort the inbox
3. **Weekly:** reminder → 3-step review → week locked in
4. **Over the limit:** add to This Week → swap sheet → move one out → done

**Screens:** This Week (home) · Buckets · Inbox sort · Weekly review · Clean-up · Score · Settings

## 8. Data model

- `User`: limit, week_start, review_day, timezone, calendar_connected
- `Task`: id, title, notes, bucket (inbox · this_week · next_week · this_month · next_month · on_hold · parked · trash · done), created_at, bucket_changed_at, completed_at, due_date?, effort?, labels[]
- `WeekSnapshot`: week_start, locked_task_ids[], done_count, moved_out_count, score
- `Review`: started_at, finished_at, steps_completed

## 9. Tech

- **App:** React 19, Vite, Tailwind 4, Motion, lucide-react; installable PWA, phone-first with a desktop layout
- **Backend (MVP):** Express or serverless, Postgres with per-user access rules
- **Auth:** email magic link and Google sign-in
- **Integrations:** Google Calendar (read-only free/busy), CSV and Todoist import
- **Privacy:** task data is private per user; full export and account deletion

## 10. Roadmap

| Phase | Scope |
|---|---|
| 0. Prototype | Clickable phone prototype. Test the weekly limit and the weekly review with 5 people |
| 1. MVP | P0 requirements |
| 2. Beta | P1: Todoist import, calendar fit check, effort sizes, limit re-suggestions, trends, monthly rollover |
| 3. Launch | Landing page, PWA polish, pricing test |
| 4. Later | P2: recurring tasks, email-to-inbox, Outlook calendar, native apps |

## 11. Risks

| Risk | Mitigation |
|---|---|
| The limit feels annoying | Set from the user's own learning week, adjustable, one-tap swap. Track how often it's raised |
| People skip the review | Reminder, streak, 10-minute promise, shorter review when behind |
| "Yet another to-do app" | Easy import and a first sort that shows value in the first session |
| A general AI assistant can already "make my week realistic" | Win on a simple method and low effort. Revisit AI after launch |
| Calendar permission puts people off | Optional, free/busy only, manual hours as a fallback |

## 12. Decisions

| Topic | Decision |
|---|---|
| Platform | Phone-first PWA, desktop layout too |
| Audience | Solo users |
| Business model | Free + Pro ($4–6/mo for calendar and insights) |
| Weekly limit | Learning week first, then suggested from what got done (3–60) |
| Week | Monday–Sunday, review Saturday (both adjustable) |
| Buckets | Calendar months, never overlapping; nearest wins; empty ones hidden |
| Sorting | Tap buttons plus swipe |
| AI | None in v1 |
| Look | Playful and simple: pastel colors, rounded cards, pill buttons, a mascot |
