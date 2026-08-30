/**
 * X Article Insert dropdown — frozen 7 menuitems (2026-08-30).
 * Open via `button[aria-label="Add Media"]` (visible label Insert).
 * Click menuitem by accessible name — not css hashes.
 *
 * Objects (code, table, image, divider, …) go through Insert — not keyboard markers.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  cdt,
  evaluate,
  press,
  sleep,
} from './x-article-cdp-guarded.mjs';

/** @readonly */
export const INSERT_MENU_ITEMS = Object.freeze([
  'Media',
  'GIF',
  'Posts',
  'Divider',
  'Code',
  'LaTeX',
  'Table',
]);

export const INSERT_MENU_FROZEN_LIST = INSERT_MENU_ITEMS.join(', ');

/** X code overlay — language combobox (live 2026-08-30). */
export const CODE_LANGUAGE_INPUT_TESTID = 'programming-language-input';
export const CODE_LANGUAGE_SEARCH_LABEL = 'Search programming language';
export const CODE_BODY_PLACEHOLDER = 'Add code here';

function assertFrozenMenuItem(itemName) {
  if (!INSERT_MENU_ITEMS.includes(itemName)) {
    throw new Error(
      `Insert menuitem "${itemName}" not in frozen list: ${INSERT_MENU_FROZEN_LIST}`,
    );
  }
}

function openInsertDropdown(pageId) {
  const r = evaluate(
    pageId,
    `() => {
    const root = document.querySelector('[contenteditable="true"]');
    root?.focus();
    const btn = document.querySelector('button[aria-label="Add Media"]');
    if (!btn) return { ok: false, reason: 'button[aria-label="Add Media"] not found' };
    btn.click();
    return { ok: true };
  }`,
    [],
    { stableDom: false },
  );
  if (!r.ok) throw new Error(r.reason || 'Insert button click failed');
  sleep(0.35);
}

function readInsertMenuLabels(pageId) {
  return evaluate(
    pageId,
    `() => {
    const items = [...document.querySelectorAll('[data-testid="Dropdown"] [role="menuitem"]')];
    return items.map((el) => el.innerText?.trim()).filter(Boolean);
  }`,
    [],
    { stableDom: false },
  );
}

function clickInsertMenuItem(pageId, itemName) {
  const idx = INSERT_MENU_ITEMS.indexOf(itemName);
  const safeName = JSON.stringify(itemName);
  return evaluate(
    pageId,
    `() => {
    const itemName = ${safeName};
    const idx = ${idx};
    const items = [...document.querySelectorAll('[data-testid="Dropdown"] [role="menuitem"]')];
    const item =
      items[idx] ||
      items.find((el) => el.innerText?.trim() === itemName) ||
      items.find((el) => el.innerText?.trim().startsWith(itemName));
    if (!item) return { ok: false, labels: items.map((el) => el.innerText?.trim()) };
    item.click();
    return { ok: true, labels: items.map((el) => el.innerText?.trim()) };
  }`,
    [],
    { stableDom: false },
  );
}

/** Click Insert → menuitem by frozen accessible name. */
export function insertMenu(pageId, itemName) {
  assertFrozenMenuItem(itemName);
  let lastLabels = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      press(pageId, 'Escape');
      sleep(0.15);
    }
    openInsertDropdown(pageId);
    for (let wait = 0; wait < 8; wait++) {
      lastLabels = readInsertMenuLabels(pageId);
      if (lastLabels?.length >= INSERT_MENU_ITEMS.length) break;
      sleep(0.08);
    }
    const clicked = clickInsertMenuItem(pageId, itemName);
    if (clicked.ok) {
      sleep(0.35);
      return { itemName, labels: clicked.labels || lastLabels };
    }
    lastLabels = clicked.labels || lastLabels;
  }
  throw new Error(
    `Insert menuitem "${itemName}" not found — saw: ${(lastLabels || []).join(', ') || 'none'}; frozen: ${INSERT_MENU_FROZEN_LIST}`,
  );
}

function isPlaintextLanguage(language) {
  return language == null || /^plaintext$/i.test(String(language).trim());
}

