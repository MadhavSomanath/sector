import { Check } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { Sec } from '../components/Sec';
import { BackButton, Button, LinkButton } from '../components/ui';
import { DAYS_LONG, DAYS_SHORT } from '../lib/dates';

/** How a week in Sector works, in four swipes. Shown in setup and from Settings. */
export function HowItWorks({ reviewDay, onBack, onDone, doneLabel = 'Got it' }: { reviewDay: number; onBack: () => void; onDone: () => void; doneLabel?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const day = DAYS_LONG[reviewDay];

  const slides: Array<{ title: ReactNode; sub: string; art: ReactNode; tint?: string }> = [
    {
      title: <>Every task gets a <span className="text-coral-d">when</span></>,
      sub: 'No folders or priorities. Each task sits in one time bucket, and you only plan the week in front of you.',
      art: (
        <div className="flex w-[230px] flex-col gap-2">
          {[['bg-coral', 'This Week'], ['bg-peach', 'Next Week'], ['bg-mint', 'Later this month'], ['bg-sky', 'Next Month'], ['bg-lav', 'On Hold']].map(([c, l], j) => (
            <div key={l} className={`flex h-[42px] items-center rounded-full px-[18px] font-display text-[15px] font-semibold ${c}`} style={{ marginLeft: j * 12 }}>{l}</div>
          ))}
        </div>
      ),
    },
    {
      title: <>Week one is a learning week</>,
      sub: 'Plan as much as you like. There’s no limit yet. Sec just counts what you actually finish.',
      art: (
        <>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 0].map((d, j) => (
              <div key={d} className="flex w-[38px] flex-col items-center gap-1.5 rounded-2xl bg-bg py-2">
                <small className="text-[11px] font-extrabold text-muted">{DAYS_SHORT[d]}</small>
                <span className={`grid size-6 place-items-center rounded-full ${[0, 1, 3, 4].includes(j) ? 'bg-mint' : 'border-3 border-line'}`}>
                  {[0, 1, 3, 4].includes(j) && <Check size={14} strokeWidth={3.5} className="text-white" />}
                </span>
              </div>
            ))}
          </div>
          <div className="absolute bottom-5 rounded-full bg-bg px-3.5 py-1.5 font-display font-semibold">No limit yet · 4 done</div>
        </>
      ),
    },
    {
      title: <>{day}: a short review</>,
      sub: 'See how the week went, decide what happens to anything left over, then pick next week’s tasks. Nothing rolls over on its own.',
      tint: 'bg-lav-t',
      art: (
        <div className="flex w-[240px] flex-col gap-2.5">
          {['How did it go?', 'Leftovers', 'Plan next week'].map((l, j) => (
            <div key={l} className="flex items-center gap-3 rounded-[20px] bg-white px-3.5 py-3 shadow-[var(--shadow-soft)]">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-lav font-display text-sm font-bold">{j + 1}</span>
              <span className="font-display text-[16px] font-semibold">{l}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: <>Then your week gets a limit</>,
      sub: 'It’s set from what you finished. Finish 80% and it’s a win week. When the week is full, something moves out before something new comes in.',
      tint: 'bg-mint-t',
      art: (
        <>
          <Sec pose="win" className="absolute top-3 w-[120px]" />
          <div className="mt-24 grid grid-cols-5 gap-2">{Array.from({ length: 10 }, (_, j) => <span key={j} className={`size-[30px] rounded-[10px] ${j < 8 ? 'bg-coral' : 'bg-white'}`} />)}</div>
          <div className="absolute bottom-5 rounded-full bg-white px-3.5 py-1.5 font-display font-semibold">8 of 10 = win week!</div>
        </>
      ),
    },
  ];
  const last = slides.length - 1;
  const go = (k: number) => ref.current?.scrollTo({ left: k * ref.current.clientWidth, behavior: 'smooth' });

  return (
    <main className="pb-safe relative mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden bg-bg px-[22px] pt-6">
      <div className="mb-3.5 flex h-10 items-center"><BackButton onClick={onBack} /><div className="flex-1" /><LinkButton className="p-0" onClick={onDone}>Skip</LinkButton></div>
      <div ref={ref} className="no-scrollbar -mx-[22px] flex flex-1 snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => setN(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
        {slides.map((s, k) => (
          <section key={k} className="flex w-full shrink-0 snap-center flex-col px-[22px]" aria-label={`${k + 1} of ${slides.length}`}>
            <div className={`relative grid h-[330px] place-items-center overflow-hidden rounded-[32px] shadow-[var(--shadow-lift)] ${s.tint ?? 'bg-white'}`}>{s.art}</div>
            <h2 className="mt-6 font-display text-[30px] leading-tight font-bold">{s.title}</h2>
            <p className="mt-2 text-muted">{s.sub}</p>
          </section>
        ))}
      </div>
      <div className="my-5 flex justify-center gap-1.5" aria-hidden>
        {slides.map((_, k) => <span key={k} className={`h-2 rounded-full transition-all ${k === n ? 'w-[22px] bg-coral' : 'w-2 bg-line'}`} />)}
      </div>
      <Button onClick={() => {
        const el = ref.current;
        const at = el ? Math.round(el.scrollLeft / el.clientWidth) : n;
        if (at < last) go(at + 1); else onDone();
      }}>{n < last ? 'Next' : doneLabel}</Button>
    </main>
  );
}
