# Profile Analyser explainer (Remotion)

30-second animated explainer for the SocialSprint Profile Analyser, rendered from one composition in two formats:

| composition | size | file |
|---|---|---|
| `ExplainerWide` | 1920 x 1080 (16:9) | `renders/profile-analyser-30s-16x9.mp4` |
| `ExplainerTall` | 1080 x 1920 (9:16) | `renders/profile-analyser-30s-9x16.mp4` |

30 fps, with music and sound effects, loudness-normalised to -14 LUFS. `*-silent.mp4` versions have no audio, for TikTok and Reels where a sound is added in the app. All copy is on screen, so the video works muted. An earlier 60-second cut is kept as `renders/profile-analyser-60s-*.mp4`; its source is in this folder's git history.

## Storyboard
| time | scene | copy |
|---|---|---|
| 0:00 | Hook | People check your profile first. Small gaps quietly cost you opportunities. |
| 0:05 | Intro | SocialSprint Profile Analyser: a free score out of 100. |
| 0:08 | Step 1 | Add your LinkedIn profile (URL typed, sections ticked off). |
| 0:12.5 | Step 2 | Get your score out of 100 (gauge counts to 73, four pillars fill). |
| 0:18.5 | Step 3 | Fix the first thing that matters (one fix + next steps). |
| 0:23.5 | CTA | Your LinkedIn profile has a score. What's yours? socialsprint.co/profile-analyzer |

The score and pillars are Andrea's real scan (same as `ANALYSER` in `tools/kit.py`) and are labelled "Example report". The fix and next-step lines are illustrative.

## Variant B: real product UI
Same hook, timings, music and CTA as variant A; only the product shots change, so an A/B test isolates them.

| composition | file |
|---|---|
| `RealUIWide` | `renders/profile-analyser-30s-realui-16x9.mp4` (+ `-silent`) |
| `RealUITall` | `renders/profile-analyser-30s-realui-9x16.mp4` (+ `-silent`) |

- Intro and step 1 use real 3x captures of socialsprint.co/profile-analyzer (`public/real/`, made by `npm run capture:ui`, which types into the real input frame by frame and never submits the form).
- Step 1 types at a human pace (about 10 keys a second, short pauses after `.` and `/`); one keystroke sound per character from the same schedule. Scene timings match variant A.
- Step 2 rebuilds Andrea's real report (checked 21 Nov 2026) in the site's UI style (Inter, same colours, labels and layout) so text stays sharp when zoomed: score 73 Strong and the four pillars, with Best practices turning amber under a "Biggest room to grow" label.
- Step 3 reuses variant A's design, filled with Andrea's real findings ("Headline foregrounds Pelion's offer over Andrea's" plus two more places he loses impact).
- Source: `src/RealUI.tsx`. Re-run the capture if the landing page changes.

## Audio
Everything is synthesised by `tools/gen_audio.py` (numpy + ffmpeg), so there are no samples or licences involved:
- `public/audio/music.mp3`: 30 s original bed at 120 BPM (one beat = 15 frames, so every scene cut lands on a beat). Pad and arp for the hook, riser into the intro at 4 s, drums and bass from 5 s, final chord at 28 s.
- Sound effects: `pop` (warning tags, score bars, CTA button), `key` (URL typing), `click` (Analyse and CTA buttons), `tick` (sections read, next steps), `whoosh` (scene changes), `rise` (score count-up), `chime` (score band, CTA click), `shimmer` (fix revealed).

Cue timings live in `CUES` in `src/Explainer.tsx` and are derived from the same frame numbers as the animations. To use a licensed track instead, replace `public/audio/music.mp3` (any 30 s file) and re-render.

## Edit and render
```bash
npm install
npm run studio          # live preview
python3 tools/gen_audio.py   # only if you change the audio
npm run render:wide     # -> out/profile-analyser-16x9.mp4
npm run render:tall     # -> out/profile-analyser-9x16.mp4
# normalise loudness for social (video stream copied untouched)
ffmpeg -i out/profile-analyser-16x9.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 192k renders/profile-analyser-30s-16x9.mp4
# silent version: add --muted to the render command
```
Copy, timings (`S`) and score data (`A`) are at the top of `src/Explainer.tsx`. Brand colours and fonts match the blog visual kit.
