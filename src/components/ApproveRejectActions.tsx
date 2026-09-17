"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MotionButton from "./MotionButton";

// Design Ref: DESIGN.md 화면2(반영 제안 미리보기 화면) 하단 — "승인" / "반려" 버튼
// Plan SC: PLAN.md 작업 13번 — 승인/반려 처리 기능 구현. 처리 후에는 서버 컴포넌트(상세 화면)가
// 최신 상태를 다시 보여주도록 router.refresh()로 새로고침한다.

export default function ApproveRejectActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");

  const handleAction = async (action: "approve" | "reject") => {
    setPending(action);
    setError("");
    try {
      const res = await fetch(`/api/requests/${requestId}/${action}`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "처리에 실패했습니다.");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <MotionButton
          onPress={() => handleAction("approve")}
          disabled={pending !== null}
          className="flex-1 bg-black px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-accent disabled:opacity-40"
        >
          {pending === "approve" ? "승인 처리 중..." : "승인"}
        </MotionButton>
        <MotionButton
          onPress={() => handleAction("reject")}
          disabled={pending !== null}
          className="flex-1 border-2 border-black px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-black hover:bg-accent hover:text-white disabled:opacity-40"
        >
          {pending === "reject" ? "반려 처리 중..." : "반려"}
        </MotionButton>
      </div>
      {error && <p className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">{error}</p>}
    </div>
  );
}
