/**
 * 校验拟落盘为 .docx 的 blob：禁空体 / JSON 错误体 / 非 ZIP 魔数冒充文档。
 * Office Open XML（.docx）底层为 ZIP，魔数为 `PK`。
 *
 * @returns null 表示可保存；否则为失败原因（供 toast）
 */
export async function docxBlobFailureReason(
  res: unknown,
  copy: {
    missing: string;
    notBlob: string;
    empty: string;
    failDefault: string;
    notDocx: string;
  },
): Promise<string | null> {
  if (res == null) {
    return copy.missing;
  }
  if (!(res instanceof Blob)) {
    return copy.notBlob;
  }
  if (res.size === 0) {
    return copy.empty;
  }
  const type = (res.type || '').toLowerCase();
  if (type.includes('json')) {
    try {
      const json = JSON.parse(await res.text()) as { msg?: string; message?: string };
      return json.msg || json.message || copy.failDefault;
    } catch {
      return copy.failDefault;
    }
  }
  // 部分网关以 octet-stream 包 JSON 错误；docx 为 ZIP（PK）
  const head = new Uint8Array(await res.slice(0, 4).arrayBuffer());
  const isZip =
    head.length >= 2 && head[0] === 0x50 /* P */ && head[1] === 0x4b /* K */;
  if (!isZip) {
    try {
      const text = await res.slice(0, 512).text();
      const trimmed = text.trimStart();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const json = JSON.parse(trimmed) as { msg?: string; message?: string };
        return json.msg || json.message || copy.failDefault;
      }
    } catch {
      /* 非 JSON */
    }
    return copy.notDocx;
  }
  return null;
}
