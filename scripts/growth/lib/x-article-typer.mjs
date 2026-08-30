/**
 * X Article typer primitives — Draft.js-safe input only (never setNative on body).
 * Production fill uses pasteRich + setTitleOnce; insertText/beforeinput/typeSlow are drills-only.
 */

import {
  assertEditorAttached,
  cdt,
  ensureDropdownClosed,
  evaluate,
  observe,
  press,
  sleep,
} from './x-article-cdp-guarded.mjs';

export function focusBody(pageId) {
  return evaluate(
    pageId,
    `() => {
    const b = document.querySelector('[contenteditable="true"]');
    b?.focus();
    return { focused: document.activeElement === b };
  }`,
    [],
    { typing: true, stableDom: false },
  );
}

export function caretToEnd(pageId) {
  return evaluate(
    pageId,
    `() => {
    const root = document.querySelector('[contenteditable="true"]');
    root?.focus();
    const blocks = [...root?.querySelectorAll('[data-block=true]') || []];
    const target = blocks[blocks.length - 1] || root;
    if (!target) return { ok: false };
    const r = document.createRange();
    r.selectNodeContents(target);
    r.collapse(false);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
    return { ok: true, blockCount: blocks.length };
  }`,
    [],
    { typing: true, stableDom: false },
  );
}

export function caretToBlockIndex(pageId, blockIndex) {
  return evaluate(
    pageId,
    `(idx) => {
    const root = document.querySelector('[contenteditable="true"]');
    if (!root) return { ok: false, reason: 'no editor' };
    const blocks = [...root.querySelectorAll('[data-block=true]')];
    const target = blocks[idx] ?? blocks[blocks.length - 1];
    if (!target) return { ok: false, reason: 'no block', blockCount: blocks.length };
    target.focus?.();
    const r = document.createRange();
    r.selectNodeContents(target);
    r.collapse(false);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
    return { ok: true, blockIndex: idx, blockCount: blocks.length, tag: target.tagName };
  }`,
    [blockIndex],
    { typing: true, stableDom: false },
  );
}

/**
 * Place caret after block matching anchor snippet or heading text.
 * @param {number} pageId
 * @param {{ type: string, text?: string }} anchor
 */
export function caretAfterBlockMatching(pageId, anchor) {
  if (anchor.type === 'afterHeading' && anchor.text) {
    return evaluate(
      pageId,
      `(headingText) => {
      const root = document.querySelector('[contenteditable="true"]');
      if (!root) return { ok: false, reason: 'no editor' };
      const blocks = [...root.querySelectorAll('[data-block=true]')];
      const norm = (s) => (s || '').replace(/\\n$/, '').trim();
      for (let i = 0; i < blocks.length; i++) {
        const t = norm(blocks[i].innerText);
        if (t === headingText || (blocks[i].tagName === 'H2' && t.includes(headingText.slice(0, 24)))) {
          const target = blocks[i];
          target.focus?.();
          const r = document.createRange();
          r.selectNodeContents(target);
          r.collapse(false);
          const s = window.getSelection();
          s?.removeAllRanges();
          s?.addRange(r);
          return { ok: true, blockIndex: i, tag: target.tagName };
        }
      }
      return { ok: false, reason: 'heading not found', headingText };
    }`,
      [anchor.text],
      { typing: true, stableDom: false },
    );
  }

  if (anchor.type === 'afterText' && anchor.text) {
    return evaluate(
      pageId,
      `(snippet) => {
      const root = document.querySelector('[contenteditable="true"]');
      if (!root) return { ok: false, reason: 'no editor' };
      const blocks = [...root.querySelectorAll('[data-block=true]')];
      const norm = (s) => (s || '').replace(/\\n$/, '').trim();
      const needle = snippet.slice(0, 40);
      for (let i = 0; i < blocks.length; i++) {
        const t = norm(blocks[i].innerText);
        if (t.includes(needle) || needle.includes(t.slice(0, 30))) {
          const target = blocks[i];
          target.focus?.();
          const r = document.createRange();
          r.selectNodeContents(target);
          r.collapse(false);
          const s = window.getSelection();
          s?.removeAllRanges();
          s?.addRange(r);
          return { ok: true, blockIndex: i, tag: target.tagName };
        }
      }
      return { ok: false, reason: 'text not found', snippet: needle };
    }`,
      [anchor.text],
      { typing: true, stableDom: false },
    );
  }

  const obs = observe(pageId);
  return caretToBlockIndex(pageId, Math.max(0, obs.blockCount - 1));
}

