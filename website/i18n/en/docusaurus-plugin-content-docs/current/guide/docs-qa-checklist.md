# Docs site QA checklist (maintainers)

:::info Audience
For maintainers verifying the user docs experience. End users should start at [Start here](./intro.md).
:::

## A. Machine checks

```bash
cd website && yarn build
cd website && yarn serve
# default http://localhost:3000/erdonline/
```

Confirm:

1. Navbar **Docs** opens **Start here** (`/docs/guide/intro`)
2. Sidebar **Contribute & engineering** is **collapsed by default**
3. Search hits guide titles (DBML, reverse, self-host); blog is indexed
4. Footer has Demo / Docs / GitHub (not copyright-only)
5. Locale dropdown switches **简体中文 / English**; under EN, guides **and** deployment / data-format / security-model / contrib docs / ADRs are English (not Chinese fallback)
6. Production build loads Baidu Tongji (`hm.baidu.com`); SPA navigations still track

## B. User journey (~15 minutes)

| # | Task | Pass criteria |
|---|---|---|
| 1 | In 30s know what to click next | intro / what-is; no ADR required |
| 2 | Follow “save version & diff” via Demo | Mentions read-only Demo → **Copy to my project**; diff works |
| 3 | Read “Import DBML” | Success state + ≥2 troubleshooting rows |
| 4 | Read “Five-minute self-host” | Copy-pasteable commands; link to full deployment |
| 5 | Find compare | Sidebar or intro → `/compare` |
| 6 | Accidentally open roadmap / vision | Top callout sends you back to guides |

## C. Polish bar

- Guide first screens use user language only (no “verification points / UTM / north-star”)
- From intro, ≤3 clicks to try / migrate / self-host
- A stranger screenshot reads as a product manual, not an internal wiki
