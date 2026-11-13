# Sector

**A task app where time is the only way to organize.**

Most task apps are good at collecting tasks and bad at getting them done. Sector asks one question for every task: **when?** Each task goes into a time bucket, the current week has a hard limit, and a short weekly review keeps the plan honest.

## How it works

- **Five buckets:** This Week · Next Week · Later this month · Next Month · On Hold
- **A weekly limit, set from real life:** the first week is a learning week with no limit. The first review suggests a limit from what actually got done. After that, adding past the limit means choosing what moves out.
- **A Saturday review:** three quick steps to close the week and plan the next one. Nothing rolls over silently.
- **Age dots:** 🟢 under 7 days · 🟡 7–30 days · 🔴 over 30 days, so old tasks are easy to let go.
- **80% is a win:** finishing most of the week counts as a good week.

## Status

Prototype. A clickable phone app, tested first by the maker and a small group of friends, before any public release. Data stays in the browser on each device; there are no accounts yet.

**In the prototype:** onboarding with a first sort, This Week with the limit and age dots, Inbox sorting (tap or swipe), the swap sheet when the week is full, Buckets, and the 3-step weekly review with limit calibration after the learning week. Settings has "Copy usage notes" for sharing test feedback.

| Stage | Focus |
|---|---|
| Prototype | Clickable phone app, test the weekly limit and the weekly review |
| MVP | Core features from the PRD |
| Beta | Imports, calendar fit check, trends |
| Launch | PWA polish, landing page |

## Docs

- [Product requirements](PRD.md): problem, users, requirements, flows, data model, roadmap

## Run it

```bash
npm install
npm run dev
```

Open the address it prints. To try it on a phone on the same Wi-Fi, use the "Network" address.

## Stack

React 19 · Vite · Tailwind 4 · Motion · lucide-react · installable PWA, phone-first

## License

Private project. All rights reserved.
