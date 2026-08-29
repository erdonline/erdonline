# X long-form + platform extras — 2026-08-29 SEO essay

Companion to `2026-08-29-seo-essay.en.md` (EN longform) and `2026-08-29-seo-essay.zh.md` (ZH longform).

- **X**: Premium long-form article. Paste the title into the title field and the body below into the article body. **Not a 280-char tweet, not a thread.**
- Body is deliberately plain prose: no `#` headers, no markdown tables, no code fences. X renders those literally.

---

## X title

```
Average position 1. Zero clicks. Our site had eight URLs and one identity.
```

## X body (paste as-is, below the line)

Search Console told us we were ranking. In Singapore, average position 1. Across three months: 42 impressions, zero clicks. Not a low click-through rate — none.

Twelve days and one engineering pass later, the same property read 2 clicks / 103 impressions / 1.9% CTR / average position 62.7. Inside that were two rows that shouldn't be able to coexist. Our homepage: 1 click, 90 impressions, average position 61.3. Our comparison page: 1 click, 8 impressions, average position around 2 to 3.

One page buried on page six for the queries people actually type. Another sitting at position two for a query almost nobody types.

The instinct in that moment is to write more content, because "more content" is the answer every SEO article gives. It was the wrong read, and chasing it would have cost us a month.

The real problem was that our site had one identity. Eight marketing URLs, a sitemap, hreflang tags, JSON-LD — all present, and every one of those URLs handed Google the same first byte.

THE DIAGNOSIS TAKES ONE COMMAND

We ship a client-rendered UmiJS app on Cloudflare Pages. Before diagnosing anything clever, curl what the crawler gets:

curl -sL https://www.erdonline.com/catalog | grep -E '<title>|rel="canonical"'

For months the answer was the homepage's title tag and a canonical pointing at the site root. Same for /compare. Same for /en. Same for /demo. And then this:

curl -sI https://www.erdonline.com/__seo_health_nonexistent_path__ → HTTP/2 200

A URL that has never existed, returning 200 with the homepage in the body. That's a soft 404, and once you have one you have infinitely many. Googlebot doesn't see a site with eight pages plus some noise. It sees one page reachable at an unbounded number of addresses, which is the exact shape of a low-quality site, and it responds by keeping one URL and quietly discarding the rest.

Rank was never the bottleneck. Being a distinct page was.

TWO PLATFORM DEFAULTS, BOTH DOCUMENTED, BOTH EASY TO MISS

Neither cause was exotic. Both were things we wrote ourselves and then stopped looking at.

First, a catch-all rewrite. Our _redirects file contained "/* /index.html 200". This is the line every SPA tutorial tells you to add so client-side routing survives a hard refresh, and it's correct for a path like /project/1234, which lives behind a login and has no business being indexed. It is destructive for /compare, a page whose entire job is to be indexed under its own title.

Second, no top-level 404.html. Cloudflare Pages has a documented rule that catches people: with no 404.html at the root of your build output, Pages assumes you're a single-page app and serves 200 plus index.html for every path that doesn't match a static file. Ship a 404.html and automatic SPA mode turns off — unmatched paths get a real HTTP 404. One file, and infinite soft 404s stop.

Three smaller footguns cost us a deploy each, and nobody writes these down. A rewrite target of /index.html doesn't work, because Cloudflare 308-redirects *.html to its extension-less form, so an invisible rewrite becomes a redirect to the root. The splat in "/catalog/* → / 200" matches /catalog/ with an empty segment, so the catch-all silently shadowed the list-page shell we had just generated; it has to be /catalog/:id. And we first sent unknown template IDs to a placeholder shell at /catalog/_item — because that path is a directory, Cloudflare 308'd the bad ID onto /catalog/_item/, so we invented a brand-new crawlable junk URL while trying to clean up crawlable junk URLs.

Every one of those is a redirect rule that is almost right. That's the point: this class of bug produces a perfectly working website for humans and an unindexable one for crawlers, and no amount of reading your React code will surface it.

