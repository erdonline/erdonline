#!/usr/bin/env node
/**
 * X Article control drills — one primitive at a time, observe, pass/fail.
 *
 * Patterns target gold standard draft (read-only):
 *   https://x.com/compose/articles/edit/2093880046998130688
 *
 * Usage:
 *   node scripts/growth/x-article-control-drills.mjs [--pageId=N] [--drill=1|title|all]
 *
 * No Create. No Publish. Reuses open compose/articles/edit/{id} tab.
 * NEVER pass gold draft pageId — drills mutate the editor.
 */
import {
  cdt,
  evaluate,
  getPageHref,
  observe,
  preflightArticleEditor,
  press,
  sleep,
} from './lib/x-article-cdp-guarded.mjs';
import { detectGarbagePrefix } from './lib/x-article-garbage.mjs';
import {
  insertCode,
  insertMenu,
  insertTable,
} from './lib/x-article-insert-menu.mjs';
import { attachEditor, resolveEditPageId } from './lib/x-article-open-editor.mjs';
import {
  caretToEnd,
  focusBody,
  insertTextAtCaret,
  newParagraph,
  resetToBodyPlain,
  setTitleOnce,
} from './lib/x-article-typer.mjs';

const EXPECTED_TITLE = "Don't give your agent the production database";
const MAX_RETRIES = 3;
/** User gold-standard draft — read-only; agent drills must use another edit tab. */
const GOLD_DRAFT_ID = '2093880046998130688';
const GOLD_DRAFT_URL = `https://x.com/compose/articles/edit/${GOLD_DRAFT_ID}`;

function assertNotGoldDraft(pageId) {
  const href = getPageHref(pageId) || '';
  if (href.includes(GOLD_DRAFT_ID)) {
    throw new Error(
      `Refusing drills on gold standard draft (${GOLD_DRAFT_URL}). Use a sandbox edit tab via --pageId=.`,
    );
  }
}

const TOGGLE_TESTIDS = [
  'btn-blockquote',
  'btn-ul',
  'btn-ol',
  'btn-bold',
  'btn-italic',
  'btn-strikethrough',
];

const TOGGLE_OFF_CHORDS = {
  'btn-blockquote': 'Meta+Shift+9',
  'btn-ul': 'Meta+Shift+7',
  'btn-ol': 'Meta+Shift+8',
  'btn-bold': 'Meta+B',
  'btn-italic': 'Meta+I',
  'btn-strikethrough': 'Meta+Shift+X',
};

function readEditorState(pageId) {
  return evaluate(
    pageId,
    `() => {
    const TOGGLES = ${JSON.stringify(TOGGLE_TESTIDS)};
    const activeToggles = TOGGLES.filter((id) => {
      const btn = document.querySelector('[data-testid="' + id + '"]');
      return btn?.getAttribute('aria-pressed') === 'true';
    });
    const styleNow = [...document.querySelectorAll('#toolbar-styling-buttons button')].find(
      (b) => /^(Heading|Subheading|Body)$/i.test(b.innerText?.trim()),
    )?.innerText?.trim() || null;
    const dropdownOpen = !!document.querySelector('[data-testid="Dropdown"]');
    return { activeToggles, styleNow, dropdownOpen };
  }`,
    [],
    { stableDom: false },
  );
}

function dismissOpenDropdown(pageId, { maxEsc = 6 } = {}) {
  for (let i = 0; i < maxEsc; i++) {
    if (!readEditorState(pageId).dropdownOpen) return;
    press(pageId, 'Escape');
    sleep(0.12);
  }
}

function keyboardResetToBody(pageId, { maxSteps = 6 } = {}) {
  for (let steps = 0; steps < maxSteps; steps++) {
    const styleNow = readEditorState(pageId).styleNow;
    if (!styleNow || styleNow === 'Body') return { ok: true, styleNow: styleNow || 'Body' };
    press(pageId, 'Meta+Shift+,');
    sleep(0.12);
  }
  return { ok: readEditorState(pageId).styleNow === 'Body' };
}

function keyboardToggleMarksOff(pageId, activeToggles) {
  for (const testId of activeToggles ?? []) {
    const chord = TOGGLE_OFF_CHORDS[testId];
    if (!chord) continue;
    press(pageId, chord);
    sleep(0.08);
  }
}

function assertBodyPlain(pageId) {
  resetToBodyPlain(pageId);
}