export function newParagraph(pageId) {
  const before = observe(pageId);
  focusBody(pageId);
  // Keep caret from caretAfterBlockMatching — do not jump to document end.
  sleep(0.05);
  press(pageId, 'End');
  sleep(0.08);
  press(pageId, 'Enter');
  sleep(0.18);
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    const obs = observe(pageId);
    if (obs.blockCount > before.blockCount && obs.lastBlockText.trim() === '') return obs;
    if (obs.lastBlockText.trim() === '' && obs.blockCount >= before.blockCount) return obs;
    sleep(0.08);
  }
  return observe(pageId);
}

/** Select all body + Delete — range select entire editor root, then keyboard delete. */
export function clearBody(pageId) {
  focusBody(pageId);
  evaluate(
    pageId,
    `() => {
    const root = document.querySelector('[contenteditable="true"]');
    if (!root) return { ok: false, reason: 'no editor' };
    root.focus();
    const r = document.createRange();
    r.selectNodeContents(root);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
    return { ok: true, selectedLen: s?.toString()?.length ?? 0 };
  }`,
    [],
    { typing: true, stableDom: false },
  );
  sleep(0.08);
  press(pageId, 'Delete');
  sleep(0.15);
  let obs = observe(pageId);
  if (obs.bodyLength > 0 && obs.blockCount > 1) {
    press(pageId, 'Meta+A');
    sleep(0.06);
    press(pageId, 'Delete');
    sleep(0.15);
    obs = observe(pageId);
  }
  return obs;
}

/** Dispatch ClipboardEvent paste into focused Draft.js contenteditable. */
export function pasteRich(pageId, { plain, html } = {}) {
  const plainText = plain != null ? String(plain) : '';
  const htmlText = html != null ? String(html) : plainText;
  if (!plainText && !htmlText) return { ok: false, method: 'paste-empty' };

  const safePlain = JSON.stringify(plainText);
  const safeHtml = JSON.stringify(htmlText);
  return evaluate(
    pageId,
    `() => {
    const plain = ${safePlain};
    const html = ${safeHtml};
    const root = document.querySelector('[contenteditable="true"]');
    if (!root) return { ok: false, reason: 'no body editor', method: 'paste' };
    root.focus();
    const blocks = [...root.querySelectorAll('[data-block=true]')];
    const emptyTail = blocks[blocks.length - 1];
    const emptyText = (emptyTail?.innerText || '').replace(/\\n$/, '').trim();
    const target =
      (emptyTail && !emptyText && emptyTail.tagName === 'DIV')
        ? emptyTail
        : ([...blocks].reverse().find((b) => b.tagName === 'DIV') || emptyTail || root);
    const r = document.createRange();
    r.selectNodeContents(target);
    r.collapse(false);
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
    const dt = new DataTransfer();
    dt.setData('text/plain', plain);
    if (html) dt.setData('text/html', html);
    const ev = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt });
    root.dispatchEvent(ev);
    return {
      ok: true,
      method: html && html !== plain ? 'paste-html' : 'paste-plain',
    };
  }`,
    [],
    { typing: true, stableDom: false },
  );
}

/** Drills only — execCommand insertText at caret. */
export function insertTextAtCaret(pageId, text) {
  const safe = JSON.stringify(String(text));
  return evaluate(
    pageId,
    `() => {
    const text = ${safe};
    const root = document.querySelector('[contenteditable="true"]');
    if (!root) return { ok: false, reason: 'no body editor' };
    root.focus();
    document.execCommand('insertText', false, text);
    return { ok: true, method: 'insertText' };
  }`,
    [],
    { typing: true, stableDom: false },
  );
}

