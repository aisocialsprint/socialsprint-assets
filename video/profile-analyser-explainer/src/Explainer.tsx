import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill, Easing, Img, Sequence, continueRender, delayRender, interpolate,
  spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import { WORDMARK } from './wordmark';

// ---------- brand (matches tools/kit.py) ----------
const BLUE = '#2563EB', DARK = '#0F172A', SLATE = '#334155', MUTED = '#64748B';
const BLUE_L = '#BFDBFE', BLUE_T = '#EFF6FF', OFF = '#F8FAFC', LINE = '#E2E8F0', TRACK = '#F1F5F9';
const AMBER = '#D97706', AMBER_T = '#FEF3C7', GREEN = '#10B981';
const P = 'Poppins', I = 'Inter';

// Andrea's real scan, same numbers as the blog end card (tools/kit.py ANALYSER)
const A = {
  score: 73, band: 'Strong', name: 'Andrea Piras', role: 'Growth Marketing Lead at Pelion',
  pillars: [['Profile', 19], ['Network', 19], ['Posts', 25], ['Best practices', 10]] as [string, number][],
};

export const FPS = 30;
// scene starts (frames). 30 s total.
const S = { gaps: 0, intro: 150, add: 240, score: 375, fix: 555, cta: 705 };
export const TOTAL = 900;

// ---------- fonts ----------
const FONT_FILES: [string, string, string][] = [
  [P, '700', 'Poppins-Bold.ttf'], [P, '800', 'Poppins-ExtraBold.ttf'], [P, '900', 'Poppins-Black.ttf'],
  [I, '400', 'Inter-Regular.otf'], [I, '500', 'Inter-Medium.otf'], [I, '600', 'Inter-SemiBold.otf'],
];
const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    Promise.all(FONT_FILES.map(([fam, weight, file]) => {
      const f = new FontFace(fam, `url(${staticFile(`fonts/${file}`)})`, { weight });
      return f.load().then((l) => (document.fonts as unknown as { add: (f: FontFace) => void }).add(l));
    })).then(() => continueRender(handle));
  }, [handle]);
};

// ---------- motion helpers ----------
const useSpring = (delay = 0, damping = 18) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.8 } });
};
const ease = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.4, 0, 0.2, 1) });

const useTall = () => { const { width, height } = useVideoConfig(); return height > width; };

// Fades a scene in and out inside its Sequence
const SceneFade: React.FC<{ dur: number; children: React.ReactNode; bg: string }> = ({ dur, children, bg }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 6, dur - 6, dur], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <AbsoluteFill style={{ background: bg }}><AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill></AbsoluteFill>;
};

const Rise: React.FC<{ delay: number; children: React.ReactNode; dist?: number; style?: React.CSSProperties }> = ({ delay, children, dist = 40, style }) => {
  const s = useSpring(delay);
  return <div style={{ opacity: s, transform: `translateY(${(1 - s) * dist}px)`, ...style }}>{children}</div>;
};

// ---------- layout ----------
// Wide: copy left, visual right. Tall: copy top, visual below. Visuals are drawn in an 820 x 820 box and scaled.
const BOX = 820;
const Layout: React.FC<{ copy: React.ReactNode; visual: React.ReactNode; dark?: boolean }> = ({ copy, visual }) => {
  const tall = useTall(); const { width, height } = useVideoConfig();
  const vw = tall ? width : width * 0.52, vh = tall ? height * 0.6 : height;
  const scale = Math.min(vw / BOX, vh / BOX) * (tall ? 0.92 : 0.86);
  return (
    <AbsoluteFill style={{ flexDirection: tall ? 'column' : 'row' }}>
      <div style={{
        width: tall ? '100%' : '48%', height: tall ? '40%' : '100%', boxSizing: 'border-box',
        padding: tall ? '150px 84px 0' : '0 40px 0 120px', display: 'flex', flexDirection: 'column',
        justifyContent: tall ? 'flex-start' : 'center',
      }}>{copy}</div>
      <div style={{ width: vw, height: vh, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: BOX, height: BOX, transform: `scale(${scale})`, flexShrink: 0, position: 'relative' }}>{visual}</div>
      </div>
    </AbsoluteFill>
  );
};