function focusCodeBodyTextarea(pageId) {
  return evaluate(
    pageId,
    `() => {
    const titleEl =
      document.querySelector('textarea[name="Article Title"]') ||
      document.querySelector('textarea[placeholder="Add a title"]');
    const placeholderRe = /add code here/i;
    const codeTa = [...document.querySelectorAll('textarea')].find(
      (t) => t !== titleEl && placeholderRe.test(t.placeholder || ''),
    ) || [...document.querySelectorAll('textarea')].find(
      (t) => t !== titleEl && t.offsetParent && t.getBoundingClientRect().height > 40,
    );
    if (codeTa) {
      codeTa.focus();
      const len = codeTa.value.length;
      codeTa.setSelectionRange(len, len);
      return { ok: true, kind: 'textarea', len, placeholder: codeTa.placeholder || null };
    }
    const root = document.querySelector('[contenteditable="true"]');
    const blocks = [...root?.querySelectorAll('[data-block=true]') || []];
    const last = blocks[blocks.length - 1];
    if (!last) return { ok: false, reason: 'no blocks' };
    const codeTarget =
      last.querySelector('pre[contenteditable="true"], pre, code[contenteditable="true"], code') ||
      last.querySelector('[contenteditable="true"]') ||
      last;
    codeTarget.focus();
    const r = document.createRange();
    r.selectNodeContents(codeTarget);
    r.collapse(false);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
    return { ok: true, kind: 'pre-fallback', tag: codeTarget.tagName };
  }`,
    [],
    { stableDom: false },
  );
}

function readLanguagePickerOptions(pageId) {
  return evaluate(
    pageId,
    `() => {
    const norm = (s) => (s || '').trim();
    const options = [...document.querySelectorAll('[role="option"], [role="menuitem"]')]
      .filter((el) => el.offsetParent !== null || el.getBoundingClientRect().height > 0)
      .map((el) => norm(el.innerText))
      .filter(Boolean);
    return [...new Set(options)];
  }`,
    [],
    { stableDom: false },
  );
}

function focusLanguageSearchInput(pageId) {
  const testid = JSON.stringify(CODE_LANGUAGE_INPUT_TESTID);
  return evaluate(
    pageId,
    `() => {
    const input =
      document.querySelector('[data-testid=' + ${testid} + ']') ||
      document.querySelector('input[name="programming-language-input"]');
    if (!input) return { ok: false, reason: ${JSON.stringify(CODE_LANGUAGE_INPUT_TESTID)} + ' not found' };
    input.scrollIntoView({ block: 'nearest' });
    input.focus();
    input.click();
    return { ok: true, value: input.value };
  }`,
    [],
    { stableDom: false },
  );
}

function readSelectedCodeLanguage(pageId) {
  const testid = JSON.stringify(CODE_LANGUAGE_INPUT_TESTID);
  return evaluate(
    pageId,
    `() => {
    const norm = (s) => (s || '').trim();
    const input =
      document.querySelector('[data-testid=' + ${testid} + ']') ||
      document.querySelector('input[name="programming-language-input"]');
    const value = norm(input?.value);
    const overlay = input?.closest('div')?.parentElement?.parentElement || document.body;
    const chips = [...overlay.querySelectorAll('span, div, label')]
      .map((el) => norm(el.innerText))
      .filter((t) => t && t.length <= 24);
    const hasPlaintext = chips.some((t) => /^plaintext$/i.test(t)) || /^plaintext$/i.test(value);
    return { value, hasPlaintext, chips: [...new Set(chips)].slice(0, 12) };
  }`,
    [],
    { stableDom: false },
  );
}

function clickLanguageDropdownOption(pageId, language) {
  const safeLang = JSON.stringify(String(language).trim());
  return evaluate(
    pageId,
    `() => {
    const lang = ${safeLang};
    const norm = (s) => (s || '').trim();
    const candidates = [...document.querySelectorAll('[role="option"], [role="menuitem"]')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    const exact = candidates.find((el) => norm(el.innerText).toLowerCase() === lang.toLowerCase());
    if (!exact) {
      return {
        ok: false,
        options: candidates.map((el) => norm(el.innerText)).filter(Boolean),
      };
    }
    exact.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    exact.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    exact.click();
    return { ok: true, picked: norm(exact.innerText), method: 'click' };
  }`,
    [],
    { stableDom: false },
  );
}

