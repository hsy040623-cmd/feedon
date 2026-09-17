"use client";

import { useState } from "react";
import Workspace from "./Workspace";
import type { ProjectOption } from "./ProjectSelector";

// Design Ref: plus-ex.com의 고정 사이드 탭("W. Honors")에서 착안 — 오른쪽 고정 탭을 누르면
// 프로젝트 생성/요청 입력 작업 패널이 옆에서 슬라이드로 열리는 형태.

export default function WorkspaceDrawer({ initialProjects }: { initialProjects: ProjectOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="workspace-panel"
        className="fixed right-0 top-1/2 z-50 -translate-y-1/2 border-2 border-black bg-black px-3 py-6 text-sm font-bold uppercase tracking-wide text-white [writing-mode:vertical-rl] transition-colors hover:bg-accent dark:border-white"
      >
        {open ? "닫기" : "+ 시작하기"}
      </button>

      {open && (
        <button
          type="button"
          aria-label="작업 패널 닫기"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/50"
        />
      )}

      <div
        id="workspace-panel"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-40 h-full w-full max-w-md transform overflow-y-auto border-l-2 border-black bg-white p-6 pt-20 transition-transform duration-300 ease-out dark:border-white dark:bg-black ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Workspace initialProjects={initialProjects} />
      </div>
    </>
  );
}