const Meta: React.FC<{ children: string; color?: string; delay?: number }> = ({ children, color = BLUE, delay = 0 }) => {
  const tall = useTall();
  return <Rise delay={delay} dist={20}><div style={{ fontFamily: I, fontWeight: 600, fontSize: tall ? 30 : 24, letterSpacing: 5, color, textTransform: 'uppercase', marginBottom: tall ? 28 : 24 }}>{children}</div></Rise>;
};
const Headline: React.FC<{ lines: string[]; delay?: number; color?: string; accent?: number; accentColor?: string }> = ({ lines, delay = 4, color = DARK, accent = -1, accentColor = BLUE }) => {
  const tall = useTall();
  return <div>{lines.map((l, i) => (
    <Rise key={i} delay={delay + i * 5}><div style={{ fontFamily: P, fontWeight: 800, fontSize: tall ? 84 : 76, lineHeight: 1.12, letterSpacing: -1.5, color: i === accent ? accentColor : color }}>{l}</div></Rise>
  ))}</div>;
};
const Sub: React.FC<{ children: string; delay?: number; color?: string }> = ({ children, delay = 22, color = SLATE }) => {
  const tall = useTall();
  return <Rise delay={delay} dist={20}><div style={{ fontFamily: I, fontSize: tall ? 40 : 32, lineHeight: 1.45, color, marginTop: tall ? 36 : 32, maxWidth: tall ? 900 : 720, textWrap: 'balance' } as React.CSSProperties}>{children}</div></Rise>;
};

const Wordmark: React.FC<{ width: number; white?: boolean }> = ({ width, white }) => {
  const p = WORDMARK.replace(/var\(--wmt,#00110b\)/g, white ? '#fff' : '#00110b').replace(/var\(--wmi,#2563EB\)/g, white ? '#fff' : BLUE);
  return <svg width={width} height={width * 80 / 466} viewBox="18 207 466 80" dangerouslySetInnerHTML={{ __html: p }} />;
};

const Card: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode; shadow?: string }> = ({ style, children, shadow = 'rgba(15,23,42,.10)' }) => (
  <div style={{ position: 'absolute', background: '#fff', borderRadius: 24, boxShadow: `0 16px 40px ${shadow}, 0 2px 6px rgba(15,23,42,.06)`, boxSizing: 'border-box', ...style }}>{children}</div>
);
const Bar: React.FC<{ w: number | string; h?: number; c?: string; style?: React.CSSProperties }> = ({ w, h = 16, c = LINE, style }) =>
  <div style={{ width: w, height: h, borderRadius: h / 2, background: c, ...style }} />;
const ExampleChip: React.FC = () => (
  <div style={{ position: 'absolute', top: -6, right: 0, fontFamily: I, fontWeight: 600, fontSize: 20, color: MUTED, background: '#fff', border: `2px solid ${LINE}`, borderRadius: 20, padding: '6px 16px' }}>Example report</div>
);

// ---------- generic LinkedIn-style profile mock ----------
const SECTIONS = [
  { key: 'Headline', y: 286 }, { key: 'About', y: 400 }, { key: 'Experience', y: 524 }, { key: 'Activity', y: 648 },
];
const ProfileMock: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <Card style={{ left: 90, top: 40, width: 640, height: 740, overflow: 'hidden' }}>
    <div style={{ height: 150, background: `linear-gradient(120deg, ${BLUE_L}, ${BLUE_T})` }} />
    <div style={{ position: 'absolute', left: 44, top: 90, width: 128, height: 128, borderRadius: 64, background: '#CBD5E1', border: '6px solid #fff', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 36, top: 22, width: 44, height: 44, borderRadius: 22, background: '#94A3B8' }} />
      <div style={{ position: 'absolute', left: 18, top: 74, width: 80, height: 60, borderRadius: 40, background: '#94A3B8' }} />
    </div>
    <div style={{ position: 'absolute', left: 44, top: 240 }}><Bar w={260} h={22} c="#CBD5E1" /></div>
    <div style={{ position: 'absolute', left: 44, top: SECTIONS[0].y }}><Bar w={420} /><Bar w={300} style={{ marginTop: 12 }} /></div>
    {SECTIONS.slice(1).map((s) => (
      <div key={s.key} style={{ position: 'absolute', left: 44, top: s.y, width: 552 }}>
        <div style={{ fontFamily: P, fontWeight: 700, fontSize: 24, color: DARK, marginBottom: 14 }}>{s.key}</div>
        <Bar w={520} /><Bar w={380} style={{ marginTop: 12 }} />
      </div>
    ))}
    {children}
  </Card>
);