function readSelectedDropdownOption(pageId) {
  return evaluate(
    pageId,
    `() => {
    const selected = [...document.querySelectorAll('[role="option"], [role="menuitem"]')].find(
      (el) => el.getAttribute('aria-selected') === 'true',
    );
    return (selected?.innerText || '').trim() || null;
  }`,
    [],
    { stableDom: false },
  );
}

/** X language list: mouse click often no-ops — ArrowDown until aria-selected matches, then Enter. */
function pickLanguageFromDropdown(pageId, language) {
  const lang = String(language).trim();
  let selected = readSelectedDropdownOption(pageId);
  for (let step = 0; step < 12; step++) {
    if (selected && selected.toLowerCase() === lang.toLowerCase()) break;
    press(pageId, 'ArrowDown');
    sleep(0.12);
    selected = readSelectedDropdownOption(pageId);
  }
  if (!selected || selected.toLowerCase() !== lang.toLowerCase()) {
    const clicked = clickLanguageDropdownOption(pageId, lang);
    if (clicked.ok) return clicked;
    throw new Error(
      `pickLanguageFromDropdown: could not highlight "${lang}" — last selected ${JSON.stringify(selected)}; options: ${(clicked.options || []).join(', ')}`,
    );
  }
  press(pageId, 'Enter');
  sleep(0.2);
  return { ok: true, picked: selected, method: 'keyboard' };
}

/**
 * Code overlay — focus language search, type, pick exact menuitem/option.
 * Typing alone leaves Plaintext; MUST click the dropdown list item.
 * @param {number} pageId
 * @param {string} language — X picker label (Job1 ERROR → \`SQL\`)
 */
export function selectCodeLanguage(pageId, language) {
  if (isPlaintextLanguage(language)) {
    return { skipped: true, language: 'Plaintext' };
  }
  const lang = String(language).trim();
  const searchTerm = lang.toLowerCase();

  const focused = focusLanguageSearchInput(pageId);
  if (!focused.ok) {
    throw new Error(`selectCodeLanguage: ${focused.reason || 'focus failed'}`);
  }
  sleep(0.15);
  press(pageId, 'Meta+a');
  sleep(0.08);
  cdt(['type_text', String(pageId), searchTerm]);
  sleep(0.45);

  let options = readLanguagePickerOptions(pageId);
  for (let wait = 0; wait < 15 && options.length === 0; wait++) {
    sleep(0.08);
    options = readLanguagePickerOptions(pageId);
  }
  if (!options.some((o) => o.toLowerCase() === lang.toLowerCase())) {
    for (let wait = 0; wait < 10 && !options.some((o) => o.toLowerCase() === lang.toLowerCase()); wait++) {
      sleep(0.08);
      options = readLanguagePickerOptions(pageId);
    }
  }

  const picked = pickLanguageFromDropdown(pageId, lang);
  if (!picked.ok) {
    throw new Error(
      `selectCodeLanguage: "${lang}" not in dropdown — saw: ${(options || []).join(', ') || 'none'}`,
    );
  }
  sleep(0.15);

  const selected = readSelectedCodeLanguage(pageId);
  const inputLang = (selected.value || '').trim();
  if (!inputLang || /^plaintext$/i.test(inputLang)) {
    throw new Error(
      `selectCodeLanguage: dropdown pick did not stick — input still ${JSON.stringify(inputLang || 'empty')} after picking "${picked.picked}"`,
    );
  }
  if (inputLang.toLowerCase() !== lang.toLowerCase()) {
    throw new Error(
      `selectCodeLanguage: expected input ${JSON.stringify(lang)}, got ${JSON.stringify(inputLang)} after picking "${picked.picked}"`,
    );
  }
  press(pageId, 'Tab');
  sleep(0.12);
  return { language: picked.picked, searchTerm, options, pickMethod: picked.method };
}

function openCodeEditOverlay(pageId) {
  return evaluate(
    pageId,
    `() => {
    const root = document.querySelector('[contenteditable="true"]');
    const sections = [...root?.querySelectorAll('section') || []];
    for (const section of sections) {
      const pre = section.querySelector('pre, code');
      const table = section.querySelector('table');
      if (pre && !table) {
        section.scrollIntoView({ block: 'center' });
        pre.click();
        const btn = section.querySelector('button[aria-label="Edit block"]');
        if (btn) {
          btn.click();
          return { ok: true };
        }
      }
    }
    return { ok: false, reason: 'code Edit block not found' };
  }`,
    [],
    { stableDom: false },
  );
}

