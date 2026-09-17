"use client";

import { useState } from "react";

// Design Ref: DESIGN.md 화면1 상단 — 프로젝트(작업 건) 선택/생성 드롭다운
// Plan SC: PLAN.md 작업 3번 — 프로젝트(작업 건) 생성·선택 기능
// 선택된 프로젝트는 부모(Workspace)가 들고 있고, 이 컴포넌트는 표시·변경만 담당한다
// (요청 입력 폼이 같은 선택값을 함께 써야 하기 때문).

export interface ProjectOption {
  id: string;
  name: string;
}

export default function ProjectSelector({
  projects,
  selectedId,
  onSelect,
  onCreated,
}: {
  projects: ProjectOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreated: (projects: ProjectOption[], newId: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;

    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "프로젝트 생성에 실패했습니다.");

      const listRes = await fetch("/api/projects");
      const listJson = await listRes.json();
      if (!listRes.ok) throw new Error(listJson.error?.message ?? "프로젝트 목록을 불러오지 못했습니다.");

      onCreated(listJson.data as ProjectOption[], json.data.id);
      setNewName("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="flex flex-col gap-3 border-2 border-black p-5 dark:border-white">
      <label
        htmlFor="project-select"
        className="text-xs font-bold uppercase tracking-wide text-black dark:text-zinc-50"
      >
        프로젝트(작업 건)
      </label>

      <select
        id="project-select"
        className="border-2 border-black px-3 py-2 text-black dark:border-white dark:bg-black dark:text-zinc-50"
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        disabled={projects.length === 0}
      >
        {projects.length === 0 && <option value="">아직 프로젝트가 없습니다</option>}
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="flex-1 border-2 border-black px-3 py-2 text-black dark:border-white dark:bg-black dark:text-zinc-50"
          placeholder="새 프로젝트 이름"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="button"
          className="whitespace-nowrap bg-black px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-accent disabled:opacity-40 dark:bg-white dark:text-black"
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
        >
          {creating ? "만드는 중..." : "새 프로젝트 만들기"}
        </button>
      </div>

      {error && (
        <p className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">{error}</p>
      )}
    </section>
  );
}