FOUR ARTIFACTS, ONE SOURCE OF TRUTH

The fix was to prerender a per-path shell at build time — dist/catalog/index.html, dist/compare/index.html, dist/en/compare/index.html — each carrying its own title, canonical, hreflang set and JSON-LD, then remove those exact paths from the redirect file so the static file wins.

That's the obvious half. The half worth stealing is what keeps it from rotting.

Adding one public route requires four artifacts to agree: the URL list in sitemap.xml, the set of paths that get a prerendered shell, the Cloudflare redirect rules for everything that doesn't, and the nginx map for self-hosted Docker deployments. Four files, maintained by hand, in a repo where the person adding a route is thinking about React Router and nothing else. They will drift. Ours did.

So they all became derived values exported from one module: SITEMAP_PATHS, PRERENDER_PAGES, CF_SPA_REDIRECT_RULES, NGINX_SPA_URI_REGEXES, plus helpers for hreflang and JSON-LD. The build script consumes it and writes sitemap.xml, robots.txt, the redirects file, the headers file, 404.html and every shell in one pass. Adding a route is one entry in one array. Drift between the sitemap and the redirects is no longer a mistake you can make.

TWO BUGS THAT ONLY EXIST IN SINGLE-PAGE APPS

Hydration fought the shell. Our template detail page prerendered correctly, then the client booted and the catalog layout called our SEO hook unconditionally — so a few hundred milliseconds later the detail page's title was replaced by the list page's title. The prerender was right and the app overwrote it. If you prerender per-path metadata in a CSR app, your client-side SEO hook has to know which page it's on, or you've built two systems that disagree about the title tag.

And every page claimed to be the app. Our JSON-LD generator parameterized the url field and nothing else, so @type stayed WebApplication everywhere — eight distinct pages each announcing themselves as the application living at the site root, structured data actively contradicting the canonical tags we had just fixed. It's now typed per path: the homepage is a WebApplication, the template list is a CollectionPage, an official template detail is an ItemPage, everything else is a WebPage.

THE TITLE PROBLEM WAS A PROMISE PROBLEM

Position 1 with zero clicks is not a ranking failure. It's a snippet that doesn't sound like the thing the searcher wanted.

Ours was brand-first, and the searcher's job was not "learn about a brand." It was "draw an ER diagram, in a browser, now." The queries said so plainly: erd online, erd diagram online, make/create/draw erd online. So the title went job-first — "Draw ER Diagram Online — Free Editor | ERD Online" — with a description covering the intent cluster in one honest sentence.

Three things we deliberately did not do, now written down as rules rather than left to judgment. We don't claim "file viewer": it's a plausible high-volume phrase, we support ERD/PdMan/DBML import, and we do not ship a dedicated file viewer — ranking for a query you can't satisfy buys one visit and one bounce. We don't name Google Draw: our comparison page names draw.io because we have a real technical claim there, that a line in draw.io is a line while a relationship in ERD Online carries foreign-key semantics, and we won't name a product we haven't actually compared. And we don't stuff the non-English queries we can see in the report, because impressions from an audience we don't serve in their language aren't a win.

Our H1 stayed "Git + Figma for database design." The title tag and the H1 now disagree on purpose: the title answers a query, the H1 answers "what is this and why should I care" for someone who already arrived. Collapsing both into keywords costs you the second job and reads like a landing page from 2011.

MAKE THE CRAWLER'S VIEW A TEST

