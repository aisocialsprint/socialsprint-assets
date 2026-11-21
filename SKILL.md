---
name: ss-blog-visual-kit
description: Builds the SocialSprint blog visual kit for one article (insight hero cover, 3 to 5 inline visuals, Profile Analyser end card), hosts it on the socialsprint-assets CDN and inserts it into the article markdown. Use for every new SocialSprint blog draft.
---

# SocialSprint Blog Visual Kit (signed off by Andrea, 21 Nov 2026)

Every SocialSprint blog article gets: an **insight hero** as its cover, **3 to 5 inline visuals** placed under its H2 sections, and the **Profile Analyser card** at the very end. Everything is rendered from fixed templates in the `aisocialsprint/socialsprint-assets` repo, hosted through jsDelivr, and inserted into the article markdown before the draft is created.

The templates, renderer and brand files live in the repo. This file is the rulebook. Never draw visuals by hand or change the templates during a run: if a template cannot express something, skip that visual.

## 1. Setup (once per run)

1. Attach the repo with write access: `add_repo` owner `aisocialsprint`, repo `socialsprint-assets`, access `push`. Clone it exactly as the tool result says (to `/home/claude/socialsprint-assets`).
2. Install and check fonts:
```bash
pip install cairosvg --break-system-packages -q
mkdir -p ~/.fonts && cd ~/.fonts && for w in ExtraBold Black; do curl -sSfLO https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-$w.ttf; done; fc-cache -f
fc-list | grep -ciE "Poppins.*(ExtraBold|Black)"   # must print 2
```
Inter and Poppins Bold ship with the environment. If the check fails, stop the kit and report "fonts unavailable".

## 2. Plan the visuals from the finished article

Read the final article body. Write `specs/<slug>.json` in the repo (schema in section 4). Rules:

- **Only numbers that appear in the article, each with the named source the article gives.** Never invent, round differently or combine numbers into a new claim. A ratio you compute (e.g. "4 to 5 of 10" from 45%) must be stated in the article or be plain arithmetic from one sourced number.
- **One visual per H2 at most**, 3 to 5 in total. Never under "FAQ", "Key takeaways" or "Conclusion". `after_heading` must match the H2 text exactly as written in the markdown.
- **Pick the template by what the section says:**
  - `bars`: a section with 2 to 4 comparable numbers in the same unit (percentages from one study). Use a third row element for a display label such as "88–90%".
  - `people`: one percentage that is best felt as "N in 10" (turnover, reply rate, adoption).
  - `big_stat`: the single most striking number in the article (a cost, a growth multiple). Max one per article.
  - `framework`: a "how to" or "what to do" section with 2 to 4 steps. Titles max ~22 characters, text max ~2 lines.
  - `checklist`: something the reader should track or check, 3 to 4 items. The `cta` line is always "More breakdowns like this: socialsprint.co/resources" unless a real downloadable resource exists.
  - `quote`: to emphasise a concept or borrow authority. **Never Andrea** (he is the author). Choose the mode in this order:
    1. `person`: a named expert quoted word for word in the article or its cited source. Shown with initials only, never a photo.
    2. `org`: a company, report or release quoted word for word (e.g. a release headline).
    3. `none`: no attribution available. A "Key idea" card carrying the article's sharpest line.
- **Use at least 3 different templates** in one article, and never two `big_stat` or two `quote` cards.
- **Alt text** for every visual: one sentence stating the data and the source, e.g. "45% of SDRs leave every year. Source: Optifai."

## 3. Pick the hero metaphor (rotate, never repeat)

The hero is 1200 x 630: logo, the headline, one picture of the article's key number, the number and a short label. Metaphors:

| metaphor | use for | fields |
|---|---|---|
| `people` | a share of people (turnover, attainment) | `total` (10), `gone` (outlined figures, decimals allowed) |
| `gauge` | progress towards a target (quota, adoption) | `pct`, `end_label` |
| `waffle` | "N in every 100" | `pct`, optional `caption` |
| `compare` | a multiple or before/after | `rows`: [[label, value], ...] 2 to 3 bars |
| `split` | one share of a whole | `pct` |