/** Drills only — beforeinput insertText path. */
export function beforeInputInsertText(pageId, text) {
  const safe = JSON.stringify(String(text));
  return evaluate(
    pageId,
    `() => {
    const text = ${safe};
    const root = document.querySelector('[contenteditable="true"]');
    if (!root) return { ok: false, reason: 'no body editor' };
    root.focus();
    const blocks = [...root.querySelectorAll('[data-block=true]')];
    const target = blocks[blocks.length - 1] || root;
    target.focus?.();
    const ev = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
      data: text,
    });
    const prevented = !target.dispatchEvent(ev);
    if (!prevented) document.execCommand('insertText', false, text);
    return { ok: true, method: 'beforeinput', prevented };
  }`,
    [],
    { typing: true, stableDom: false },
  );
}

/** Drills only — slow word-by-word type_text. */
export function typeSlow(pageId, text) {
  const expected = String(text);
  ensureDropdownClosed(pageId);
  focusBody(pageId);
  caretToEnd(pageId);
  sleep(0.06);
  const tokens = expected.split(/(\s+)/).filter((t) => t.length > 0);
  for (const token of tokens) {
    assertEditorAttached();
    cdt(['type_text', String(pageId), token]);
    sleep(0.07);
  }
  sleep(0.12);
  return observe(pageId);
}

/** Focus title textarea, clear, type_text once — no retry inside typer. */
export function setTitleOnce(pageId, title) {
  assertEditorAttached();
  const safeTitle = String(title).slice(0, 100);
  if (String(title).length > 100) {
    console.warn(`Title truncated from ${String(title).length} to 100 chars`);
  }

  const readTitle = () =>
    evaluate(
      pageId,
      `() => {
      const titleEl =
        document.querySelector('textarea[name="Article Title"]') ||
        document.querySelector('textarea[placeholder="Add a title"]');
      const v = titleEl?.value || '';
      return { titleLen: v.length, titleUsed: v };
    }`,
      [],
      { typing: true, stableDom: false },
    );

  evaluate(
    pageId,
    `() => {
    const titleEl =
      document.querySelector('textarea[name="Article Title"]') ||
      document.querySelector('textarea[placeholder="Add a title"]');
    if (!titleEl) return { ok: false };
    titleEl.focus();
    titleEl.setSelectionRange(0, titleEl.value.length);
    document.execCommand('delete', false, null);
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
    return { ok: true };
  }`,
    [],
    { typing: true, stableDom: false },
  );

  focusTitle(pageId);
  cdt(['type_text', String(pageId), safeTitle]);
  sleep(0.2);
  return readTitle();
}

function focusTitle(pageId) {
  return evaluate(
    pageId,
    `() => {
    const titleEl =
      document.querySelector('textarea[name="Article Title"]') ||
      document.querySelector('textarea[placeholder="Add a title"]');
    if (!titleEl) return { ok: false };
    titleEl.focus();
    titleEl.setSelectionRange(0, titleEl.value.length);
    return { ok: true };
  }`,
    [],
    { typing: true, stableDom: false },
  );
}

const TOGGLE_OFF_CHORDS = {
  quote: 'Meta+Shift+9',
  ul: 'Meta+Shift+7',
  ol: 'Meta+Shift+8',
  bold: 'Meta+B',
  italic: 'Meta+I',
  strike: 'Meta+Shift+X',
};

function readToggleState(pageId) {
  const obs = observe(pageId);
  return { obs, toggles: obs.toggles, styleHint: obs.styleHint, dropdownOpen: obs.dropdownOpen };
}

/**
 * Re-type DIV blocks whose text matches expected H2 headings (paste/table insert sometimes drops H2).
 * @param {number} pageId
 * @param {string[]} h2Texts
 */
