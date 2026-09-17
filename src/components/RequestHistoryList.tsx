import { REQUEST_STATUS_LABEL } from "@/lib/request-status";
import type { RequestStatus } from "@/types/domain";
import MotionLink from "./MotionLink";

// Design Ref: DESIGN.md 화면3(프로젝트 목록) 일부를 앞당겨, 워크스페이스 화면에서
// 이 프로젝트의 최근 요청과 상태를 조회할 수 있게 한다. "확인 요청" 상태는 모호한 이유를 함께 보여준다.
// Plan SC: PLAN.md 작업 7번 — 모호/상충 요청을 사용자가 실제로 확인할 수 있게 하는 최소 범위.
// Plan SC: PLAN.md 작업 12번 — 각 요청에서 반영 제안 미리보기 화면(화면2)으로 이동할 수 있게 링크를 추가한다.
// 프로젝트 목록·전체 이력 화면 자체(화면3 전체)는 14번 작업에서 만든다.

export interface RequestSummary {
  id: string;
  text: string;
  status: RequestStatus;
  ambiguityReason: string | null;
  createdAt: string;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RequestHistoryList({
  projectId,
  requests,
}: {
  projectId: string;
  requests: RequestSummary[];
}) {
  if (requests.length === 0) {
    return (
      <section className="flex flex-col gap-2 border-2 border-black bg-white p-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-black">최근 요청</h2>
        <p className="text-sm text-zinc-600">아직 제출한 요청이 없어요.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 border-2 border-black bg-white p-5">
      <h2 className="text-xs font-bold uppercase tracking-wide text-black">최근 요청</h2>
      <ul className="flex flex-col gap-3">
        {requests.map((request) => (
          <li key={request.id} className="flex flex-col gap-1 border-t border-black/10 pt-3 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-bold text-white ${
                  request.status === "NEEDS_REVIEW" ? "bg-accent" : "bg-black"
                }`}
              >
                {REQUEST_STATUS_LABEL[request.status]}
              </span>
              <span className="text-xs text-zinc-500">{formatDateTime(request.createdAt)}</span>
            </div>
            <p className="line-clamp-2 text-sm text-black">{request.text}</p>
            {request.status === "NEEDS_REVIEW" && request.ambiguityReason && (
              <p className="text-xs font-medium text-accent">확인 필요: {request.ambiguityReason}</p>
            )}
            <MotionLink
              href={`/workspace/${projectId}/requests/${request.id}`}
              className="w-fit text-xs font-bold text-black underline underline-offset-2 hover:text-accent"
            >
              상세 보기
            </MotionLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
