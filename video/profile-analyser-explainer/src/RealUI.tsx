// Variant B: same story, hook, music and CTA as Explainer.tsx, but the product shots are the real Profile Analyser UI.
//  - Intro and step 1 use real 3x captures of the public page (public/real/, made by tools/capture_ui.js).
//    The typing is a frame-by-frame capture of the real input, not an overlay.
//  - Step 2 rebuilds Andrea's real report (checked 21 Nov 2026) in the site's own UI style
//    (Inter, same colours, labels and layout), so text stays sharp when zoomed on a phone.
//  - Step 3 reuses variant A's design, filled with Andrea's real findings.
import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import {
  A, AMBER, BLUE, BLUE_L, BOX, Cta, Cue, Fix, GAPS, Gaps, Gauge, Headline, Layout, Meta, S, Scene, Shell, Sub, TOTAL,
  URL_TEXT, Wordmark, ease, useSpring, useTall,
} from './Explainer';

// ---------- the site's UI tokens (read from socialsprint.co computed styles) ----------
const UI = {
  font: 'Inter', text: '#3C4048', muted: '#6B7280', faint: '#9CA3AF', border: '#ECEEF2',
  blue: '#2563EB', pill: '#DBEAFE', track: '#F1F3F5', row: '#FAFBFC',
  high: '#EF4444', mid: '#EAB308', low: '#22C55E',
};
const OFFWHITE = '#F5F7FB';
const AMBER_T = '#FEF3C7';
// Variant B uses the same scene timings as variant A.
const SB = { ...S };

// Andrea's real report, 21 Nov 2026 (from the screenshots supplied)
const REPORT = {
  headline: 'Growth Marketing Lead at Pelion | IoT connectivity across 600+ networks with one SIM | B2B demand generation and social selling',
  reach: '2,762 followers · 2,347 connections',
  // from the report's "One place you lose impact" and "Where you lose impact" sections
  finding: "Headline foregrounds Pelion's offer over Andrea's.",
  more: ['About opening uses generic growth language', 'Channel lists outweigh concrete project examples'],
};