export function repairMisplacedH2s(pageId, h2Texts = []) {
  /** @type {string[]} */
  const repaired = [];
  /** @type {string[]} */
  const skipped = [];

  for (const headingText of h2Texts) {
    const found = evaluate(
      pageId,
      `(text) => {
      const root = document.querySelector('[contenteditable="true"]');
      const blocks = [...root?.querySelectorAll('[data-block=true]') || []];
      const norm = (s) => (s || '').replace(/\\n$/, '').trim();
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.tagName === 'H2') continue;
        if (norm(b.innerText) === text) {
          return { ok: true, index: i, tag: b.tagName };
        }
      }
      return { ok: false };
    }`,
      [headingText],
      { typing: true, stableDom: false },
    );

    if (!found?.ok) {
      skipped.push(headingText);
      continue;
    }

    evaluate(
      pageId,
      `(idx) => {
      const root = document.querySelector('[contenteditable="true"]');
      const blocks = [...root?.querySelectorAll('[data-block=true]') || []];
      const target = blocks[idx];
      if (!target) return { ok: false };
      target.focus?.();
      const r = document.createRange();
      r.selectNodeContents(target);
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
      return { ok: true };
    }`,
      [found.index],
      { typing: true, stableDom: false },
    );

    sleep(0.12);
    press(pageId, 'Backspace');
    sleep(0.15);
    cdt(['type_text', String(pageId), '## ']);
    sleep(0.2);
    cdt(['type_text', String(pageId), headingText]);
    sleep(0.25);
    resetToBodyPlain(pageId);
    repaired.push(headingText);
  }

  return { repaired, skipped };
}

/** Escape dropdown + toggle marks off + Meta+Shift+, to Body. */
export function resetToBodyPlain(pageId) {
  ensureDropdownClosed(pageId);
  let { toggles, styleHint } = readToggleState(pageId);
  for (const [key, on] of Object.entries(toggles)) {
    if (on && TOGGLE_OFF_CHORDS[key]) {
      press(pageId, TOGGLE_OFF_CHORDS[key]);
      sleep(0.08);
    }
  }
  for (let i = 0; i < 6; i++) {
    ({ styleHint } = readToggleState(pageId));
    if (!styleHint || styleHint === 'Body') break;
    press(pageId, 'Meta+Shift+,');
    sleep(0.12);
  }
  focusBody(pageId);
  sleep(0.06);
}

/** Select a complete visible phrase within a single Draft block (never a cross-block fragment). */
export function selectPhrase(pageId, needle) {
  return evaluate(
    pageId,
    `(needle) => {
    const root = document.querySelector('[contenteditable="true"]');
    if (!root || !needle) return { found: false, reason: 'no editor or needle' };
    root.focus();

    function tryBlock(block) {
      const blockText = (block.innerText || '').replace(/\\n$/, '');
      let searchFrom = blockText.length;
      while (searchFrom >= 0) {
        const localIdx = blockText.lastIndexOf(needle, searchFrom);
        if (localIdx < 0) break;
        const w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
        let node;
        let pos = 0;
        let start = null;
        let end = null;
        const startIdx = localIdx;
        const endIdx = localIdx + needle.length;
        while ((node = w.nextNode())) {
          const len = node.textContent.length;
          if (!start && pos + len > startIdx) start = { node, off: startIdx - pos };
          if (start && pos + len >= endIdx) {
            end = { node, off: endIdx - pos };
            break;
          }
          pos += len;
        }
        if (start && end) {
          const r = document.createRange();
          r.setStart(start.node, start.off);
          r.setEnd(end.node, end.off);
          const s = window.getSelection();
          s?.removeAllRanges();
          s?.addRange(r);
          const selected = s?.toString() ?? '';
          if (selected === needle) {
            return { found: true, selectedText: selected };
          }
        }
        searchFrom = localIdx - 1;
      }
      return null;
    }

    const blocks = [...root.querySelectorAll('[data-block=true]')];
    for (let bi = blocks.length - 1; bi >= 0; bi--) {
      const hit = tryBlock(blocks[bi]);
      if (hit) return hit;
    }
    return { found: false, reason: 'full label not selectable', needle };
  }`,
    [needle],
    { stableDom: false },
  );
}

/** Close Insert link dialog without submitting. */
export function dismissLinkDialog(pageId) {
  for (let i = 0; i < 5; i++) {
    const state = evaluate(
      pageId,
      `() => {
      const dlg = document.querySelector('[role="dialog"]');
      if (!dlg) return { open: false };
      const cancel = [...dlg.querySelectorAll('button')].find((b) => /cancel/i.test(b.textContent || ''));
      cancel?.click();
      return { open: !!document.querySelector('[role="dialog"]'), clickedCancel: !!cancel };
    }`,
      [],
      { typing: true, stableDom: false },
    );
    if (!state?.open) return { dismissed: true };
    press(pageId, 'Escape');
    sleep(0.12);
  }
  return {
    dismissed: !evaluate(pageId, `() => !!document.querySelector('[role="dialog"]')`),
  };
}

