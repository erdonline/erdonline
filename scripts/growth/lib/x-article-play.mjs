/**
 * X Article sole Chrome executor — runFill(payload) state machine.
 * Does NOT compile; does NOT click Publish / Save draft / Create.
 */

import { observe, preflightArticleEditor, press, sleep, ensureDropdownClosed } from './x-article-cdp-guarded.mjs';
import { auditSnapshot, classifyPaste } from './x-article-audit.mjs';
import { applyPostPasteBold, shouldApplyBoldChords } from './x-article-bold.mjs';
import { insertCodeAtomic, probeDraftJs, repairHeadingsAtomic } from './x-article-draftjs.mjs';
import {
  insertCode,
  insertDivider,
  insertMedia,
  insertMenu,
  insertTable,
  INSERT_KIND_TO_MENU,
} from './x-article-insert-menu.mjs';
import {
  applyLinkChord,
  caretAfterBlockMatching,
  clearBody,
  dismissLinkDialog,
  newParagraph,
  pasteRich,
  resetToBodyPlain,
  repairMisplacedH2s,
  selectPhrase,
  setTitleOnce,
} from './x-article-typer.mjs';

function sortedInsertPlan(insertPlan = []) {
  return [...insertPlan].sort((a, b) => (a.playOrder ?? 0) - (b.playOrder ?? 0));
}

/** @type {{ ok?: boolean } | null} */
let draftJsProbeCache = null;

function draftJsReady(pageId) {
  if (!draftJsProbeCache) draftJsProbeCache = probeDraftJs(pageId);
  return draftJsProbeCache?.ok === true;
}

function emitInsertBlock(pageId, entry) {
  resetToBodyPlain(pageId);
  switch (entry.kind) {
    case 'code':
      if (draftJsReady(pageId)) {
        insertCodeAtomic(pageId, {
          language: entry.language,
          text: entry.text,
          markdown: entry.markdown,
          afterText: entry.anchor?.type === 'afterText' ? entry.anchor.text : undefined,
          afterHeading: entry.anchor?.type === 'afterHeading' ? entry.anchor.text : undefined,
        });
      } else {
        insertCode(pageId, entry.text, { language: entry.language });
      }
      break;
    case 'table':
      insertTable(pageId, entry.rows);
      break;
    case 'divider':
      insertDivider(pageId);
      break;
    case 'image':
      insertMedia(pageId, { filePath: entry.filePath, url: entry.url || entry.src, alt: entry.alt });
      break;
    case 'gif':
    case 'posts':
    case 'latex':
      insertMenu(pageId, INSERT_KIND_TO_MENU[entry.kind]);
      press(pageId, 'Escape');
      sleep(0.1);
      break;
    default:
      throw new Error(`emitInsertBlock: unsupported kind ${entry.kind}`);
  }
  resetToBodyPlain(pageId);
}

export function applyInsertPlan(pageId, insertPlan) {
  draftJsProbeCache = null;
  const plan = sortedInsertPlan(insertPlan);
  for (const entry of plan) {
    const anchor = entry.anchor ?? { type: 'trailing' };
    const fiberCode = entry.kind === 'code' && draftJsReady(pageId);
    if (!fiberCode) {
      if (anchor.type === 'trailing') {
        caretAfterBlockMatching(pageId, anchor);
        newParagraph(pageId);
      } else {
        const placed = caretAfterBlockMatching(pageId, anchor);
        if (!placed.ok) {
          throw new Error(
            `insert anchor not found: ${JSON.stringify(anchor.text?.slice(0, 40) ?? anchor.type)}`,
          );
        }
        newParagraph(pageId);
      }
    }
    emitInsertBlock(pageId, entry);
  }
  return { count: plan.length, codeMethod: draftJsProbeCache?.ok ? 'fiber-markdown' : 'overlay' };
}

export function applyPostPasteLinks(pageId, actions = []) {
  /** @type {string[]} */
  const applied = [];
  /** @type {string[]} */
  const warnings = [];
  for (const action of actions) {
    if (action.type !== 'link') continue;
    const picked = selectPhrase(pageId, action.label);
    if (!picked.found || picked.selectedText !== action.label) {
      warnings.push(
        `link skip: cannot select full label ${JSON.stringify(action.label)}${picked.reason ? ` (${picked.reason})` : ''}`,
      );
      continue;
    }
    const result = applyLinkChord(pageId, { label: action.label, url: action.url });
    if (!result.ok) {
      warnings.push(`link fail: ${action.label} — ${result.reason}`);
      continue;
    }
    applied.push(`link:${action.label}`);
  }
  return { applied, warnings };
}

