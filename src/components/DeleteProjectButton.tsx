"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Design Ref: 사용자 요청 — 프로젝트 목록에서 각 프로젝트를 바로 삭제할 수 있는 아이콘 버튼.
// 삭제는 되돌릴 수 없어서(대상 파일·요청 이력까지 모두 사라짐) 클릭 시 한 번 확인한다.
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
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;
    const confirmed = window.confirm(
      `"${projectName}" 프로젝트를 삭제할까요? 이 프로젝트의 모든 요청·파일이 함께 삭제되며 되돌릴 수 없어요.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제에 실패했습니다.");
      if (isActive) {
        router.push("/projects");
      }
      router.refresh();
    } catch {
      window.alert("프로젝트를 삭제하지 못했습니다. 잠시 후 다시 시도하세요.");
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      aria-label={`${projectName} 프로젝트 삭제`}
      className="shrink-0 rounded px-2 py-1 text-sm font-bold text-zinc-400 hover:bg-accent hover:text-white disabled:opacity-40"
    >
      ✕
    </button>
  );
}