const UICard: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{
    position: 'absolute', background: '#fff', border: `1.5px solid ${UI.border}`, borderRadius: 20, boxSizing: 'border-box',
    boxShadow: '0 1px 2px rgba(16,24,40,.04), 0 14px 36px rgba(16,24,40,.09)', fontFamily: UI.font, color: UI.text, ...style,
  }}>{children}</div>
);
const Cursor: React.FC<{ x: number; y: number; opacity: number; scale?: number }> = ({ x, y, opacity, scale = 1 }) => (
  <svg style={{ position: 'absolute', left: x - 4, top: y - 4, opacity, transform: `scale(${scale})`, transformOrigin: '4px 4px' }} width="52" height="62" viewBox="0 0 27 32">
    <path d="M2 2 L2 26 L8.5 20 L13 30 L17 28 L12.5 18.5 L21 18.5 Z" fill="#0F172A" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
const Ripple: React.FC<{ x: number; y: number; f: number; at: number; color?: string }> = ({ x, y, f, at, color = '#fff' }) => {
  const r = ease(f, at, at + 24);
  if (f < at) return null;
  return <div style={{ position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44, borderRadius: 22, border: `4px solid ${color}`, opacity: 1 - r, transform: `scale(${1 + r * 2.5})` }} />;
};

// ---------- intro: the real landing page in a browser window ----------
const BrowserWindow: React.FC<{ width: number; src: string; zoom: number }> = ({ width, src, zoom }) => {
  const h = width * 560 / 1280;
  return (
    <div style={{ width, borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 30px 80px rgba(15,23,42,.35)' }}>
      <div style={{ height: 48, background: '#F3F4F6', display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', borderBottom: '1px solid #E5E7EB' }}>
        {['#F87171', '#FBBF24', '#34D399'].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
        <div style={{ flex: 1, marginLeft: 20, height: 30, borderRadius: 15, background: '#fff', fontFamily: UI.font, fontSize: 17, color: UI.muted, display: 'flex', alignItems: 'center', paddingLeft: 18 }}>socialsprint.co/profile-analyzer</div>
      </div>
      <div style={{ width, height: h, overflow: 'hidden' }}>
        <Img src={staticFile(src)} style={{ width, height: h, transform: `scale(${zoom})`, transformOrigin: '50% 70%' }} />
      </div>
    </div>
  );
};
const RealIntro: React.FC = () => {
  const tall = useTall(); const f = useCurrentFrame();
  const t = useSpring(2, 16), w = useSpring(10, 16);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: tall ? 48 : 36 }}>
      <div style={{ opacity: t, transform: `translateY(${(1 - t) * 20}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <Wordmark width={tall ? 420 : 300} white />
        {tall && <div style={{ fontFamily: 'Poppins', fontWeight: 900, fontSize: 110, color: '#fff', letterSpacing: -3, lineHeight: 1.05, textAlign: 'center' }}>Profile<br />Analyser</div>}
      </div>
      <div style={{ opacity: w, transform: `translateY(${(1 - w) * 60}px) scale(${0.94 + 0.06 * w})` }}>
        <BrowserWindow width={tall ? 990 : 1380} src="real/hero.png" zoom={1 + 0.05 * ease(f, 10, 90)} />
      </div>
      {!tall && <div style={{ opacity: ease(f, 30, 42), fontFamily: 'Inter', fontSize: 32, color: BLUE_L }}>Free. Your score in seconds.</div>}
    </AbsoluteFill>
  );
};

// ---------- step 1: real input, typed for real ----------
// Human-paced typing: about 10 keys a second, with short pauses after '.' and '/'. Frame of each keystroke:
const KEY_FRAMES = (() => {
  const gaps = [3, 2, 3, 3, 2, 3, 3, 2];
  let t = 8; const out: number[] = [];
  for (let i = 0; i < URL_TEXT.length; i++) {
    out.push(t);
    t += gaps[i % gaps.length] + ('./'.includes(URL_TEXT[i]) ? 3 : 0);
  }
  return out;
})();
const TYPED_AT = KEY_FRAMES[KEY_FRAMES.length - 1];
const CLICK = TYPED_AT + 22;
const FORM_W = 800, FORM_H = FORM_W * 586 / 1968, FORM_TOP = 290, FORM_LEFT = 10;
const S_CLIP = FORM_W / 656; // css px of the capture -> box px
const BTN = { x: FORM_LEFT + (403.6 + 90) * S_CLIP, y: FORM_TOP + 48 * S_CLIP, left: FORM_LEFT + 403.6 * S_CLIP, top: FORM_TOP + 24 * S_CLIP, w: 180.4 * S_CLIP, h: 48 * S_CLIP };
const RealAdd: React.FC = () => {
  const f = useCurrentFrame();
  const chars = KEY_FRAMES.filter((k) => k <= f).length;
  const hover = f >= CLICK - 8;
  const src = hover ? 'real/form-hover.png' : `real/form-${String(chars).padStart(2, '0')}.png`;
  const c = useSpring(2);
  const mv = ease(f, TYPED_AT + 2, CLICK - 4);
  const press = f >= CLICK && f < CLICK + 7;
  const zoom = 1 + 0.16 * ease(f, 8, TYPED_AT);
  return (
    <Layout
      copy={<>
        <Meta>Step 1</Meta>
        <Headline lines={['Paste your', 'LinkedIn URL.']} accent={1} />
        <Sub>Straight into the real Profile Analyser. Your score arrives in seconds.</Sub>
      </>}
      visual={<div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: `${BTN.x}px ${BTN.y}px` }}>
        <div style={{ position: 'absolute', left: FORM_LEFT, top: FORM_TOP, width: FORM_W, height: FORM_H, borderRadius: 22, overflow: 'hidden', opacity: c, transform: `translateY(${(1 - c) * 30}px)`, boxShadow: '0 20px 50px rgba(15,23,42,.14)' }}>
          <Img src={staticFile(src)} style={{ width: FORM_W, height: FORM_H, display: 'block' }} />
        </div>
        {press && <div style={{ position: 'absolute', left: BTN.left, top: BTN.top, width: BTN.w, height: BTN.h, borderRadius: 12, background: 'rgba(15,23,42,.18)' }} />}
        <Ripple x={BTN.x} y={BTN.y} f={f} at={CLICK} />
        <Cursor x={interpolate(mv, [0, 1], [BTN.x + 160, BTN.x + 10])} y={interpolate(mv, [0, 1], [BTN.y + 260, BTN.y + 6])} opacity={ease(f, TYPED_AT - 6, TYPED_AT + 2)} scale={press ? 0.9 : 1} />
      </div>}
    />
  );
};

// ---------- step 2: Andrea's real score ----------
const FLAG = 136; // frame in step 2 when the weakest pillar turns amber
const RealScore: React.FC = () => {
  const f = useCurrentFrame();
  const c = useSpring(2), g = useSpring(8), b = useSpring(66);
  const v = A.score * ease(f, 12, 60);
  const badge = spring({ frame: f - 60, fps: 30, config: { damping: 10 } });
  return (
    <Layout
      copy={<>
        <Meta>Step 2</Meta>
        <Headline lines={['Get your score', 'in seconds.']} accent={1} />
        <Sub>A real report: Andrea's profile, checked 21 Nov 2026.</Sub>
      </>}
      visual={<>
        <UICard style={{ left: 0, top: 0, width: BOX, height: 150, display: 'flex', alignItems: 'center', gap: 24, padding: '0 28px', opacity: c, transform: `translateY(${(1 - c) * 24}px)` }}>
          <Img src={staticFile('headshot.png')} style={{ width: 92, height: 92, borderRadius: 46, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 32, color: UI.text }}>Andrea Piras</div>
            <div style={{ fontSize: 19, lineHeight: 1.4, color: UI.muted, marginTop: 4 }}>{REPORT.headline}</div>
            <div style={{ fontSize: 15, color: UI.faint, marginTop: 4 }}>{REPORT.reach}</div>
          </div>
        </UICard>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 176, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: g, fontFamily: UI.font }}>
          <div style={{ position: 'relative' }}>
            <Gauge value={v} r={150} stroke={40} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontWeight: 700, fontSize: 128, color: UI.blue, letterSpacing: -4, lineHeight: 1 }}>{Math.round(v)}</div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontSize: 36, color: UI.muted }}>/ 100</div>
          </div>
          <div style={{ marginTop: 22, transform: `scale(${badge})`, border: `2px solid ${UI.pill}`, borderRadius: 999, padding: '6px 24px', fontWeight: 600, fontSize: 22, color: UI.blue, background: '#fff' }}>{A.band}</div>
        </div>
        <div style={{ position: 'absolute', left: 0, top: 500, opacity: b, fontFamily: UI.font, fontWeight: 600, fontSize: 26, color: UI.text }}>Score breakdown</div>
        {A.pillars.map(([label, val], i) => {
          const s = spring({ frame: f - 72 - i * 8, fps: 30, config: { damping: 16 } });
          const p = ease(f, 76 + i * 8, 106 + i * 8);
          const low = val === Math.min(...A.pillars.map((x) => x[1]));
          const flag = low ? ease(f, FLAG, FLAG + 12) : 0;
          const pill = low ? spring({ frame: f - FLAG - 4, fps: 30, config: { damping: 11 } }) : 0;
          const col = flag > 0.5 ? AMBER : UI.blue;
          return <UICard key={label} style={{ left: (i % 2) * 420, top: 548 + Math.floor(i / 2) * 136, width: 400, height: 116, padding: '22px 24px', borderRadius: 16, opacity: s, transform: `translateY(${(1 - s) * 20}px)`, borderColor: flag > 0.5 ? '#FCD34D' : UI.border }}>
            {low && <div style={{ position: 'absolute', right: 16, top: -20, transform: `scale(${pill})`, transformOrigin: 'right center', background: AMBER_T, border: `2px solid ${AMBER}`, color: '#92400E', borderRadius: 999, padding: '4px 16px', fontWeight: 600, fontSize: 20, whiteSpace: 'nowrap' }}>Biggest room to grow</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 22, color: UI.text }}>{label}</span>
              <span style={{ fontWeight: 700, fontSize: 28, color: col }}>{Math.round(val * p)}/25</span>
            </div>
            <div style={{ marginTop: 18, height: 10, borderRadius: 5, background: UI.track, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: 10, borderRadius: 5, width: `${(val / 25) * 100 * p}%`, background: UI.blue }} />
              <div style={{ position: 'absolute', left: 0, top: 0, height: 10, borderRadius: 5, width: `${(val / 25) * 100 * p}%`, background: AMBER, opacity: flag }} />
            </div>
          </UICard>;
        })}
      </>}
    />
  );
};

// ---------- step 3: variant A's design, Andrea's real findings ----------
const Step3: React.FC = () => <Fix example={false} finding={REPORT.finding} listTitle="Where else you lose impact" items={REPORT.more} />;

// ---------- timeline and sound ----------
const SCENES_B: Scene[] = [
  [S.gaps, S.intro, Gaps, '#F8FAFC'], [S.intro, S.add, RealIntro, BLUE],
  [SB.add, SB.score, RealAdd, OFFWHITE], [SB.score, SB.fix, RealScore, OFFWHITE],
  [SB.fix, SB.cta, Step3, OFFWHITE], [SB.cta, TOTAL, Cta, BLUE],
];
const CUES_B: Cue[] = [
  ...GAPS.map((g, i): Cue => [S.gaps + g.at + 6, 'pop', 0.55, 1 + i * 0.12]),
  [S.intro - 8, 'whoosh', 0.35, 1],
  [S.intro + 10, 'whoosh', 0.18, 1.4],
  ...KEY_FRAMES.map((k, i): Cue => [SB.add + k, `key${(i * 3) % 4 + 1}`, 0.38, 0.97 + ((i * 7) % 5) * 0.015]),
  [SB.add + CLICK, 'click', 0.55, 1],
  [SB.score - 4, 'whoosh', 0.2, 1.2],
  [SB.score + 12, 'rise', 0.22, 1],
  [SB.score + 60, 'chime', 0.4, 1],
  ...A.pillars.map((_, i): Cue => [SB.score + 72 + i * 8, 'pop', 0.25, 1.3 + i * 0.1]),
  [SB.score + FLAG, 'pop', 0.4, 0.7],
  [SB.fix - 4, 'whoosh', 0.2, 1.2],
  [SB.fix + 18, 'shimmer', 0.3, 1],
  [SB.fix + 58, 'tick', 0.3, 1], [SB.fix + 68, 'tick', 0.3, 1.08],
  [S.cta - 4, 'whoosh', 0.3, 1],
  [S.cta + 30, 'pop', 0.4, 0.9],
  [S.cta + 112, 'click', 0.6, 1],
  [S.cta + 114, 'chime', 0.35, 0.75],
];

export const RealUIExplainer: React.FC = () => <Shell scenes={SCENES_B} cues={CUES_B} />;