function logObs(label, obs) {
  console.log(`  observe [${label}]:`, JSON.stringify(obs, null, 2));
}

function prepSandboxEnd(pageId) {
  assertBodyPlain(pageId);
  focusBody(pageId);
  caretToEnd(pageId);
  sleep(0.1);
}

function clearLastBlock(pageId) {
  return evaluate(
    pageId,
    `() => {
    const root = document.querySelector('[contenteditable="true"]');
    const blocks = [...root?.querySelectorAll('[data-block=true]') || []];
    const last = blocks[blocks.length - 1];
    if (!last) return { cleared: false };
    last.focus?.();
    const r = document.createRange();
    r.selectNodeContents(last);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    root?.dispatchEvent(new Event('input', { bubbles: true }));
    const len = (last.innerText || '').replace(/[\\s\\u00a0\\t]/g, '').length;
    return { cleared: true, len };
  }`,
    [],
    { stableDom: false },
  );
}

function freshEmptyBlock(pageId) {
  prepSandboxEnd(pageId);
  newParagraph(pageId);
  sleep(0.15);
  clearLastBlock(pageId);
  sleep(0.1);
  return observe(pageId);
}

function typeOnceInLastBlock(pageId, text) {
  const expected = String(text).trim();
  clearLastBlock(pageId);
  sleep(0.08);
  const before = observe(pageId);
  if (before.lastBlockText.trim() === expected) return before;
  insertTextAtCaret(pageId, expected);
  sleep(0.25);
  const after = observe(pageId);
  const got = after.lastBlockText.trim();
  if (!got.includes(expected)) {
    throw new Error(`text not in last block: ${JSON.stringify(got?.slice(0, 80))}`);
  }
  if (got.includes(expected + expected)) {
    throw new Error(`insert doubled text: ${JSON.stringify(got.slice(0, 80))}`);
  }
  return after;
}

function selectPhraseInLastBlock(pageId, needle) {
  const safe = JSON.stringify(needle);
  return evaluate(
    pageId,
    `() => {
    const needle = ${safe};
    const root = document.querySelector('[contenteditable="true"]');
    const blocks = [...root?.querySelectorAll('[data-block=true]') || []];
    const b = blocks[blocks.length - 1] || root;
    b?.focus();
    const full = b?.innerText || '';
    const idx = full.lastIndexOf(needle);
    if (idx < 0) return { found: false, full: full.slice(0, 120) };
    const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    let node, pos = 0, start, end;
    while ((node = w.nextNode())) {
      const len = node.textContent.length;
      if (!start && pos + len > idx) start = { node, off: idx - pos };
      if (start && pos + len >= idx + needle.length) { end = { node, off: idx + needle.length - pos }; break; }
      pos += len;
    }
    if (start && end) {
      const r = document.createRange();
      r.setStart(start.node, start.off);
      r.setEnd(end.node, end.off);
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
    }
    return { found: !!start, full: full.slice(0, 120) };
  }`,
    [],
    { stableDom: false },
  );
}

function probeDom(pageId) {
  return evaluate(
    pageId,
    `() => {
    const root = document.querySelector('[contenteditable="true"]');
    const blocks = [...root?.querySelectorAll('[data-block=true]') || []];
    const last = blocks[blocks.length - 1];
    return {
      hasCode: !!root?.querySelector('pre, code'),
      hasTable: !!root?.querySelector('table'),
      lastTag: last?.tagName,
      lastText: (last?.innerText || '').replace(/\\n$/, '').slice(0, 120),
      h2Count: blocks.filter((b) => b.tagName === 'H2').length,
    };
  }`,
    [],
    { stableDom: false },
  );
}

function probeBoldScope(pageId, phrase) {
  const safe = JSON.stringify(phrase);
  return evaluate(
    pageId,
    `() => {
    const phrase = ${safe};
    const root = document.querySelector('[contenteditable="true"]');
    const html = root?.innerHTML || '';
    const strongHits = [...root?.querySelectorAll('strong, b') || []].map((el) => el.innerText?.trim()).filter(Boolean);
    const boldSpans = [...root?.querySelectorAll('span[style*="font-weight: bold"], span[style*="font-weight:bold"]') || []]
      .map((el) => el.innerText?.trim())
      .filter(Boolean);
    const phraseBold =
      strongHits.some((t) => t.includes(phrase) || phrase.includes(t)) ||
      boldSpans.some((t) => t.includes(phrase) || phrase.includes(t)) ||
      (html.includes('font-weight: bold') && html.includes(phrase));
    const wholeBold = strongHits.some((t) => t.length > 40) || boldSpans.some((t) => t.length > 40);
    return { strongHits, boldSpans, phraseBold, wholeBold };
  }`,
    [],
    { stableDom: false },
  );
}

