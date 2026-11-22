# Profile Analyser explainer (Remotion)

60-second animated explainer for the SocialSprint Profile Analyser, rendered from one composition in two formats:

| composition | size | file |
|---|---|---|
| `ExplainerWide` | 1920 x 1080 (16:9) | `renders/profile-analyser-16x9.mp4` |
| `ExplainerTall` | 1080 x 1920 (9:16) | `renders/profile-analyser-9x16.mp4` |

30 fps, no audio (built for silent autoplay; all copy is on screen).

## Storyboard
| time | scene | copy |
|---|---|---|
| 0:00 | Hook | Buyers check your profile before they reply. |
| 0:06 | Problem | Small gaps quietly cost you replies. |
| 0:13 | Intro | SocialSprint Profile Analyser: a free score out of 100. |
| 0:19 | Step 1 | Add your LinkedIn profile (URL typed, sections ticked off). |
| 0:28 | Step 2 | Get one clear score (gauge counts to 73, band "Strong"). |
| 0:36 | Step 3 | See where the points go (four pillars, each out of 25). |
| 0:44 | Step 4 | Fix the first thing that matters (one fix + next steps). |
| 0:52 | CTA | Your LinkedIn profile has a score. What's yours? socialsprint.co/profile-analyzer |

The score and pillars are Andrea's real scan (same as `ANALYSER` in `tools/kit.py`) and are labelled "Example report". The fix and next-step lines are illustrative.

## Edit and render
```bash
npm install
npm run studio          # live preview
npm run render:wide     # -> out/profile-analyser-16x9.mp4
npm run render:tall     # -> out/profile-analyser-9x16.mp4
```
Copy, timings (`S`) and score data (`A`) are at the top of `src/Explainer.tsx`. Brand colours and fonts match the blog visual kit.