function fillTitle(pageId, title) {
  let result = setTitleOnce(pageId, title);
  if (result.titleLen === 0) {
    result = setTitleOnce(pageId, title);
  }
  if (result.titleUsed !== title && result.titleLen > 0) {
    throw new Error(
      `Title mismatch — expected ${JSON.stringify(title)}, got ${JSON.stringify(result.titleUsed)}`,
    );
  }
  if (result.titleLen === 0) {
    throw new Error('Title fill failed — textarea still empty after one retry');
  }
  return result;
}

function clearBodyWithRetry(pageId) {
  let obs = clearBody(pageId);
  if (obs.bodyLength > 0 && obs.blockCount > 1) {
    obs = clearBody(pageId);
    if (obs.bodyLength > 0 && obs.blockCount > 1) {
      throw new Error(
        `clearBody failed — bodyLength=${obs.bodyLength} blockCount=${obs.blockCount}`,
      );
    }
  }
  return obs;
}

function pasteOnce(pageId, payload) {
  resetToBodyPlain(pageId);
  return pasteRich(pageId, { html: payload.html, plain: payload.plain });
}

/**
 * Play compiled payload into attached edit tab.
 * @param {ReturnType<import('./x-article-compile.mjs').compileArticle>} payload
 * @param {{ pageId: number, auditStrict?: boolean }} opts
 */
export function runFill(payload, { pageId, auditStrict = false }) {
  /** @type {Record<string, unknown>} */
  const log = {};

  preflightArticleEditor(pageId);
  log.title = fillTitle(pageId, payload.title);

  clearBodyWithRetry(pageId);
  pasteOnce(pageId, payload);
  let snap = observe(pageId);
  let pasteClass = classifyPaste(snap, payload);

  if (pasteClass !== 'strong') {
    clearBodyWithRetry(pageId);
    pasteOnce(pageId, payload);
    snap = observe(pageId);
    pasteClass = classifyPaste(snap, payload);
    if (pasteClass !== 'strong') {
      throw new Error(
        `paste not strong after replay — bodyLength=${snap.bodyLength} plainLength=${payload.plain.length} blockCount=${snap.blockCount} firstBlockText=${JSON.stringify(snap.firstBlockText?.slice(0, 80))}`,
      );
    }
  }
  log.pasteClass = pasteClass;

  const useBoldChords = shouldApplyBoldChords(snap, payload.html);
  const boldResult = applyPostPasteBold(pageId, payload.meta?.markPhrases ?? [], { useChords: useBoldChords });
  log.postPasteBold = boldResult;
  for (const w of boldResult.warnings) {
    console.warn(w);
  }

  const linkResult = applyPostPasteLinks(pageId, payload.postPasteActions ?? []);
  log.postPaste = linkResult;
  for (const w of linkResult.warnings) {
    console.warn(w);
  }

  log.insert = applyInsertPlan(pageId, payload.insertPlan ?? []);

  log.repairH2 = draftJsReady(pageId)
    ? repairHeadingsAtomic(pageId, payload.meta?.h2Texts ?? [])
    : repairMisplacedH2s(pageId, payload.meta?.h2Texts ?? []);

  const finalSnap = observe(pageId);
  const audit = auditSnapshot(finalSnap, payload);
  log.audit = audit;

  for (const w of audit.warnings) {
    console.warn(`audit: ${w}`);
  }
  if (auditStrict && !audit.ok) {
    throw new Error(`audit failed: ${audit.errors.join('; ')}`);
  }

  return { log, snapshot: finalSnap, audit };
}

/**
 * Insert plan only — skips title/paste/links. Draft must already be filled.
 * @param {ReturnType<import('./x-article-compile.mjs').compileArticle>} payload
 * @param {{ pageId: number, auditStrict?: boolean }} opts
 */
export function runInsertsOnly(payload, { pageId, auditStrict = false }) {
  /** @type {Record<string, unknown>} */
  const log = {};

  preflightArticleEditor(pageId);
  log.linkDialog = dismissLinkDialog(pageId);
  ensureDropdownClosed(pageId);

  log.insert = applyInsertPlan(pageId, payload.insertPlan ?? []);

  const finalSnap = observe(pageId);
  const audit = auditSnapshot(finalSnap, payload);
  log.audit = audit;

  for (const w of audit.warnings) {
    console.warn(`audit: ${w}`);
  }
  if (auditStrict && !audit.ok) {
    throw new Error(`audit failed: ${audit.errors.join('; ')}`);
  }

  return { log, snapshot: finalSnap, audit };
}

/** @deprecated use runFill */
export function playCompiledPayload(pageId, payload, opts = {}) {
  return runFill(payload, { pageId, auditStrict: opts.audit ?? false });
}

/** @deprecated use auditSnapshot */
export function auditPayload(pageId, payload) {
  const snap = observe(pageId);
  const audit = auditSnapshot(snap, payload);
  return { ok: audit.ok, errors: audit.errors, observe: snap, h2Count: snap.h2Count };
}