function fillCodeBodyTextarea(pageId, text) {
  return evaluate(
    pageId,
    `() => {
    const md = ${JSON.stringify(text)};
    const titleEl =
      document.querySelector('textarea[name="Article Title"]') ||
      document.querySelector('textarea[placeholder="Add a title"]');
    const ta = [...document.querySelectorAll('textarea')].find(
      (t) => t !== titleEl && /add code here/i.test(t.placeholder || ''),
    ) || [...document.querySelectorAll('textarea')].find(
      (t) => t !== titleEl && t.offsetParent && t.getBoundingClientRect().height > 40,
    );
    if (!ta) return { ok: false, reason: 'code body textarea not found' };
    const desc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    desc?.set?.call(ta, md);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
    return { ok: true, len: ta.value.length };
  }`,
    [],
    { stableDom: false },
  );
}

/** Visible overlay commit labels — table edit uses Update; new code uses Insert. */
export const OVERLAY_COMMIT_LABELS = Object.freeze(['Update', 'Insert', 'Apply']);

/**
 * Click overlay commit button (Update / Insert / Apply) near Preview panel.
 * @param {number} pageId
 * @param {{ prefer?: readonly string[] }} [opts]
 */
export function commitOverlayAction(pageId, { prefer = OVERLAY_COMMIT_LABELS } = {}) {
  const labels = JSON.stringify([...prefer]);
  return evaluate(
    pageId,
    `() => {
    const prefer = ${labels};
    const norm = (s) => (s || '').trim();
    const preview = [...document.querySelectorAll('button')].find((b) => norm(b.innerText) === 'Preview');
    const panel = preview?.closest('div')?.parentElement;
    const inPanel = panel ? [...panel.querySelectorAll('button')] : [];
    const allButtons = [...document.querySelectorAll('button')];
    for (const label of prefer) {
      const target =
        inPanel.find((b) => norm(b.innerText) === label) ||
        allButtons.filter((b) => norm(b.innerText) === label).pop();
      if (target) {
        target.click();
        return { clicked: true, label };
      }
    }
    return { clicked: false, prefer };
  }`,
    [],
    { stableDom: false },
  );
}

/** @deprecated alias */
function commitOverlayInsert(pageId) {
  return commitOverlayAction(pageId, { prefer: ['Insert', 'Update', 'Apply'] });
}

function rowsToMarkdownTable(rows) {
  const colCount = Math.max(...rows.map((r) => (Array.isArray(r) ? r.length : 0)), 1);
  const line = (row) => {
    const cells = Array.isArray(row) ? [...row] : [];
    while (cells.length < colCount) cells.push('');
    return `| ${cells.map((c) => String(c ?? '').replace(/\|/g, '\\|')).join(' | ')} |`;
  };
  const sep = `| ${Array(colCount).fill('---').join(' | ')} |`;
  return [line(rows[0]), sep, ...rows.slice(1).map(line)].join('\n');
}

function openTableEditOverlay(pageId) {
  return evaluate(
    pageId,
    `() => {
    const table = [...document.querySelectorAll('table')].pop();
    const section = table?.closest('section');
    const btn = section?.querySelector('button[aria-label="Edit block"]');
    if (!btn) return { ok: false, reason: 'Edit block not found on table section' };
    btn.click();
    return { ok: true };
  }`,
    [],
    { stableDom: false },
  );
}

function fillTableMarkdownOverlay(pageId, markdown) {
  return evaluate(
    pageId,
    `() => {
    const md = ${JSON.stringify(markdown)};
    const titleEl =
      document.querySelector('textarea[name="Article Title"]') ||
      document.querySelector('textarea[placeholder="Add a title"]');
    const ta = [...document.querySelectorAll('textarea')].find(
      (t) => t !== titleEl && (t.value.includes('|') || /Add code here/i.test(t.placeholder || '')),
    );
    if (!ta) return { ok: false, reason: 'table markdown textarea not found' };
    const desc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    desc?.set?.call(ta, md);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
    return { ok: true, len: ta.value.length };
  }`,
    [],
    { stableDom: false },
  );
}

