import type { RequestStatus } from "@/types/domain";

// Design Ref: DESIGN.md 5번(상태 값 정의) — 상태값의 한글 라벨을 한 곳에서 관리한다.
// Plan SC: PLAN.md 작업 7번 — "확인 요청" 등 상태를 화면에 보여줄 때 이 라벨을 쓴다.

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: "대기",
  ANALYZING: "분석중",
  NEEDS_REVIEW: "확인 요청",
  PROPOSED: "제안 생성됨",
  APPROVED: "승인됨",
  REJECTED: "반려됨",
  FAILED: "실패",
};