/** @returns {{ id: number, name: string, run: (pageId: number) => object }} */
const DRILLS = [
  {
    id: 1,
    name: 'title',
    run(pageId) {
      const result = setTitleOnce(pageId, EXPECTED_TITLE);
      const obs = observe(pageId);
      logObs('title', { titleValue: obs.titleValue, titleLen: obs.titleLen, fill: result });
      if (obs.titleValue !== EXPECTED_TITLE) {
        throw new Error(`title mismatch: got ${JSON.stringify(obs.titleValue?.slice(0, 60))}`);
      }
      return { pass: true, title: obs.titleValue };
    },
  },
  {
    id: 2,
    name: 'new-paragraph',
    run(pageId) {
      const before = observe(pageId);
      freshEmptyBlock(pageId);
      const sentence = 'Drill two: one short sentence.';
      typeOnceInLastBlock(pageId, sentence);
      const after = observe(pageId);
      logObs('new-paragraph', { before: before.blockCount, after: after.blockCount, last: after.lastBlockText });
      if (after.blockCount < before.blockCount + 1) {
        throw new Error(`blockCount expected >= ${before.blockCount + 1}, got ${after.blockCount}`);
      }
      const garbage = detectGarbagePrefix(after.lastBlockText, sentence);
      if (garbage) throw new Error(`garbage prefix: ${garbage}`);
      return { pass: true, blockCount: after.blockCount };
    },
  },
  {
    id: 3,
    name: 'subheading',
    run(pageId) {
      freshEmptyBlock(pageId);
      const text = 'DRILL-3 Subheading probe';
      focusBody(pageId);
      caretToEnd(pageId);
      cdt(['type_text', String(pageId), '## ']);
      sleep(0.2);
      typeOnceInLastBlock(pageId, text);
      sleep(0.2);
      const after = observe(pageId);
      const dom = probeDom(pageId);
      logObs('subheading', { last: after.lastBlockText, styleHint: after.styleHint, dom });
      if (after.lastBlockText.includes('##')) {
        throw new Error('leftover ## visible in block');
      }
      if (!after.lastBlockText.includes('DRILL-3')) {
        throw new Error(`subheading text missing: ${JSON.stringify(after.lastBlockText)}`);
      }
      return { pass: true, lastBlock: after.lastBlockText };
    },
  },
  {
    id: 4,
    name: 'back-to-body',
    run(pageId) {
      freshEmptyBlock(pageId);
      keyboardResetToBody(pageId);
      assertBodyPlain(pageId);
      const sentence = 'Drill four body line after subheading reset.';
      typeOnceInLastBlock(pageId, sentence);
      newParagraph(pageId);
      sleep(0.2);
      const after = observe(pageId);
      logObs('back-to-body', { styleHint: after.styleHint, toggles: after.toggles, last: after.lastBlockText });
      if (after.styleHint && after.styleHint !== 'Body') {
        throw new Error(`style not Body: ${after.styleHint}`);
      }
      if (after.toggles?.quote || after.toggles?.ul || after.toggles?.ol) {
        throw new Error(`marks still on: ${JSON.stringify(after.toggles)}`);
      }
      return { pass: true, styleHint: after.styleHint || 'Body' };
    },
  },
  {
    id: 5,
    name: 'bold',
    run(pageId) {
      freshEmptyBlock(pageId);
      assertBodyPlain(pageId);
      const line = 'Drill five plain and bold words here.';
      typeOnceInLastBlock(pageId, line);
      const phrase = 'bold words';
      const sel = selectPhraseInLastBlock(pageId, phrase);
      if (!sel.found) throw new Error(`phrase not found for bold: ${phrase} — ${JSON.stringify(sel.full)}`);
      press(pageId, 'Meta+B');
      sleep(0.12);
      collapseSelection(pageId);
      assertBodyPlain(pageId);
      const boldProbe = probeBoldScope(pageId, phrase);
      logObs('bold', boldProbe);
      if (!boldProbe.phraseBold) throw new Error('phrase not bold');
      if (boldProbe.wholeBold) throw new Error('whole paragraph appears bold');
      return { pass: true, phraseBold: true };
    },
  },
  {
    id: 6,
    name: 'quote',
    run(pageId) {
      freshEmptyBlock(pageId);
      assertBodyPlain(pageId);
      const quoteLine = 'Drill six quote line only.';
      focusBody(pageId);
      caretToEnd(pageId);
      cdt(['type_text', String(pageId), '> ']);
      sleep(0.15);
      typeOnceInLastBlock(pageId, quoteLine);
      sleep(0.15);
      newParagraph(pageId);
      if (readEditorState(pageId).activeToggles.includes('btn-blockquote')) {
        press(pageId, 'Meta+Shift+9');
        sleep(0.1);
      }
      assertBodyPlain(pageId);
      newParagraph(pageId);
      sleep(0.15);
      clearLastBlock(pageId);
      focusBody(pageId);
      caretToEnd(pageId);
      cdt(['type_text', String(pageId), 'Drill six follow-up not a quote.']);
      sleep(0.2);
      const after = observe(pageId);
      logObs('quote', { toggles: after.toggles, last: after.lastBlockText });
      if (after.toggles?.quote) throw new Error('blockquote toggle still on');
      if (after.lastBlockText.startsWith('>')) throw new Error('next line still quote marker');
      return { pass: true, quoteOff: true };
    },
  },
  {
    id: 7,
    name: 'insert-code',
    run(pageId) {
      prepSandboxEnd(pageId);
      freshEmptyBlock(pageId);
      assertBodyPlain(pageId);
      const codeLine = 'ERROR: column "drill_probe" does not exist.';
      insertCode(pageId, codeLine, { language: 'SQL' });
      assertBodyPlain(pageId);
      newParagraph(pageId);
      sleep(0.2);
      const after = observe(pageId);
      const dom = evaluate(
        pageId,
        `() => {
        const root = document.querySelector('[contenteditable="true"]');
        const body = root?.innerText || '';
        const codeSection = root?.querySelector('[data-testid="markdown-code-block"]')
          || root?.querySelector('section pre')?.closest('section');
        const pre = codeSection?.querySelector('pre') || root?.querySelector('pre');
        return {
          hasCodeWidget: !!(codeSection || pre),
          markdownCodeBlock: !!root?.querySelector('[data-testid="markdown-code-block"]'),
          codeSample: (pre?.innerText || codeSection?.innerText || '').slice(0, 120),
          bodyHasError: body.includes('drill_probe'),
          dropdownOpen: !!document.querySelector('[data-testid="Dropdown"]'),
        };
      }`,
        [],
        { stableDom: false },
      );
      logObs('insert-code', { after: after.blockCount, dom });
      if (!dom.hasCodeWidget) throw new Error('code widget (SECTION/pre) not found');
      if (!dom.bodyHasError && !dom.codeSample?.includes('drill_probe')) {
        throw new Error('code text missing in widget');
      }
      if (dom.dropdownOpen) throw new Error('Insert dropdown still open');
      return { pass: true, hasCode: true };
    },
  },
  {
    id: 8,
    name: 'insert-table',
    run(pageId) {
      prepSandboxEnd(pageId);
      freshEmptyBlock(pageId);
      assertBodyPlain(pageId);
      insertTable(pageId, [
        ['A1', 'B1'],
        ['A2', 'B2'],
      ]);
      assertBodyPlain(pageId);
      newParagraph(pageId);
      sleep(0.2);
      const dom = evaluate(
        pageId,
        `() => {
        const root = document.querySelector('[contenteditable="true"]');
        const table = root?.querySelector('table');
        const rows = table ? [...table.querySelectorAll('tr')] : [];
        const cells = rows.flatMap((r) => [...r.querySelectorAll('th, td')].map((c) => c.innerText?.trim()));
        return {
          hasTable: !!table,
          rowCount: rows.length,
          cells,
          dropdownOpen: !!document.querySelector('[data-testid="Dropdown"]'),
        };
      }`,
        [],
        { stableDom: false },
      );
      logObs('insert-table', dom);
      if (!dom.hasTable) throw new Error('table not found');
      if (dom.rowCount < 2) throw new Error(`table rows ${dom.rowCount} < 2`);
      if (!dom.cells.some((c) => c === 'A1')) throw new Error('A1 cell missing');
      if (dom.dropdownOpen) throw new Error('dropdown still open after table');
      return { pass: true, rowCount: dom.rowCount };
    },
  },
  {
    id: 9,
    name: 'insert-media',
    run(pageId) {
      prepSandboxEnd(pageId);
      freshEmptyBlock(pageId);
      assertBodyPlain(pageId);
      insertMenu(pageId, 'Media');
      sleep(0.35);
      const ui = evaluate(
        pageId,
        `() => ({
        fileInput: !!document.querySelector('input[type="file"]'),
        urlInput: !!document.querySelector('input[type="url"], input[placeholder*="URL" i]'),
        dialog: !!document.querySelector('[role="dialog"]'),
        dropdownOpen: !!document.querySelector('[data-testid="Dropdown"]'),
      })`,
        [],
        { stableDom: false },
      );
      logObs('insert-media-open', ui);
      if (!ui.fileInput && !ui.urlInput && !ui.dialog) {
        throw new Error('Media UI did not open (no file/url input or dialog)');
      }
      dismissOpenDropdown(pageId);
      press(pageId, 'Escape');
      sleep(0.2);
      press(pageId, 'Escape');
      sleep(0.15);
      const closed = readEditorState(pageId);
      logObs('insert-media-closed', closed);
      if (closed.dropdownOpen) throw new Error('dropdown still open after cancel');
      return { pass: true, mediaOpened: true };
    },
  },
];

