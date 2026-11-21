# socialsprint-assets

Public image host for the SocialSprint blog. Images are served through jsDelivr:
`https://cdn.jsdelivr.net/gh/aisocialsprint/socialsprint-assets@main/blog/<slug>/<file>`

- `blog/<slug>/`  visuals for one article (hero.jpg = cover, NN-*.webp = inline, zz-analyser.webp = end card, manifest.json)
- `tools/kit.py`  renders the Blog Visual Kit from a spec JSON (`python3 tools/kit.py spec.json blog/<slug>`)
- `tools/insert.py` inserts the visuals into an article's markdown
- `brand/`  wordmark paths and headshot
- `specs/`  the spec used for each article

Files are never overwritten once published: a revised visual gets a new file name, so the CDN cache never serves a stale image.
