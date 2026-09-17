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