function collapseSelection(pageId) {
  evaluate(
    pageId,
    `() => {
    const b = document.querySelector('[contenteditable="true"]');
    b?.focus();
    const s = window.getSelection();
    if (!s?.rangeCount) return { collapsed: false };
    const r = s.getRangeAt(0);
    r.collapse(false);
    s.removeAllRanges();
    s.addRange(r);
    return { collapsed: true };
  }`,
    [],
    { stableDom: false },
  );
  sleep(0.05);
}

function resolveDrillFilter(arg) {
  if (!arg || arg === 'all') return DRILLS;
  const n = Number(arg);
  if (Number.isFinite(n)) {
    const hit = DRILLS.find((d) => d.id === n);
    if (!hit) throw new Error(`Unknown drill id ${n}`);
    return [hit];
  }
  const byName = DRILLS.find((d) => d.name === arg);
  if (!byName) throw new Error(`Unknown drill name "${arg}"`);
  return [byName];
}

function runDrillWithRetry(pageId, drill) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`\n=== Drill ${drill.id} (${drill.name}) attempt ${attempt}/${MAX_RETRIES} ===`);
      const result = drill.run(pageId);
      console.log(`PASS drill ${drill.id} (${drill.name}):`, JSON.stringify(result));
      return { id: drill.id, name: drill.name, pass: true, attempts: attempt, result };
    } catch (e) {
      lastErr = e;
      console.error(`FAIL drill ${drill.id} (${drill.name}) attempt ${attempt}:`, e.message || e);
      dismissOpenDropdown(pageId);
      assertBodyPlain(pageId);
      sleep(0.5);
    }
  }
  throw lastErr;
}