/** Insert → Code → language (optional) → body → overlay Insert → Escape. */
export function insertCode(pageId, codeText, { language } = {}) {
  const text = String(codeText ?? '').trim();
  if (!text) throw new Error('insertCode: empty codeText');
  insertMenu(pageId, 'Code');
  sleep(0.25);
  let langResult = null;
  if (!isPlaintextLanguage(language)) {
    langResult = selectCodeLanguage(pageId, language);
  }
  sleep(0.1);
  const filled = fillCodeBodyTextarea(pageId, text);
  if (!filled.ok) {
    const focused = focusCodeBodyTextarea(pageId);
    if (!focused.ok) throw new Error(`insertCode: code widget focus failed — ${focused.reason || 'unknown'}`);
    if (focused.kind === 'textarea') {
      cdt(['type_text', String(pageId), text]);
    } else {
      evaluate(
        pageId,
        `() => {
        const text = ${JSON.stringify(text)};
        document.execCommand('insertText', false, text);
        return { ok: true };
      }`,
        [],
        { stableDom: false, typing: true },
      );
    }
  }
  sleep(0.2);
  const committed = commitOverlayAction(pageId, { prefer: ['Insert', 'Update', 'Apply'] });
  if (!committed.clicked) throw new Error('insertCode: overlay Insert/Update button not found');
  sleep(0.35);
  press(pageId, 'Escape');
  sleep(0.12);
  return { ok: true, method: filled.ok ? 'textarea-fill' : 'type_text', language: langResult?.language ?? 'Plaintext' };
}

/**
 * Edit existing code block — Edit block → language → body → overlay Update.
 * @param {number} pageId
 * @param {string} codeText
 * @param {{ language?: string }} [opts]
 */
export function editCodeBlock(pageId, codeText, { language } = {}) {
  const text = String(codeText ?? '').trim();
  if (!text) throw new Error('editCodeBlock: empty codeText');
  const opened = openCodeEditOverlay(pageId);
  if (!opened.ok) throw new Error(`editCodeBlock: ${opened.reason || 'edit overlay failed'}`);
  sleep(0.35);
  let langResult = null;
  if (!isPlaintextLanguage(language)) {
    langResult = selectCodeLanguage(pageId, language);
  }
  const filled = fillCodeBodyTextarea(pageId, text);
  if (!filled.ok) throw new Error(`editCodeBlock: ${filled.reason || 'body fill failed'}`);
  sleep(0.15);
  const committed = commitOverlayAction(pageId, { prefer: ['Update', 'Insert', 'Apply'] });
  if (!committed.clicked) throw new Error('editCodeBlock: overlay Update/Insert button not found');
  sleep(0.35);
  press(pageId, 'Escape');
  sleep(0.12);
  return { ok: true, language: langResult?.language ?? 'Plaintext', len: filled.len };
}

function focusTableCell(pageId, rowIndex, colIndex) {
  return evaluate(
    pageId,
    `() => {
    const rowIndex = ${Number(rowIndex)};
    const colIndex = ${Number(colIndex)};
    const root = document.querySelector('[contenteditable="true"]');
    const table =
      root?.querySelector('table') ||
      [...root?.querySelectorAll('[data-block=true]') || []]
        .reverse()
        .map((b) => b.querySelector('table'))
        .find(Boolean);
    if (!table) return { ok: false, reason: 'no table in editor' };
    const rows = [...table.querySelectorAll('tr')];
    const row = rows[rowIndex];
    const cells = row ? [...row.querySelectorAll('th, td')] : [];
    const cell = cells[colIndex];
    if (!cell) return { ok: false, reason: 'cell missing', rows: rows.length, cols: cells.length };
    const editable = cell.querySelector('[contenteditable="true"]') || cell;
    editable.focus();
    const r = document.createRange();
    r.selectNodeContents(editable);
    r.collapse(false);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
    return { ok: true, rowCount: rows.length, colCount: cells.length };
  }`,
    [],
    { stableDom: false },
  );
}