This failure mode is silent, so the only durable fix is an assertion. A script runs daily in CI against the live site and checks: every key page returns 200 and text/html with a non-empty title, a non-empty description, a canonical, and no noindex; robots.txt returns 200, is not served as text/html (that means the SPA fallback ate it), contains an absolute Sitemap line, and does not contain "content-signal:" (that string is how you detect your platform's injected default robots.txt still winning over yours); a known-nonexistent path must return 404; the real SPA routes must still return 200, because the obvious way to fix soft 404s is to break your real routes; and the sitemap parses with its first twenty URLs reachable.

Our production smoke suite now has a test named, verbatim, "crawler first HTML uses path canonical (not homepage)". The bug we shipped for months has a name in a test file.

Two more non-obvious findings from the same pass. Cache headers alone did nothing: our homepage returned CF-Cache-Status DYNAMIC with TTFB around 1.6s while Search Console flagged impressions sliding, we set s-maxage on the HTML shells, and nothing changed — Cloudflare Pages treats text/html as dynamic by default, and you must also create a Cache Rule in the dashboard making HTML eligible for cache. And pick one trailing-slash form: ours had a canonical without a slash, a sitemap loc without a slash, a host that 308'd to a slash, and legacy redirects pointing at the non-slash form, so an old URL took a 301 and then a 308 to arrive.

WHAT WE STOPPED DOING

Clicking "Request indexing." We tried it twice on one URL and got Search Console's reCAPTCHA error both times; nothing entered the queue. Manual submission is a nudge, not a mechanism, and treating it as progress hides the fact that your artifacts are still wrong. Fix the artifact, submit the sitemap, then wait.

We also decided in advance what would make us change strategy. Our locale-routing ADR ships English marketing pages as CSR with a sitemap and hreflang, and states the trigger explicitly: if /en is not indexed 90 days after launch, we build static export for the marketing routes. Writing the trigger down before you need it is what stops "should we go SSR?" from being re-litigated every two weeks on vibes.

That ADR is also worth reading for what it refused. Full-site /en/* routing would have touched 60 route entries, 76 history.push call sites across 39 files, 236 page.goto calls in the E2E suite, 16 backend files containing frontend URLs, and the immutable share links already pasted into other people's chat logs — while the pages that would have gained are all behind a login and have no search value at all. Marketing pages got the prefix. Nothing else did.

THE SCOREBOARD, HONESTLY

Today: three of our marketing URLs are indexed, one is "discovered — currently not indexed," the docs site's English sitemap was accepted with 66 pages discovered, and total organic clicks over three months is 2.

This is not a traffic case study. Indexing moves on a timescale of weeks, and attaching a hockey stick to a twelve-day engineering pass would be dishonest. What we can report is that the crawler's view of the site is now correct, asserted daily, and cheap to extend — the part that had to be true before any content investment could compound.

THE CHECKLIST

If you run a client-rendered site, these are worth thirty minutes. Curl a non-homepage URL and grep for title and canonical; if you see your homepage, stop and fix that first. Curl a path that definitely doesn't exist; if it's 200, you have unbounded soft 404s, and on Cloudflare Pages the fix is a root 404.html. Delete the catch-all rewrite and enumerate the SPA paths that genuinely need a 200. Make sitemap, prerendered shells, host rewrites and self-host rewrites derive from one module. Check that hydration isn't overwriting per-path metadata your build just wrote. Check that JSON-LD @type is per-page rather than the homepage type with a swapped url. Pick one trailing-slash form and make canonical, sitemap, host redirect and legacy redirects all agree. Then turn every one of those into a daily assertion against production, because this bug class is silent by construction.

WHAT WE'RE BUILDING

ERD Online is an open-source (MIT) database design tool: Git + Figma for database design. Versions and collaboration are the moat, and the projectJSON format is open so humans and AI agents read and write the same source of truth — an agent can call create_version through MCP, and a human still reviews the diff in the designer. It is not ChatSQL; it will not invent a diagram from a sentence.

Open a real ER diagram, read-only, no signup: https://www.erdonline.com/demo

Source, issues, and the SEO scripts described above: https://github.com/erdonline/erdonline

---

## Platform tag lines

- **掘金** — 分类「前端」；标签：`SEO` `前端` `Cloudflare` `开源`
- **CSDN** — 标签：`SEO` `前端` `Cloudflare` `开源` `数据库`
- **Dev.to / Hashnode** — tags: `seo` `webdev` `cloudflare` `opensource`
