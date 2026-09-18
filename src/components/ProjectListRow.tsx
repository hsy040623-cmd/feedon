"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MotionLink from "./MotionLink";
import DeleteProjectButton from "./DeleteProjectButton";

// Design Ref: 사용자 요청 — 프로젝트 이름을 나중에 바꿀 수 있어야 한다.
// 목록 한 줄을 통째로 담당하는 이유: 이름을 고치는 동안에는 링크·삭제 버튼을 감추고 그 자리에
// 입력창을 띄워야 해서, 세 요소가 같은 상태(editing)를 공유해야 한다. 사이드바가 좁아서
// 링크와 입력창을 나란히 두면 둘 다 못 쓸 정도로 눌린다.
// 이름 변경 확인은 삭제 버튼과 같은 방식(버튼 자리를 바꿔 처리)을 쓴다 — window.prompt는
// 브라우저·환경에 따라 아예 안 뜨는 경우가 있어서 쓰지 않는다.

export default function ProjectListRow({
  projectId,
  projectName,
  isActive,
}: {
  projectId: string;
  projectName: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(projectName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const startEditing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(false);
    setName(projectName);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError(false);
  };

  const save = async () => {
    if (saving) return;
    const trimmed = name.trim();
    // 빈 이름이거나 바뀐 게 없으면 굳이 서버를 부르지 않는다
    if (!trimmed || trimmed === projectName) {
      cancelEditing();
      return;
    }

    setSaving(true);
    setError(false);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error("이름 변경에 실패했습니다.");
      setEditing(false);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <li>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="flex items-center gap-1"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelEditing();
            }}
            disabled={saving}
            aria-label="새 프로젝트 이름"
            className="min-w-0 flex-1 rounded border-2 border-black px-2 py-1 text-sm font-bold text-black disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={saving}
            className="shrink-0 rounded bg-black px-2 py-1 text-[11px] font-bold text-white disabled:opacity-40"
          >
            {saving ? "..." : "저장"}
          </button>
          <button
            type="button"
            onClick={cancelEditing}
            disabled={saving}
            className="shrink-0 rounded px-1 py-1 text-[11px] font-bold text-zinc-500 hover:bg-zinc-100 disabled:opacity-40"
          >
            취소
          </button>
        </form>
        {error && <p className="px-1 pt-1 text-[11px] font-bold text-accent">이름 변경에 실패했어요.</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-1">
      <MotionLink
        href={`/projects/${projectId}`}
        className={`block flex-1 truncate rounded px-3 py-2 text-sm font-bold ${
          isActive ? "bg-black text-white" : "text-black hover:bg-zinc-100"
        }`}
      >
        {projectName}
      </MotionLink>
      <button
        type="button"
        onClick={startEditing}
        aria-label={`${projectName} 프로젝트 이름 변경`}
        title="이름 변경"
        className="shrink-0 rounded px-2 py-1 text-sm font-bold text-zinc-400 hover:bg-black hover:text-white"
      >
        ✎
      </button>
      <DeleteProjectButton projectId={projectId} projectName={projectName} isActive={isActive} />
    </li>
  );
}
