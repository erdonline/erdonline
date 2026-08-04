/** Numeric semver-ish compare; `null` = unknown / incomparable (ADR-0022 #9). */

export type VersionCompareResult = number | null;

function parseVersionSegments(raw: unknown): number[] | null {
  if (raw == null) {
    return null;
  }
  const s = String(raw).trim();
  if (!s) {
    return null;
  }

  const normalized = /^[vV]/.test(s) ? s.slice(1).trim() : s;
  if (!normalized || !/^\d+(\.\d+)*$/.test(normalized)) {
    return null;
  }

  const parts = normalized.split('.');
  if (parts.some((p) => p === '')) {
    return null;
  }

  const segments = parts.map((p) => parseInt(p, 10));
  if (segments.some((n) => Number.isNaN(n))) {
    return null;
  }
  return segments;
}

/** @returns negative if v1<v2, 0 if equal, positive if v1>v2, null if incomparable */
export function compareStringVersion(v1: unknown, v2: unknown): VersionCompareResult {
  const segs1 = parseVersionSegments(v1);
  const segs2 = parseVersionSegments(v2);
  if (segs1 === null || segs2 === null) {
    return null;
  }

  const maxLen = Math.max(segs1.length, segs2.length);
  for (let i = 0; i < maxLen; i += 1) {
    const a = segs1[i] ?? 0;
    const b = segs2[i] ?? 0;
    if (a !== b) {
      return a - b;
    }
  }
  return 0;
}

/** Sort helper: unknown versions sink to the end with stable string tie-break. */
export function compareStringVersionForSort(
  a: unknown,
  b: unknown,
  descending = false,
): number {
  const cmp = compareStringVersion(a, b);
  if (cmp !== null) {
    return descending ? -cmp : cmp;
  }
  const sa = String(a ?? '');
  const sb = String(b ?? '');
  const bothInvalid = parseVersionSegments(a) === null && parseVersionSegments(b) === null;
  if (bothInvalid) {
    return sa.localeCompare(sb);
  }
  const aInvalid = parseVersionSegments(a) === null;
  const bInvalid = parseVersionSegments(b) === null;
  if (aInvalid !== bInvalid) {
    return aInvalid ? 1 : -1;
  }
  return sa.localeCompare(sb);
}

export function isVersionGreater(v1: unknown, v2: unknown): boolean | null {
  const cmp = compareStringVersion(v1, v2);
  if (cmp === null) {
    return null;
  }
  return cmp > 0;
}

export function isVersionLessOrEqual(v1: unknown, v2: unknown): boolean | null {
  const cmp = compareStringVersion(v1, v2);
  if (cmp === null) {
    return null;
  }
  return cmp <= 0;
}
