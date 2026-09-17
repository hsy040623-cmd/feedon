"use client";

import { useState } from "react";
import ProjectSelector, { type ProjectOption } from "./ProjectSelector";
import RequestForm from "./RequestForm";

// Design Ref: DESIGN.md 화면1(요청 입력 화면) — 프로젝트 선택과 요청 입력 폼이 같은 선택값을 공유해야 해서
// 두 컴포넌트를 묶어 상태(선택된 프로젝트)를 이 컴포넌트가 들고 있는다.

export default function Workspace({ initialProjects }: { initialProjects: ProjectOption[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedId, setSelectedId] = useState(initialProjects[0]?.id ?? "");

  return (
    <>
      <ProjectSelector
        projects={projects}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreated={(list, newId) => {
          setProjects(list);
          setSelectedId(newId);
        }}
      />
      <RequestForm projectId={selectedId} />
    </>
  );
}
