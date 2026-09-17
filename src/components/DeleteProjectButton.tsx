"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Design Ref: 사용자 요청 — 프로젝트 목록에서 각 프로젝트를 바로 삭제할 수 있는 아이콘 버튼.
// 삭제는 되돌릴 수 없어서(대상 파일·요청 이력까지 모두 사라짐) 한 번 더 확인한다.
// window.confirm()은 브라우저·환경에 따라 억제되거나 무시될 수 있어(실제로 삭제가 전혀 안 되는
// 원인이었다), 네이티브 다이얼로그 대신 버튼 자체를 "정말요? 예/아니오"로 바꾸는 방식으로 확인한다.
// 지금 보고 있는 프로젝트를 지우면 그 화면이 더 이상 존재하지 않으므로 /projects로 이동시킨다.

export default function DeleteProjectButton({
  projectId,
  projectName,
  isActive,
}: {
  projectId: string;
  projectName: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  const handleConfirmClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(false);
    setConfirming(true);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;

    setDeleting(true);
    setError(false);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제에 실패했습니다.");
      if (isActive) {
        router.push("/projects");
      }
      router.refresh();
    } catch {
      setError(true);
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1 text-xs font-bold">
        <span className="text-zinc-500">삭제할까요?</span>
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={deleting}
          className="rounded bg-accent px-2 py-1 text-white disabled:opacity-40"
        >
          {deleting ? "삭제 중..." : "예"}
        </button>
        <button
          type="button"
          onClick={handleCancelClick}
          disabled={deleting}
          className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
        >
          아니오
        </button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {error && <span className="text-[11px] font-bold text-accent">삭제 실패</span>}
      <button
        type="button"
        onClick={handleConfirmClick}
        aria-label={`${projectName} 프로젝트 삭제`}
        className="rounded px-2 py-1 text-sm font-bold text-zinc-400 hover:bg-accent hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
