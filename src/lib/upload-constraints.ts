// Design Ref: DESIGN.md 7번(제약 조건) — 업로드 용량·허용 형식
// 클라이언트(화면 검증)와 서버(API 검증) 양쪽에서 같은 기준을 쓰기 위해 공용으로 둔다.

/** 업로드 파일 최대 용량 (대상 파일·참고 이미지 공통) */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

/** 대상 파일로 허용하는 확장자 (PRD.md 6번 범위: 워드/엑셀/파워포인트만 지원) */
export const ALLOWED_TARGET_EXTENSIONS: string[] = ["docx", "xlsx", "pptx"];

/** 참고 이미지로 허용하는 MIME 타입 */
export const ALLOWED_IMAGE_MIME_TYPES: string[] = ["image/png", "image/jpeg"];

/** 파일명에서 확장자만 소문자로 추출 (점 없으면 빈 문자열) */
export function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? "" : fileName.slice(idx + 1).toLowerCase();
}

/**
 * 파일명의 확장자는 그대로 두고, 이름 뒤에만 표시를 덧붙인다.
 * 예: ("경영전략 최종 정리.docx", "반영제안") → "경영전략 최종 정리_반영제안.docx"
 *
 * 원본과 제안 파일이 똑같은 이름으로 내려가면 작업자가 둘을 구분하려고 직접 이름을 바꾸게 되는데,
 * 그때 확장자(.docx)까지 지워버리면 맥·윈도우가 워드 파일인 줄 모르고 텍스트로 열어버린다.
 * 파일 내용은 멀쩡한데도 "이름은 그대로인데 열어보면 txt"로 보이는 문제가 여기서 생겼다.
 * 그래서 앱이 처음부터 구분되는 이름으로 내려보내, 이름을 손댈 이유를 없앤다.
 */
export function withFileNameSuffix(fileName: string, suffix: string): string {
  const idx = fileName.lastIndexOf(".");
  if (idx <= 0) return `${fileName}_${suffix}`; // 확장자가 없으면 뒤에만 붙인다
  return `${fileName.slice(0, idx)}_${suffix}${fileName.slice(idx)}`;
}

/**
 * 이미지 MIME 타입 → 확장자. Supabase Storage 키에 원본 파일명(한글 등)을 그대로 쓰면
 * "Invalid key" 오류가 나므로, 참고 이미지는 파일명 대신 여기서 안전한 확장자를 구한다.
 */
export function getImageExtensionFromMimeType(mimeType: string): string {
  return mimeType === "image/png" ? "png" : "jpg";
}
