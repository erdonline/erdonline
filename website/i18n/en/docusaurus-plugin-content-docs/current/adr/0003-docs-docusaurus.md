# ADR-0003: Docs publishing stack — Docusaurus

- Status: Accepted (2026-08-01)
- Decision makers: Project maintainers

## Context

Need a docs publishing stack for: landing page, user docs, contributor docs, ADRs, release log. Candidates: VitePress (Vue stack), Nextra (tied to Next.js), MkDocs Material (Python toolchain), GitBook/Mintlify (weak SaaS autonomy), bare GitHub rendering (no search/versioning).

## Decision

**Docusaurus + GitHub Pages**, one system, three roles:

- Home = landing page (hero + screenshots + demo entry)
- docs = doc site, consuming repo `docs/` directly (single source of truth, readable on GitHub too)
- blog = release log / devlog

Supporting: early `docusaurus-search-local` (Chinese tokenization); apply for Algolia DocSearch after going public; versioning when first major release ships (not premature); i18n default zh-CN, English in P3; docs build in CI (broken links fail). Public host is [ADR-0018](./0018-hosting-topology-no-vps.md) (`https://doc.erdonline.com`; GitHub Pages no longer publishes docs).

## Consequences

- Positive: React isomorphism lowers contributor barrier; MDX can embed real read-only designer canvas — "docs as demo"
- Cost: repo adds `website/` Node toolchain (same stack as frontend, manageable cost)
