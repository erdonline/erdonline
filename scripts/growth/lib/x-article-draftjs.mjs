/**
 * X Article Draft.js MAIN-world writes — MARKDOWN atomic blocks via React fiber.
 * Code inserts only; table stays overlay + Update (x-article-insert-menu.mjs).
 */

import { evaluate, sleep } from './x-article-cdp-guarded.mjs';

/** @param {string} language X picker label (SQL) or fence tag (sql) */
export function buildMarkdownFence(language, codeText) {
  const text = String(codeText ?? '').trim();
  const tag = String(language ?? 'plaintext').trim().toLowerCase();
  const fenceTag = tag === 'sql' || tag === 'pgsql' ? 'sql' : tag.replace(/\s+/g, '');
  return `\`\`\`${fenceTag}\n${text}\n\`\`\``;
}

/** Shared MAIN-world Draft.js helpers — injected into evaluate_script. */
export const DRAFTJS_MAIN_HELPERS = String.raw`
function __xDraftRoot() {
  return document.querySelector('[contenteditable="true"]');
}

function __xFindDraftState() {
  const root = __xDraftRoot();
  if (!root) return { ok: false, reason: 'no contenteditable' };
  const fiberKey = Object.keys(root).find((k) => k.startsWith('__reactFiber'));
  if (!fiberKey) return { ok: false, reason: 'no __reactFiber key on editor root' };
  function climb(fiber, depth = 0) {
    if (!fiber || depth > 60) return null;
    const props = fiber.memoizedProps || fiber.pendingProps || {};
    if (props.editorState && typeof props.onChange === 'function') {
      return { editorState: props.editorState, onChange: props.onChange, fiberKey };
    }
    return climb(fiber.return, depth + 1);
  }
  const draft = climb(root[fiberKey]);
  if (!draft) return { ok: false, reason: 'findDraftStateNode failed' };
  return { ok: true, root, draft, fiberKey };
}

function __xBlockEntityMarkdown(content, block) {
  const chars = block.getCharacterList();
  for (let j = 0; j < chars.size; j++) {
    const eKey = chars.get(j).getEntity();
    if (!eKey) continue;
    try {
      const ent = content.getEntity(eKey);
      if (ent.getType() === 'MARKDOWN') return ent.getData()?.markdown ?? null;
    } catch (_) {}
  }
  return null;
}

function __xIsCodeMarkdown(md) {
  if (typeof md !== 'string') return false;
  const t = md.trim();
  const fence = String.fromCharCode(96, 96, 96);
  return t.startsWith(fence) && t.endsWith(fence);
}

function __xFindInsertIndex(blocks, { afterText, afterHeading }) {
  const arr = blocks.toArray();
  const needle = (afterText || afterHeading || '').trim();
  if (!needle) return Math.max(0, arr.length - 1);
  for (let i = 0; i < arr.length; i++) {
    const t = arr[i].getText();
    if (afterHeading && (arr[i].getType() === 'header-two' || arr[i].getType() === 'header-one')) {
      if (t.includes(needle) || needle.includes(t.slice(0, 24))) return i;
    } else if (afterText && t.includes(needle.slice(0, Math.min(needle.length, 40)))) {
      return i;
    }
  }
  return -1;
}

function __xRemoveCodeMarkdownBlocks(content) {
  const blocks = content.getBlockMap();
  const keys = blocks.keySeq().toArray();
  const kept = keys.filter((key) => {
    const block = blocks.get(key);
    if (block.getType() !== 'atomic') return true;
    const md = __xBlockEntityMarkdown(content, block);
    return !__xIsCodeMarkdown(md);
  });
  if (kept.length === keys.length) return content;
  const pairs = kept.map((k) => [k, blocks.get(k)]);
  return content.set('blockMap', blocks.constructor(pairs));
}

function __xDraftConstructors(blocks) {
  const arr = blocks.toArray();
  const withChars = arr.find((b) => b.getCharacterList().size > 0) || arr[0];
  if (!withChars) return null;
  const ContentBlock = withChars.constructor;
  const CharacterMetadata = withChars.getCharacterList().get(0)?.constructor
    || withChars.getCharacterList().constructor?.().get(0)?.constructor;
  if (!CharacterMetadata) return null;
  return {
    ContentBlock,
    CharacterMetadata,
    List: withChars.getCharacterList().constructor,
    OrderedMap: blocks.constructor,
  };
}

function __xInsertMarkdownAtomic(content, editorState, { markdown, afterText, afterHeading }) {
  const blocks = content.getBlockMap();
  const keys = blocks.keySeq().toArray();
  const insertAfterIdx = __xFindInsertIndex(blocks, { afterText, afterHeading });
  if (insertAfterIdx < 0) {
    return { ok: false, reason: 'anchor block not found', afterText, afterHeading };
  }
  const ctors = __xDraftConstructors(blocks);
  if (!ctors) {
    return { ok: false, reason: 'no Draft.js block constructors in editor state' };
  }
  const { ContentBlock, CharacterMetadata, List, OrderedMap } = ctors;
  const EditorState = editorState.constructor;
  const SelectionState = editorState.getSelection().constructor;
  const genKey = () => Math.random().toString(36).slice(2, 7);

  let newContent = content.createEntity('MARKDOWN', 'MUTABLE', { markdown });
  const entityKey = newContent.getLastCreatedEntityKey();
  const newBlock = new ContentBlock({
    key: genKey(),
    type: 'atomic',
    text: ' ',
    characterList: List([CharacterMetadata.create({ entity: entityKey })]),
  });

  const pairs = [];
  for (let i = 0; i < keys.length; i++) {
    pairs.push([keys[i], blocks.get(keys[i])]);
    if (i === insertAfterIdx) pairs.push([newBlock.getKey(), newBlock]);
  }
  newContent = newContent.set('blockMap', OrderedMap(pairs));

  const anchorKey = keys[insertAfterIdx];
  const sel = SelectionState.createEmpty(anchorKey).merge({ anchorOffset: 0, focusOffset: 0 });
  const finalState = EditorState.set(editorState, { currentContent: newContent, selection: sel });
  return {
    ok: true,
    finalState,
    insertAfterIdx,
    newBlockKey: newBlock.getKey(),
    blockCount: newContent.getBlockMap().size,
  };
}

function __xPromoteBlockToHeaderTwo(content, editorState, headingText) {
  const blocks = content.getBlockMap();
  const keys = blocks.keySeq().toArray();
  let targetKey = null;
  const needle = String(headingText || '').trim();
  for (const key of keys) {
    const block = blocks.get(key);
    if (block.getType() === 'header-two' || block.getType() === 'header-one') continue;
    if (block.getText().trim() === needle) {
      targetKey = key;
      break;
    }
  }
  if (!targetKey) return { ok: false, reason: 'heading block not found', headingText: needle };
  const block = blocks.get(targetKey);
  const ContentBlock = block.constructor;
  const EditorState = editorState.constructor;
  const promoted = new ContentBlock({
    key: targetKey,
    type: 'header-two',
    text: block.getText(),
    characterList: block.getCharacterList(),
    depth: block.getDepth(),
    data: block.getData(),
  });
  const newContent = content.merge({
    blockMap: blocks.set(targetKey, promoted),
  });
  const sel = editorState.getSelection().constructor.createEmpty(targetKey);
  const finalState = EditorState.set(editorState, { currentContent: newContent, selection: sel });
  return { ok: true, finalState, targetKey, blockType: promoted.getType() };
}
`;

