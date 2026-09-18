// Design Ref: DESIGN.md 6번(API 명세) — 파일 다운로드 응답 헤더를 만드는 공용 함수들.
// Plan SC: PLAN.md 작업 12번 — 작업자가 받은 파일이 워드/엑셀/파워포인트로 제대로 열려야 한다.

/** 확장자 → Content-Type. 브라우저·OS가 파일 종류를 알아보게 하려면 정확히 내려줘야 한다. */
const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export function getMimeTypeForExtension(extension: string): string {
  return MIME_TYPE_BY_EXTENSION[extension.toLowerCase()] ?? "application/octet-stream";
}

/**
 * Content-Disposition 헤더 값을 만든다 (RFC 6266).
 *
 * 한글 파일명은 그대로 헤더에 넣을 수 없어서 filename*=UTF-8''... 형태로 인코딩해 넣는다.
 * 그런데 이 형식을 못 읽는 오래된 브라우저를 위해, 헤더에 안전하게 들어갈 수 있는 ASCII 이름도
 * filename="..."으로 함께 준다. 이때 ASCII 대체 이름에서도 확장자는 반드시 살려둔다 —
 * 확장자가 없으면 맥·윈도우가 워드 파일인 줄 모르고 텍스트로 열어버리기 때문이다.
 */
export function buildContentDisposition(fileName: string): string {
  // 맥에서 올린 한글 파일명은 자모가 분리된(NFD) 형태로 저장돼 있어, 합쳐진(NFC) 형태로 맞춰 내려준다.
  const normalized = fileName.normalize("NFC");
  const dotIndex = normalized.lastIndexOf(".");
  const extension = dotIndex > 0 ? normalized.slice(dotIndex) : "";
  const baseName = dotIndex > 0 ? normalized.slice(0, dotIndex) : normalized;

  // 헤더에 넣을 수 없는 문자(한글·따옴표·역슬래시 등)를 지운 ASCII 대체 이름.
  // 한글만으로 된 이름이면 남는 게 없으니, 그럴 때는 알아볼 수 있는 기본 이름을 쓴다.
  const asciiBase = baseName.replace(/[^\x20-\x7E]/g, "").replace(/["\\]/g, "").trim();
  const asciiFallback = `${/[A-Za-z0-9]/.test(asciiBase) ? asciiBase : "download"}${extension}`;

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(normalized)}`;
}
