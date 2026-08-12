# Landing page (IA + hero copy)

> Per [ADR-0012](./adr/0012-ai-era-data-structure-platform.md) (accepted · option B). Implementation: `/` → `frontend/src/pages/landing` (`layout: false`); login page "Learn about the product" back-link.

## Information architecture (IA)

Main narrative on `/`, comparison deep link `/compare` (shared landing shell; no extra marketing subpages):

1. **Hero**: brand ERD Online (hero level) + one-line positioning + primary/secondary CTAs; **full-bleed** real designer screenshot as background (`/landing-hero.jpg`), not a sidebar inset
2. **Three value props**: versions / collaboration / open (API/MCP roadmap, see ADR-0013)
3. **30-second path**: `/demo` + self-host docs external link
4. **Comparison summary**: vs dbdiagram / dbml four-row table + "View full comparison" → `/compare`
5. **Footer**: docs ([GitHub Pages](https://erdonline.github.io/erdonline/)), Roadmap (`/docs/roadmap`), comparison, community (GitHub Issues), login (logged-in: "Go to workspace")

### `/compare` subpage

- Honest comparison table: collaboration / versions / approval audit / read-only share / open self-host / DBML / agent fact source
- CTAs: open demo / self-host guide / back to home
- Keyboard: same shell Skip "Skip to main action" → `#landing-main-cta`; CTA Tab order demo→self-host→home; surface focus-visible; no trap (E2E `compare` "compare page keyboard")
- Implementation: `frontend/src/pages/landing/compare.tsx` + `LandingChrome`; E2E `compare.spec.ts`

## Hero copy

- Brand: ERD Online (hero level, dominates subtitle)
- Headline: Git + Figma for database design
- Subhead: Versions, collaboration, open format—humans and AI agents share one data structure. Try in 30 seconds, no signup.
- Logged-out CTAs: Try online (primary) / Register (secondary) / Already have an account? Log in (text); GitHub only in top bar
- Logged-in CTAs: Go to workspace (primary) / Open demo (secondary); top bar and footer sync "Go to workspace"

## Visual constraints

- Full-bleed product screenshot + left readable scrim; no inset/card hero, no purple gradient AI slop
- Palette from `theme/css-vars.less`: base `--erd-ink-900`, primary CTA `--erd-brand`, accents success/warning; type `--erd-font-ui` / `--erd-font-display`; landing must not invent a second palette
- Secondary density: below-fold sections ~2.75rem, comparison rows 0.5, nav/footer tight; `/compare` header padT 1.5; **do not compress** hero brand size / full-bleed layout / CTA hierarchy
- Keyboard: first focus Skip "Skip to main action" → hero `#landing-main-cta` (`/compare` CTAs same anchor); shell `:focus-visible` surface ring; no artificial positive `tabIndex`

## Out of scope

- No multi-page marketing site (`/` main narrative + only `/compare` comparison deep link allowed; everything else goes to docs)
- No exaggerated AI-generated demo animation; AI narrative is "open + auditable" only
- No hard redirect kicking logged-in users off landing (guide with primary CTA is enough)