/** @returns {{ ok: boolean, fiberKey?: string, hasMarkdown?: boolean, sampleEntity?: object, blockCount?: number, reason?: string }} */
export function probeDraftJs(pageId) {
  return evaluate(
    pageId,
    `() => {
    ${DRAFTJS_MAIN_HELPERS}
    const hit = __xFindDraftState();
    if (!hit.ok) return hit;
    const content = hit.draft.editorState.getCurrentContent();
    const blocks = content.getBlockMap().toArray();
    let sampleEntity = null;
    for (const block of blocks) {
      const md = __xBlockEntityMarkdown(content, block);
      if (md && __xIsCodeMarkdown(md)) {
        sampleEntity = { markdown: md.slice(0, 80), blockType: block.getType() };
        break;
      }
    }
    return {
      ok: true,
      fiberKey: hit.fiberKey,
      hasMarkdown: !!sampleEntity,
      sampleEntity,
      blockCount: blocks.length,
    };
  }`,
    [],
    { stableDom: false },
  );
}

/**
 * Insert MARKDOWN code atomic after anchor — Draft.js fiber onChange.
 * Does not wipe other code blocks (multi-fence articles insert sql + text + json).
 * @param {number} pageId
 * @param {{ language?: string, text: string, markdown?: string, afterText?: string, afterHeading?: string }} opts
 */
