import { REQUEST_STATUS_LABEL } from "@/lib/request-status";
import type { RequestStatus } from "@/types/domain";
import MotionLink from "./MotionLink";

// Design Ref: DESIGN.md 화면3(프로젝트 목록 화면) 우측 — 선택한 프로젝트의 요청 이력을
// 상태별(대기/분석중/확인요청/제안생성됨/승인됨/반려됨/실패) 목록으로 보여준다.
// Plan SC: PLAN.md 작업 14번 — 프로젝트별 요청 이력 화면(상태별 목록) 구현

export interface RequestHistoryItem {
  id: string;
  text: string;
  status: RequestStatus;
  createdAt: string;
}

/** DESIGN.md 5번 표와 같은 순서로 상태별 그룹을 보여준다 */
const STATUS_ORDER: RequestStatus[] = [
  "PENDING",
  "ANALYZING",
  "NEEDS_REVIEW",
  "PROPOSED",
  "APPROVED",
  "REJECTED",
  "FAILED",
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RequestHistoryByStatus({
  projectId,
  requests,
}: {
  projectId: string;
  requests: RequestHistoryItem[];
}) {
  if (requests.length === 0) {
    return (
      <section className="flex flex-col gap-2 border-2 border-black bg-white p-5 text-black">
        <h2 className="text-xs font-bold uppercase tracking-wide">요청 이력</h2>
        <p className="text-sm text-zinc-600">아직 제출한 요청이 없어요.</p>
      </section>
    );
  }

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: requests.filter((r) => r.status === status),
  })).filter((group) => group.items.length > 0);

  return (
    <section className="flex flex-col gap-6 border-2 border-black bg-white p-5 text-black">
      <h2 className="text-xs font-bold uppercase tracking-wide">요청 이력 ({requests.length}건)</h2>
      {grouped.map((group) => (
        <div key={group.status} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
                group.status === "NEEDS_REVIEW" || group.status === "FAILED" ? "bg-accent" : "bg-black"
              }`}
            >
              {REQUEST_STATUS_LABEL[group.status]}
            </span>
            <span className="text-xs text-zinc-500">{group.items.length}건</span>
          </div>
          <ul className="flex flex-col gap-3">
            {group.items.map((request) => (
              <li
                key={request.id}
                className="flex flex-col gap-1 border-t border-black/10 pt-3 first:border-t-0 first:pt-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-2 text-sm text-black">{request.text}</p>
                  <span className="shrink-0 text-xs text-zinc-500">{formatDateTime(request.createdAt)}</span>
                </div>
                <MotionLink
                  href={`/workspace/${projectId}/requests/${request.id}`}
                  className="w-fit text-xs font-bold text-black underline underline-offset-2 hover:text-accent"
                >
                  상세 보기
                </MotionLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
