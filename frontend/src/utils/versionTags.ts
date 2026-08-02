/** 将版本 tag 字段（逗号/分号分隔或数组）拆成 trim 后的标签列表 */
export function splitVersionTags(tag?: string | string[] | null): string[] {
  if (Array.isArray(tag)) {
    return tag.map((t) => String(t).trim()).filter(Boolean);
  }
  if (!tag || typeof tag !== 'string') {
    return [];
  }
  return tag
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** 合并为落库用逗号分隔字符串；忽略大小写去重；空则 undefined */
export function joinVersionTags(tags?: string | string[] | null): string | undefined {
  const parts = splitVersionTags(tags);
  if (!parts.length) {
    return undefined;
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of parts) {
    const key = t.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(t);
  }
  return out.join(',');
}

/** 筛选：查询串匹配任一标签 token（忽略大小写，子串包含） */
export function versionTagsMatchFilter(tag: string | undefined | null, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return splitVersionTags(tag).some((t) => t.toLowerCase().includes(q));
}