export function insertCodeAtomic(pageId, { language, text, markdown, afterText, afterHeading } = {}) {
  const codeText = String(text ?? '').trim();
  if (!codeText) throw new Error('insertCodeAtomic: empty text');
  const fenceMarkdown = markdown ?? buildMarkdownFence(language ?? 'sql', codeText);
  const codeSnippet = codeText.slice(0, 24);

  const r = evaluate(
    pageId,
    `(args) => {
    ${DRAFTJS_MAIN_HELPERS}
    const hit = __xFindDraftState();
    if (!hit.ok) return hit;
    let { editorState, onChange } = hit.draft;
    const content = editorState.getCurrentContent();
    const inserted = __xInsertMarkdownAtomic(content, editorState, args);
    if (!inserted.ok) return inserted;
    onChange(inserted.finalState);

    const afterHit = __xFindDraftState();
    const after = afterHit.draft.editorState.getCurrentContent();
    const blocks = after.getBlockMap().toArray();
    const codeIdx = blocks.findIndex((b) => __xBlockEntityMarkdown(after, b) === args.markdown);
    const fridayIdx = blocks.findIndex((b) => b.getText().includes('Friday night'));
    let domLang = null;
    const sections = [...document.querySelectorAll('section')].filter((s) => s.querySelector('pre') && !s.querySelector('table'));
    if (sections[0]) {
      const langBits = [...sections[0].querySelectorAll('span')].map((s) => s.innerText?.trim()).filter(Boolean);
      domLang = langBits.find((t) => /^sql$/i.test(t)) || langBits[0] || null;
    }
    return {
      ok: true,
      method: 'fiber-markdown',
      codeBlockIdx: codeIdx,
      fridayIdx,
      insertAfterIdx: inserted.insertAfterIdx,
      blockCount: blocks.length,
      domHasCode: document.body.innerText.includes(${JSON.stringify(codeSnippet)}),
      domLang,
    };
  }`,
    [{ markdown: fenceMarkdown, afterText: afterText ?? null, afterHeading: afterHeading ?? null }],
    { stableDom: false },
  );

  if (!r.ok) {
    throw new Error(
      `insertCodeAtomic: ${r.reason || 'fiber write failed'}${r.afterText ? ` anchor=${JSON.stringify(String(r.afterText).slice(0, 40))}` : ''}`,
    );
  }
  sleep(0.25);
  return r;
}

/**
 * Promote unstyled blocks matching heading text to header-two via Draft.js fiber.
 * @param {number} pageId
 * @param {string[]} h2Texts
 */
export function repairHeadingsAtomic(pageId, h2Texts = []) {
  /** @type {string[]} */
  const repaired = [];
  /** @type {string[]} */
  const skipped = [];

  for (const headingText of h2Texts) {
    const r = evaluate(
      pageId,
      `(headingText) => {
      ${DRAFTJS_MAIN_HELPERS}
      const hit = __xFindDraftState();
      if (!hit.ok) return hit;
      const { editorState, onChange } = hit.draft;
      const content = editorState.getCurrentContent();
      const promoted = __xPromoteBlockToHeaderTwo(content, editorState, headingText);
      if (!promoted.ok) return promoted;
      onChange(promoted.finalState);
      const domH2 = [...document.querySelectorAll('[contenteditable="true"] [data-block=true]')].filter(
        (b) => b.tagName === 'H2' && b.innerText.trim() === headingText.trim(),
      ).length;
      return { ok: true, headingText, domH2 };
    }`,
      [headingText],
      { stableDom: false },
    );

    if (r?.ok) {
      repaired.push(headingText);
    } else {
      skipped.push(headingText);
    }
    sleep(0.12);
  }

  return { repaired, skipped, method: 'fiber-header-two' };
}