// ---------- scenes ----------
const GAPS = [
  { label: 'Vague headline', y: SECTIONS[0].y + 6, at: 24 },
  { label: 'Thin About section', y: SECTIONS[1].y + 30, at: 40 },
  { label: 'No recent posts', y: SECTIONS[3].y + 30, at: 56 },
];
const Gaps: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Layout
      copy={<>
        <Meta color={AMBER}>Buyers check your profile first</Meta>
        <Headline lines={['Small gaps', 'quietly cost', 'you replies.']} accent={2} accentColor={AMBER} />
        <Sub delay={30}>And they are hard to spot from the inside.</Sub>
      </>}
      visual={<>
        <ProfileMock>
          {GAPS.map((g) => {
            const o = ease(f, g.at, g.at + 12);
            return <div key={g.label} style={{ position: 'absolute', left: 30, top: g.y - 14, width: 580, height: 70, borderRadius: 14, border: `4px dashed ${AMBER}`, opacity: o * (0.7 + 0.3 * Math.sin(f / 6)) }} />;
          })}
        </ProfileMock>
        {GAPS.map((g) => {
          const s = spring({ frame: f - g.at - 6, fps: FPS, config: { damping: 12 } });
          return <div key={g.label} style={{ position: 'absolute', left: 470, top: g.y + 30, transform: `scale(${s})`, transformOrigin: 'left center', display: 'flex', alignItems: 'center', gap: 12, background: AMBER_T, border: `3px solid ${AMBER}`, borderRadius: 40, padding: '10px 24px', fontFamily: I, fontWeight: 600, fontSize: 28, color: '#92400E', whiteSpace: 'nowrap', boxShadow: '0 10px 24px rgba(217,119,6,.2)' }}>
            <span style={{ fontFamily: P, fontWeight: 900, fontSize: 30 }}>!</span>{g.label}
          </div>;
        })}
      </>}
    />
  );
};

const Intro: React.FC = () => {
  const tall = useTall();
  const s = useSpring(4, 14), t = useSpring(14), u = useSpring(30);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 80 }}>
      <div style={{ transform: `scale(${0.8 + 0.2 * s})`, opacity: s }}><Wordmark width={tall ? 560 : 520} white /></div>
      <div style={{ opacity: t, transform: `translateY(${(1 - t) * 30}px)`, fontFamily: P, fontWeight: 900, fontSize: tall ? 132 : 140, color: '#fff', letterSpacing: -3, lineHeight: 1.05, marginTop: 50 }}>
        Profile{tall ? <br /> : ' '}Analyser
      </div>
      <div style={{ opacity: u, transform: `translateY(${(1 - u) * 20}px)`, fontFamily: I, fontSize: tall ? 44 : 40, color: BLUE_L, marginTop: 36, maxWidth: tall ? 900 : 1300, lineHeight: 1.4, textWrap: 'balance' } as React.CSSProperties}>
        A free score for your LinkedIn profile, out of 100.
      </div>
    </AbsoluteFill>
  );
};