const pageIdArg = process.argv.find((a) => a.startsWith('--pageId='))?.slice(9);
const drillArg = process.argv.find((a) => a.startsWith('--drill='))?.slice(8) || 'all';

/** @type {Array<{ id: number, name: string, pass: boolean, attempts: number }>} */
const results = [];

try {
  cdt(['status']);
  const pageId = resolveEditPageId(pageIdArg);
  attachEditor(pageId);
  assertNotGoldDraft(pageId);
  const preflight = preflightArticleEditor(pageId);
  console.log('preflight:', JSON.stringify(preflight));
  const editUrl = getPageHref(pageId);
  console.log(`pageId=${pageId} edit URL: ${editUrl}`);
  console.log(`drills: ${drillArg}`);

  const selected = resolveDrillFilter(drillArg);
  for (const drill of selected) {
    results.push(runDrillWithRetry(pageId, drill));
  }

  const allPass = results.every((r) => r.pass);
  console.log('\n=== Drill summary ===');
  for (const r of results) {
    console.log(`| ${r.id} | ${r.name} | ${r.pass ? 'PASS' : 'FAIL'} | attempts=${r.attempts} |`);
  }

  console.log('\n=== Final ===');
  console.log(JSON.stringify({ editUrl, allPass, results }, null, 2));
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
