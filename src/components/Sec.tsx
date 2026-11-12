/** Sec, the mascot: a slice of a circle. Drawn on a -16 -8 232 232 canvas so arms fit; the body is centred. */
export type Pose = 'hello' | 'win' | 'full' | 'when' | 'hold' | 'plain';

const INK = '#2B2A33';
const COLOR: Record<Pose, string> = { hello: '#F2765A', win: '#F2765A', full: '#F2765A', when: '#7FCFA6', hold: '#A99BF0', plain: '#F2765A' };

const Body = ({ c }: { c: string }) => (
  <g>
    <path d="M100,170 L10,76 A130,130 0 0 1 190,76 Z" fill={c} stroke={c} strokeWidth="18" strokeLinejoin="round" />
    <path d="M48,62 Q70,46 96,42" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="7" strokeLinecap="round" />
    <rect x="96" y="22" width="8" height="16" rx="4" fill={c} />
  </g>
);
const Legs = () => (
  <g>
    <g stroke={INK} strokeWidth="6" strokeLinecap="round" fill="none"><path d="M90,170 L88,196" /><path d="M110,170 L112,196" /></g>
    <ellipse cx="83" cy="199" rx="10" ry="5" fill={INK} /><ellipse cx="117" cy="199" rx="10" ry="5" fill={INK} />
  </g>
);
const Cheeks = () => (
  <g fill="#FF9E8A" opacity=".75"><ellipse cx="68" cy="110" rx="10" ry="6" /><ellipse cx="132" cy="110" rx="10" ry="6" /></g>
);
const Eyes = () => (
  <g>
    <circle cx="82" cy="94" r="7.5" fill={INK} /><circle cx="118" cy="94" r="7.5" fill={INK} />
    <circle cx="84.5" cy="91.5" r="2.4" fill="#fff" /><circle cx="120.5" cy="91.5" r="2.4" fill="#fff" />
  </g>
);
const Smile = () => <path d="M90,110 Q100,121 110,110" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />;
const arms = { stroke: INK, strokeWidth: 6, strokeLinecap: 'round' as const, fill: 'none' };

export function Sec({ pose = 'plain', className = '', label }: { pose?: Pose; className?: string; label?: string }) {
  const c = COLOR[pose];
  return (
    <svg viewBox="-16 -8 232 232" className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {pose === 'win' && (
        <g>
          <rect x="22" y="14" width="10" height="5" rx="2" fill="#7FCFA6" transform="rotate(-25 27 16)" />
          <rect x="160" y="10" width="10" height="5" rx="2" fill="#A99BF0" transform="rotate(30 165 12)" />
          <circle cx="44" cy="34" r="4" fill="#FFB677" /><circle cx="152" cy="36" r="4" fill="#7DB8F5" />
          <rect x="128" y="4" width="8" height="4" rx="2" fill="#F2765A" />
          <rect x="62" y="6" width="8" height="4" rx="2" fill="#FFB677" transform="rotate(40 66 8)" />
        </g>
      )}
      <Legs />
      {pose === 'hello' && (
        <g>
          <g {...arms}><path d="M26,112 Q12,130 20,146" /><path d="M174,104 Q194,84 186,60" /><path d="M196,44 l6,-6 M200,58 l9,-1" strokeWidth="4" /></g>
          <circle cx="20" cy="148" r="7" fill={INK} /><circle cx="186" cy="56" r="7" fill={INK} />
        </g>
      )}
      {pose === 'win' && (
        <g>
          <g {...arms}><path d="M28,98 Q10,72 20,48" /><path d="M172,98 Q190,72 180,48" /></g>
          <circle cx="20" cy="45" r="7" fill={INK} /><circle cx="180" cy="45" r="7" fill={INK} />
        </g>
      )}
      {pose === 'full' && (
        <g>
          <g {...arms}><path d="M28,112 Q14,104 10,88" /><path d="M172,112 Q186,104 190,88" /></g>
          <circle cx="10" cy="84" r="8" fill={INK} /><circle cx="190" cy="84" r="8" fill={INK} />
        </g>
      )}
      {pose === 'when' && (
        <g>
          <g {...arms}><path d="M26,112 Q12,130 20,146" /><path d="M172,110 Q178,128 140,124" /></g>
          <circle cx="20" cy="148" r="7" fill={INK} />
        </g>
      )}
      {pose === 'hold' && (
        <g>
          <g {...arms}><path d="M26,112 Q14,128 22,144" /><path d="M174,112 Q186,128 178,144" /></g>
          <circle cx="22" cy="146" r="7" fill={INK} /><circle cx="178" cy="146" r="7" fill={INK} />
        </g>
      )}
      <Body c={c} />
      {pose === 'when' && <circle cx="138" cy="122" r="7" fill={INK} />}
      <Cheeks />
      {pose === 'win' ? (
        <g>
          <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round"><path d="M75,96 Q82,86 89,96" /><path d="M111,96 Q118,86 125,96" /></g>
          <path d="M88,107 Q100,128 112,107 Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </g>
      ) : pose === 'hold' ? (
        <g>
          <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round"><path d="M75,94 Q82,101 89,94" /><path d="M111,94 Q118,101 125,94" /><path d="M95,112 Q100,115 105,112" /></g>
          <g fontFamily="Fredoka, sans-serif" fontWeight="700" fill="#A99BF0"><text x="148" y="40" fontSize="22">z</text><text x="164" y="24" fontSize="16">z</text><text x="176" y="12" fontSize="12">z</text></g>
        </g>
      ) : (
        <Eyes />
      )}
      {(pose === 'hello' || pose === 'plain') && <Smile />}
      {pose === 'full' && (
        <g>
          <ellipse cx="100" cy="114" rx="6" ry="7" fill={INK} />
          <path d="M152,54 q6,10 0,14 q-6,-4 0,-14 Z" fill="#7DB8F5" />
        </g>
      )}
      {pose === 'when' && (
        <g>
          <path d="M92,112 L108,110" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
          <text x="150" y="30" fontSize="26" fontFamily="Fredoka, sans-serif" fontWeight="700" fill={INK}>?</text>
        </g>
      )}
    </svg>
  );
}

/** Just the slice, for the logo and avatar. */
export const SecFace = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 200 190" className={className} aria-hidden>
    <Body c="#F2765A" />
    <Cheeks />
    <Eyes />
    <Smile />
  </svg>
);