function pickTableSize(pageId, rowCount, colCount) {
  const rows = Math.max(1, Math.min(10, Number(rowCount) || 2));
  const cols = Math.max(1, Math.min(10, Number(colCount) || 2));
  const aria = `Insert a ${rows} by ${cols} table`;
  return evaluate(
    pageId,
    `() => {
    const aria = ${JSON.stringify(aria)};
    const btn = document.querySelector('button[aria-label="' + aria + '"]');
    if (!btn) {
      const labels = [...document.querySelectorAll('button[aria-label*="Insert a"]')]
        .map((b) => b.getAttribute('aria-label'))
        .slice(0, 12);
      return { ok: false, reason: 'size picker button missing', labels };
    }
    btn.click();
    return { ok: true, aria };
  }`,
    [],
    { stableDom: false },
  );
}

/** Insert → Table → Tab through cells and type rows[][] (header + data). */
export function insertTable(pageId, rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('insertTable: rows required');
  const colCount = Math.max(...rows.map((r) => (Array.isArray(r) ? r.length : 0)));
  insertMenu(pageId, 'Table');
  sleep(0.35);
  const picked = pickTableSize(pageId, rows.length, colCount);
  if (!picked.ok) {
    throw new Error(`insertTable: size picker failed — ${picked.reason || 'unknown'} (${(picked.labels || []).join('; ')})`);
  }
  sleep(0.45);

  const opened = openTableEditOverlay(pageId);
  if (!opened.ok) throw new Error(`insertTable: ${opened.reason || 'edit overlay failed'}`);
  sleep(0.3);
  const markdown = rowsToMarkdownTable(rows);
  const filled = fillTableMarkdownOverlay(pageId, markdown);
  if (!filled.ok) throw new Error(`insertTable: ${filled.reason || 'markdown fill failed'}`);
  sleep(0.15);
  const committed = commitOverlayAction(pageId, { prefer: ['Update', 'Insert', 'Apply'] });
  if (!committed.clicked) throw new Error('insertTable: overlay Update/Insert button not found');
  sleep(0.35);
  press(pageId, 'Escape');
  sleep(0.12);
  return { ok: true, rows: rows.length };
}

/** Insert → Divider — no fill; Escape + new paragraph. */
export function insertDivider(pageId) {
  insertMenu(pageId, 'Divider');
  sleep(0.2);
  press(pageId, 'Escape');
  sleep(0.1);
  return { ok: true };
}

export function insertMedia(pageId, { filePath, url, alt } = {}) {
  if (!filePath && !url) throw new Error('insertMedia: filePath or url required');
  insertMenu(pageId, 'Media');
  sleep(0.4);

  if (filePath) {
    const abs = path.resolve(filePath);
    if (!fs.existsSync(abs)) throw new Error(`insertMedia: file not found: ${abs}`);
    const uploaded = evaluate(
      pageId,
      `() => {
      const input = document.querySelector('input[type="file"]');
      if (!input) return { ok: false, reason: 'input[type=file] not found' };
      return { ok: true, hasInput: true };
    }`,
      [],
      { stableDom: false },
    );
    if (!uploaded.ok) throw new Error(uploaded.reason || 'Media file input missing');
    try {
      cdt(['upload_file', String(pageId), 'input[type="file"]', abs]);
    } catch (e) {
      throw new Error(`insertMedia upload failed: ${e.message}`);
    }
    sleep(1.5);
  } else if (url) {
    evaluate(
      pageId,
      `() => {
      const mediaUrl = ${JSON.stringify(url)};
      const input =
        document.querySelector('input[type="url"]') ||
        document.querySelector('input[placeholder*="URL" i]') ||
        [...document.querySelectorAll('input')].find((i) => i.offsetParent && /https?/i.test(i.placeholder || ''));
      if (!input) return { filled: false };
      const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      desc?.set?.call(input, mediaUrl);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const btn = [...document.querySelectorAll('button')].find((b) => /^(Add|Apply|Insert|Save|OK)$/i.test(b.innerText?.trim()));
      btn?.click();
      return { filled: true };
    }`,
      [],
      { stableDom: false },
    );
    sleep(0.8);
  }

  void alt;
  press(pageId, 'Escape');
  sleep(0.12);
  return { ok: true, filePath: filePath || null, url: url || null };
}

/** Map IR insert kinds → frozen menuitem names. */
export const INSERT_KIND_TO_MENU = Object.freeze({
  image: 'Media',
  gif: 'GIF',
  posts: 'Posts',
  divider: 'Divider',
  code: 'Code',
  latex: 'LaTeX',
  table: 'Table',
});