/**
 * Opens link dialog via [data-testid="btn-link"] (never ⌘K).
 * Caller must select the full label first; both dialog fields are filled explicitly.
 * @param {number} pageId
 * @param {{ label: string, url: string }} param1
 * @returns {{ ok: boolean, reason?: string }}
 */
export function applyLinkChord(pageId, { label, url }) {
  assertEditorAttached();
  const selection = evaluate(
    pageId,
    `(expected) => {
    const selected = window.getSelection()?.toString() ?? '';
    return { ok: selected === expected, selected, expected };
  }`,
    [label],
    { stableDom: false },
  );
  if (!selection?.ok) {
    return {
      ok: false,
      reason: `selection mismatch before btn-link: got ${JSON.stringify(selection?.selected?.slice(0, 40))}`,
    };
  }

  const opened = evaluate(
    pageId,
    `() => {
    const btn = document.querySelector('[data-testid="btn-link"]');
    if (!btn) return { clicked: false };
    btn.click();
    return { clicked: true };
  }`,
    [],
    { typing: true, stableDom: false },
  );
  if (!opened?.clicked) {
    return { ok: false, reason: 'btn-link not found' };
  }
  sleep(0.45);

  const filled = evaluate(
    pageId,
    `(displayText, linkUrl) => {
    const dlg = document.querySelector('[role="dialog"]');
    if (!dlg) return { ok: false, reason: 'no dialog after btn-link' };
    const inputs = [...dlg.querySelectorAll('input:not([type="hidden"])')];
    const labelEls = [...dlg.querySelectorAll('label')];
    /** @type {HTMLInputElement|null} */
    let textInput = null;
    /** @type {HTMLInputElement|null} */
    let urlInput = null;

    for (const inp of inputs) {
      const id = inp.id;
      const lbl = (labelEls.find((l) => l.htmlFor === id)?.textContent || inp.getAttribute('aria-label') || inp.placeholder || '').trim().toLowerCase();
      if (/text to display|^text$|display text|link text/.test(lbl)) textInput = inp;
      else if (/url|web address|^address$/.test(lbl)) urlInput = inp;
    }
    if (!textInput && inputs.length >= 2) textInput = inputs[0];
    if (!urlInput && inputs.length >= 2) urlInput = inputs[inputs.length - 1];
    else if (!urlInput && inputs.length === 1) urlInput = inputs[0];

    function setInput(inp, val) {
      if (!inp) return false;
      inp.focus();
      inp.select?.();
      inp.value = val;
      inp.dispatchEvent(new InputEvent('input', { bubbles: true, data: val, inputType: 'insertText' }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      return inp.value === val;
    }

    if (!setInput(textInput, displayText)) return { ok: false, reason: 'text-to-display fill failed' };
    if (!setInput(urlInput, linkUrl)) return { ok: false, reason: 'url fill failed' };
    return {
      ok: true,
      displayValue: textInput?.value,
      urlValue: urlInput?.value,
    };
  }`,
    [label, url],
    { typing: true, stableDom: false },
  );
  if (!filled?.ok) {
    dismissLinkDialog(pageId);
    return { ok: false, reason: filled?.reason ?? 'dialog fill failed' };
  }

  sleep(0.15);
  const submitted = evaluate(
    pageId,
    `() => {
    const dlg = document.querySelector('[role="dialog"]');
    if (!dlg) return { ok: false, reason: 'dialog gone before submit' };
    const btn = [...dlg.querySelectorAll('button')].find((b) => /^(insert|save|apply|add|ok)$/i.test((b.textContent || '').trim()));
    if (btn && !btn.disabled) {
      btn.click();
      return { ok: true, via: 'button' };
    }
    return { ok: true, via: 'enter' };
  }`,
    [],
    { typing: true, stableDom: false },
  );
  if (submitted?.via === 'enter') {
    press(pageId, 'Enter');
  }
  sleep(0.3);

  dismissLinkDialog(pageId);
  resetToBodyPlain(pageId);
  return { ok: true };
}
