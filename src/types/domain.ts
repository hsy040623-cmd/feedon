// Design Ref: DESIGN.md 5번(상태 값 정의), 6번(API 명세) — 프로젝트/요청/제안 공통 데이터 모델
// Plan SC: PLAN.md 작업 1번 — 요청·프로젝트·제안 공통 데이터 모델 정의

/** 요청 처리 상태값 (DESIGN.md 5번 표와 동일하게 유지) */
export type RequestStatus =
  | "PENDING" // 대기
  | "ANALYZING" // 분석중
  | "NEEDS_REVIEW" // 확인 요청
  | "PROPOSED" // 제안 생성됨
  | "APPROVED" // 승인됨
  | "REJECTED" // 반려됨
  | "FAILED"; // 실패

/** 지원 대상 파일 형식 (PRD.md 6번 범위: 워드/엑셀/파워포인트만 지원) */
export type TargetFileFormat = "docx" | "xlsx" | "pptx";

/** 프로젝트(작업 건) — 클라이언트/작업 단위로 요청을 묶는 공간 */
export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

/** 작업자가 업로드한 대상 파일 정보 */
export interface TargetFile {
  format: TargetFileFormat;
  fileName: string;
  /** Supabase Storage 상의 경로 */
  storagePath: string;
}

/** AI가 텍스트·이미지에서 추출한 개별 수정 항목 (PRD.md 6번: 위치+변경 전+변경 후 구조) */
export interface ChangeItem {
  /** 수정 대상 위치 */
  location: string;
  /** 변경 전 내용 */
  before: string;
  /** 변경 후 내용/요청 사항 */
  after: string;
}

/** 클라이언트 수정 요청 */
export interface FeedbackRequest {
  id: string;
  projectId: string;
  /** 클라이언트가 전달한 수정 요청 텍스트 */
  text: string;
  /** 참고 이미지/스크린샷 (Supabase Storage 경로 목록, 선택 사항) */
  referenceImagePaths: string[];
  targetFile: TargetFile;
  status: RequestStatus;
  /** status가 NEEDS_REVIEW일 때, 무엇이 모호하거나 상충하는지 설명 */
  ambiguityReason?: string;
  createdAt: string;
  updatedAt: string;
}

/** 반영 제안(Preview) — 작업자가 승인하기 전까지 원본 파일을 대체하지 않는다 */
export interface Proposal {
  id: string;
  requestId: string;
  changes: ChangeItem[];
  /** 실제로 수정이 적용된 제안 파일의 Supabase Storage 경로 */
  proposedFileStoragePath: string;
  createdAt: string;
}