const URL_TEXT = 'linkedin.com/in/your-name';
const ITEMS = ['Headline', 'About', 'Experience', 'Skills', 'Activity'];
const AddProfile: React.FC = () => {
  const f = useCurrentFrame();
  const chars = Math.floor(interpolate(f, [10, 42], [0, URL_TEXT.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const press = f >= 48 && f < 56 ? 0.95 : 1;
  const scan = ease(f, 58, 118);
  const caret = Math.floor(f / 15) % 2 === 0 && chars < URL_TEXT.length;
  return (
    <Layout
      copy={<>
        <Meta>Step 1</Meta>
        <Headline lines={['Add your', 'LinkedIn profile.']} accent={1} />
        <Sub>The Analyser reads your headline, About, experience, skills and activity.</Sub>
      </>}
      visual={<>
        <Card style={{ left: 40, top: 60, width: 740, height: 150, padding: '0 30px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ flex: 1, height: 84, borderRadius: 16, border: `3px solid ${chars ? BLUE : LINE}`, background: OFF, display: 'flex', alignItems: 'center', padding: '0 24px', fontFamily: I, fontSize: 30, color: chars ? DARK : MUTED }}>
            {chars ? URL_TEXT.slice(0, chars) : 'Your LinkedIn profile URL'}{caret && <span style={{ width: 3, height: 36, background: BLUE, marginLeft: 2 }} />}
          </div>
          <div style={{ height: 84, borderRadius: 42, background: BLUE, color: '#fff', fontFamily: P, fontWeight: 700, fontSize: 28, padding: '0 34px', display: 'flex', alignItems: 'center', transform: `scale(${press})` }}>Analyse</div>
        </Card>
        <Card style={{ left: 40, top: 250, width: 740, height: 520, padding: '36px 40px' }}>
          <div style={{ fontFamily: P, fontWeight: 700, fontSize: 30, color: DARK, marginBottom: 20 }}>
            {scan < 1 ? 'Reading your profile' : 'Profile read'}{scan > 0 && scan < 1 ? '.'.repeat(1 + (Math.floor(f / 8) % 3)) : ''}
          </div>
          <Bar w="100%" h={10} c={TRACK} style={{ position: 'relative', marginBottom: 24 }} />
          <div style={{ position: 'absolute', left: 40, top: 92, width: 660 * scan, height: 10, borderRadius: 5, background: BLUE }} />
          {ITEMS.map((it, i) => {
            const done = scan > (i + 1) / (ITEMS.length + 0.5);
            const o = ease(f, 54 + i * 5, 64 + i * 5);
            return <div key={it} style={{ opacity: o, display: 'flex', alignItems: 'center', gap: 22, height: 74, borderBottom: i < ITEMS.length - 1 ? `2px solid ${TRACK}` : 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: done ? GREEN : TRACK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done && <svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 12.5 L10 17 L19 7" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <div style={{ fontFamily: I, fontWeight: 500, fontSize: 30, color: done ? DARK : MUTED }}>{it}</div>
            </div>;
          })}
        </Card>
      </>}
    />
  );
};

const Gauge: React.FC<{ value: number; r?: number; stroke?: number }> = ({ value, r = 190, stroke = 34 }) => {
  const cx = r + stroke, cy = r + stroke;
  const th = Math.PI * (1 - value / 100);
  const ex = cx + r * Math.cos(th), ey = cy - r * Math.sin(th);
  return <svg width={2 * cx} height={cy + stroke}>
    <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={TRACK} strokeWidth={stroke} strokeLinecap="round" />
    {value > 0.5 && <path d={`M${cx - r} ${cy} A${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`} fill="none" stroke={BLUE} strokeWidth={stroke} strokeLinecap="round" />}
  </svg>;
};

const ScoreBreakdown: React.FC = () => {
  const f = useCurrentFrame();
  const c = useSpring(4), d = useSpring(56);
  const v = A.score * ease(f, 12, 60);
  const badge = spring({ frame: f - 60, fps: FPS, config: { damping: 10 } });
  const lowVal = Math.min(...A.pillars.map((x) => x[1]));
  return (
    <Layout
      copy={<>
        <Meta>Step 2</Meta>
        <Headline lines={['Get your score', 'out of 100.']} accent={1} />
        <Sub>Then see where the points go: Profile, Network, Posts and Best practices.</Sub>
      </>}
      visual={<>
        <ExampleChip />
        <Card style={{ left: 40, top: 40, width: 740, height: 330, padding: '30px 40px', opacity: c, transform: `translateY(${(1 - c) * 40}px)`, display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ position: 'relative' }}>
            <Gauge value={v} r={130} stroke={26} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontFamily: P, fontWeight: 900, fontSize: 110, color: BLUE, letterSpacing: -3, lineHeight: 1 }}>{Math.round(v)}</div>
          </div>
          <div>
            <div style={{ fontFamily: P, fontWeight: 700, fontSize: 30, color: DARK }}>Overall score</div>
            <div style={{ fontFamily: I, fontSize: 28, color: MUTED, marginTop: 6 }}>{A.name}</div>
            <div style={{ display: 'inline-block', marginTop: 22, transform: `scale(${badge})`, transformOrigin: 'left center', border: `3px solid ${BLUE_L}`, borderRadius: 30, padding: '8px 30px', fontFamily: P, fontWeight: 700, fontSize: 30, color: BLUE }}>{A.band}</div>
          </div>
        </Card>
        <Card style={{ left: 40, top: 395, width: 740, height: 410, padding: '32px 44px 0', opacity: d, transform: `translateY(${(1 - d) * 40}px)` }}>
          {A.pillars.map(([label, val], i) => {
            const p = ease(f, 66 + i * 10, 96 + i * 10);
            const flag = val === lowVal ? ease(f, 120, 132) : 0;
            return <div key={label} style={{ marginBottom: i < 3 ? 26 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, marginBottom: 12 }}>
                <span style={{ fontFamily: I, color: SLATE }}>{label}{flag > 0 && <span style={{ opacity: flag, fontWeight: 600, color: AMBER }}>{" \u00b7 "}Biggest room to grow</span>}</span>
                <span style={{ fontFamily: P, fontWeight: 700, color: flag ? AMBER : BLUE }}>{Math.round(val * p)}/25</span>
              </div>
              <div style={{ position: 'relative', height: 16, borderRadius: 8, background: TRACK }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: 16, borderRadius: 8, width: `${(val / 25) * 100 * p}%`, background: flag ? AMBER : BLUE }} />
              </div>
            </div>;
          })}
        </Card>
      </>}
    />
  );
};

const NEXT = ['Add a clear call to action to your About section', 'Feature one post that shows your best work', 'Reply to comments within a day'];
const Fix: React.FC = () => {
  const f = useCurrentFrame();
  const c = useSpring(4);
  const unblur = ease(f, 18, 42);
  return (
    <Layout
      copy={<>
        <Meta>Step 3</Meta>
        <Headline lines={['Fix the first', 'thing that', 'matters.']} accent={2} />
        <Sub>Missing elements, critical gaps and next steps, in plain English.</Sub>
      </>}
      visual={<>
        <ExampleChip />
        <Card style={{ left: 40, top: 70, width: 740, height: 300, padding: '40px 44px', overflow: 'hidden', opacity: c, transform: `translateY(${(1 - c) * 40}px)` }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 10, height: '100%', background: BLUE }} />
          <div style={{ fontFamily: I, fontWeight: 600, fontSize: 28, color: BLUE }}>One place you lose impact</div>
          <div style={{ position: 'relative', marginTop: 26, height: 150 }}>
            <div style={{ position: 'absolute', inset: 0, filter: `blur(${(1 - unblur) * 8}px)`, opacity: 0.25 + 0.75 * unblur, fontFamily: P, fontWeight: 700, fontSize: 40, lineHeight: 1.3, color: DARK }}>
              {NEXT[0]}.
            </div>
          </div>
        </Card>
        <Card style={{ left: 40, top: 410, width: 740, height: 360, padding: '36px 44px', opacity: ease(f, 46, 56) }}>
          <div style={{ fontFamily: I, fontWeight: 600, fontSize: 28, color: MUTED, marginBottom: 20 }}>Next steps</div>
          {NEXT.slice(1).map((n, i) => {
            const o = ease(f, 58 + i * 10, 68 + i * 10);
            return <div key={n} style={{ opacity: o, transform: `translateX(${(1 - o) * 30}px)`, display: 'flex', alignItems: 'center', gap: 20, height: 92, borderBottom: `2px solid ${TRACK}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, border: `3px solid ${BLUE}`, flexShrink: 0 }} />
              <div style={{ fontFamily: I, fontWeight: 500, fontSize: 28, color: SLATE }}>{n}</div>
            </div>;
          })}
          <div style={{ opacity: ease(f, 82, 92), display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, fontFamily: I, fontSize: 26, color: MUTED }}>
            <svg width="22" height="26" viewBox="0 0 22 26"><rect x="1" y="11" width="20" height="14" rx="3" fill={MUTED} /><path d="M5 11 V7 a6 6 0 0 1 12 0 V11" fill="none" stroke={MUTED} strokeWidth="3" /></svg>
            More in the full report
          </div>
        </Card>
      </>}
    />
  );
};

const Cta: React.FC = () => {
  const tall = useTall();
  const f = useCurrentFrame();
  const btn = useSpring(30, 12);
  const cur = ease(f, 70, 110);
  const click = f >= 112 && f < 122 ? 0.94 : 1;
  const ripple = ease(f, 112, 140);
  return (
    <AbsoluteFill style={{ alignItems: tall ? 'flex-start' : 'center', justifyContent: 'center', padding: tall ? '0 84px' : '0 160px', flexDirection: 'column' }}>
      <Meta color={BLUE_L}>Free Profile Analyser</Meta>
      <Headline lines={tall ? ['Your LinkedIn', 'profile has', 'a score.'] : ['Your LinkedIn profile has a score.']} color="#fff" />
      <Headline lines={["What's yours?"]} color={BLUE_L} delay={16} />
      <div style={{ position: 'relative', marginTop: tall ? 90 : 70, opacity: btn, transform: `scale(${(0.85 + 0.15 * btn) * click})`, transformOrigin: 'left center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 24, background: '#fff', borderRadius: 60, padding: tall ? '34px 64px' : '30px 60px', fontFamily: P, fontWeight: 700, fontSize: tall ? 52 : 46, color: BLUE, boxShadow: '0 20px 40px rgba(30,64,175,.45)' }}>
          Score my profile free
          <svg width="44" height="30" viewBox="0 0 44 30"><path d="M2 15 H40 M28 3 L40 15 L28 27" fill="none" stroke={BLUE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div style={{ position: 'absolute', left: tall ? 440 : 380, top: 60, width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: 20, border: '4px solid #fff', opacity: 1 - ripple, transform: `scale(${1 + ripple * 3})` }} />
        <svg style={{ position: 'absolute', left: interpolate(cur, [0, 1], [tall ? 760 : 700, tall ? 430 : 370]), top: interpolate(cur, [0, 1], [tall ? 260 : 230, 50]), opacity: ease(f, 60, 72) }} width="54" height="64" viewBox="0 0 27 32">
          <path d="M2 2 L2 26 L8.5 20 L13 30 L17 28 L12.5 18.5 L21 18.5 Z" fill={DARK} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
      <Rise delay={44} dist={16}><div style={{ fontFamily: I, fontSize: tall ? 38 : 32, color: BLUE_L, marginTop: 36 }}>socialsprint.co/profile-analyzer</div></Rise>
      <div style={{ position: 'absolute', right: tall ? undefined : 120, left: tall ? 84 : undefined, bottom: tall ? 140 : 90, opacity: ease(f, 50, 70) }}>
        <Wordmark width={tall ? 380 : 300} white />
      </div>
    </AbsoluteFill>
  );
};

// ---------- timeline ----------
const SCENES: [number, number, React.FC, string][] = [
  [S.gaps, S.intro, Gaps, OFF], [S.intro, S.add, Intro, BLUE],
  [S.add, S.score, AddProfile, BLUE_T], [S.score, S.fix, ScoreBreakdown, BLUE_T],
  [S.fix, S.cta, Fix, BLUE_T], [S.cta, TOTAL, Cta, BLUE],
];

export const Explainer: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const tall = useTall();
  // global progress line + small logo on light scenes
  const onLight = !(f >= S.intro && f < S.add) && f < S.cta;
  return (
    <AbsoluteFill style={{ background: OFF }}>
      {SCENES.map(([from, to, C, bg]) => (
        <Sequence key={from} from={from} durationInFrames={to - from}>
          <SceneFade dur={to - from} bg={bg}><C /></SceneFade>
        </Sequence>
      ))}
      {onLight && <div style={{ position: 'absolute', left: tall ? 84 : 120, top: tall ? 70 : 60 }}><Wordmark width={tall ? 230 : 190} /></div>}
      <div style={{ position: 'absolute', left: 0, bottom: 0, height: 8, width: `${(f / TOTAL) * 100}%`, background: f >= S.cta || (f >= S.intro && f < S.add) ? '#fff' : BLUE, opacity: 0.8 }} />
    </AbsoluteFill>
  );
};
