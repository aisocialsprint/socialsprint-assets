"""Insert kit visuals into an article's markdown.

Usage: python3 tools/insert.py article.md OUTDIR SLUG COMMIT_SHA > article_with_visuals.md
Each visual goes after the first paragraph that follows its `after_heading` H2
(matched case-insensitively, ignoring punctuation). The analyser card goes at
the very end as a linked image. The hero is NOT inserted: it is the cover_image_url.
Exits non-zero if a heading cannot be found, so nothing is silently dropped.
"""
import json, re, sys

REPO = 'aisocialsprint/socialsprint-assets'
REF = 'main'  # set to the commit SHA that added the files, so the CDN can never serve a stale copy
def url(slug, f): return f'https://cdn.jsdelivr.net/gh/{REPO}@{REF}/blog/{slug}/{f}'
def norm(s): return re.sub(r'[^a-z0-9 ]', '', s.lower()).strip()

def insert(md, man, slug):
    lines = md.split('\n'); missing = []
    for v in man:
        if v['kind'] in ('hero', 'analyser'): continue
        target = norm(v['after_heading'])
        idx = next((i for i, l in enumerate(lines) if l.startswith('## ') and norm(l[3:]) == target), None)
        if idx is None: missing.append(v['after_heading']); continue
        j = idx + 1
        while j < len(lines) and not lines[j].strip(): j += 1      # skip blanks
        while j < len(lines) and lines[j].strip(): j += 1          # end of first paragraph
        lines[j:j] = ['', f'![{v["alt"]}]({url(slug, v["file"])})']
    if missing:
        sys.exit(f'Heading(s) not found: {missing}')
    out = '\n'.join(lines).rstrip()
    for v in man:
        if v['kind'] == 'analyser':
            out += f'\n\n[![{v["alt"]}]({url(slug, v["file"])})]({v["link"]})\n'
    return out

if __name__ == '__main__':
    if len(sys.argv) > 4: REF = sys.argv[4]
    md = open(sys.argv[1]).read(); man = json.load(open(f'{sys.argv[2]}/manifest.json'))
    print(insert(md, man, sys.argv[3]))