**Never reuse the metaphor of either of the two most recently published heroes.** Find them with:
```bash
cd /home/claude/socialsprint-assets && for d in $(git log --format= --name-only -- 'blog/*/manifest.json' | awk -F/ '!s[$2]++{print $2}' | head -2); do python3 -c "import json;print('$d', [m.get('metaphor') for m in json.load(open('blog/$d/manifest.json')) if m['kind']=='hero'])"; done
```
`value` must be max ~5 characters ("35%", "12x", "$177k" is NOT allowed unless the article says "$177k"). The `title` is the article title in sentence case.

## 4. Spec schema

```json
{
 "slug": "article-slug",
 "title": "Article title in sentence case",
 "hero": {"metaphor": "gauge", "pct": 55, "end_label": "All sellers", "value": "55%", "label": "will hit quota in 2026", "alt": "..."},
 "visuals": [
  {"type": "bars", "after_heading": "Exact H2", "meta": "Short overline", "headline": "One line, max ~45 chars",
   "rows": [["Label", 57], ["Label", 89, "88–90%"]], "max": 100, "avg": {"value": 35, "label": "All roles: 35%"}, "note": "optional line",
   "source": "Source: Organisation, report", "alt": "..."},
  {"type": "people", "after_heading": "...", "count": 4.5, "meta": "...", "headline": "max 2 lines", "in_label": "Leave", "out_label": "Stay", "source": "...", "alt": "..."},
  {"type": "big_stat", "after_heading": "...", "meta": "...", "value": "$177,171", "line": "max 2 lines", "chips": ["up to 4 short labels from the article"], "source": "...", "alt": "..."},
  {"type": "framework", "after_heading": "...", "meta": "...", "headline": "...", "items": [{"title": "...", "text": "..."}], "source": "...", "alt": "..."},
  {"type": "checklist", "after_heading": "...", "meta": "...", "headline": "...", "items": [["Title", "Sub line"]], "cta": "More breakdowns like this: socialsprint.co/resources", "alt": "..."},
  {"type": "quote", "after_heading": "...", "mode": "person|org|none", "name": "...", "role": "...", "text": "verbatim quote", "meta": "Key idea", "source": "...", "alt": "..."}
 ]
}
```
UK English, no em dashes anywhere (the renderer refuses them), no emojis.

## 5. Render and check

```bash
cd /home/claude/socialsprint-assets && python3 tools/kit.py specs/<slug>.json blog/<slug>
```
The renderer asserts text fits; if it raises, shorten the copy and rerun (max 3 tries per visual, then drop that visual). Then **open every image with the Read tool** and fail it if: text overlaps or is clipped, a number is not in the article, a label sits away from its element, the hero metaphor repeats one of the last two, or anything looks off-brand. Fix and rerender (max 3 loops).

The Profile Analyser card is always added. Andrea's score and pillar numbers are the `ANALYSER` setting at the top of `tools/kit.py`; only change them when Andrea gives a new score.

## 6. Publish and insert

```bash
cd /home/claude/socialsprint-assets && git add blog/<slug> specs/<slug>.json && \
git -c user.name="SocialSprint bot" -c user.email="noreply@anthropic.com" commit -qm "Blog visuals: <slug>" && \
git -c push.negotiate=true push origin main && SHA=$(git rev-parse HEAD)
python3 tools/insert.py article.md blog/<slug> <slug> $SHA > article_with_visuals.md
```
- Files for a slug are written once. If a slug already exists in `blog/`, stop and report it rather than overwriting.
- URLs are pinned to the commit SHA, so the CDN never serves a stale file: `https://cdn.jsdelivr.net/gh/aisocialsprint/socialsprint-assets@<SHA>/blog/<slug>/<file>`.
- **Cover image URL** = that URL for `hero.jpg`. Use it in both the Notion Cover Image field and `cover_image_url`.
- `insert.py` exits with an error if an `after_heading` is not found; fix the spec, never drop the visual silently.
- The article body passed to Notion and to `create_blog_draft` is `article_with_visuals.md`.

## 7. Report

Return to the caller: the hero URL, the hero metaphor, the list of inline visuals (template + heading), total KB, and any visual dropped with the reason.
