# Profile Analyser explainer (Remotion)

30-second animated explainer for the SocialSprint Profile Analyser, rendered from one composition in two formats:

| composition | size | file |
|---|---|---|
| `ExplainerWide` | 1920 x 1080 (16:9) | `renders/profile-analyser-30s-16x9.mp4` |
| `ExplainerTall` | 1080 x 1920 (9:16) | `renders/profile-analyser-30s-9x16.mp4` |

30 fps, no audio (built for silent autoplay; all copy is on screen). An earlier 60-second cut is kept as `renders/profile-analyser-60s-*.mp4`; its source is in this folder's git history.

## Storyboard
| time | scene | copy |
|---|---|---|
| 0:00 | Hook | Buyers check your profile first. Small gaps quietly cost you replies. |
| 0:05 | Intro | SocialSprint Profile Analyser: a free score out of 100. |
| 0:08 | Step 1 | Add your LinkedIn profile (URL typed, sections ticked off). |
| 0:12.5 | Step 2 | Get your score out of 100 (gauge counts to 73, four pillars fill). |
| 0:18.5 | Step 3 | Fix the first thing that matters (one fix + next steps). |
| 0:23.5 | CTA | Your LinkedIn profile has a score. What's yours? socialsprint.co/profile-analyzer |

The score and pillars are Andrea's real scan (same as `ANALYSER` in `tools/kit.py`) and are labelled "Example report". The fix and next-step lines are illustrative.

## Edit and render
```bash
npm install
npm run studio          # live preview
npm run render:wide     # -> out/profile-analyser-16x9.mp4
npm run render:tall     # -> out/profile-analyser-9x16.mp4
```
Copy, timings (`S`) and score data (`A`) are at the top of `src/Explainer.tsx`. Brand colours and fonts match the blog visual kit.
