import MotionLink from "./MotionLink";
import ProjectListRow from "./ProjectListRow";

// Design Ref: DESIGN.md 화면3(프로젝트 목록 화면) 좌측 — 프로젝트(클라이언트별 작업 건) 목록
// Plan SC: PLAN.md 작업 14번 — 프로젝트별 요청 이력 화면(상태별 목록) 구현
// 사용자 요청: 각 프로젝트 옆에 이름 변경(✎)·삭제(✕) 아이콘을 둬서 바로 처리할 수 있게 한다.
// 한 줄의 링크·이름 변경·삭제는 같은 상태를 공유해야 해서 ProjectListRow(클라이언트)로 묶어뒀다.

export interface ProjectListItem {
  id: string;
  name: string;
  createdAt: string;
}

export default function ProjectListPanel({
  projects,
  activeProjectId,
}: {
  projects: ProjectListItem[];
  activeProjectId?: string;
}) {
  return (
    <section className="flex flex-col gap-3 border-2 border-black bg-white p-5 text-black sm:w-64 sm:shrink-0">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wide">프로젝트</h2>
        <MotionLink
          href="/start"
          className="w-fit rounded-full bg-black px-3 py-1 text-[11px] font-bold text-white hover:bg-accent"
        >
          + 새 프로젝트
        </MotionLink>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-zinc-600">아직 만든 프로젝트가 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {projects.map((project) => (
            <ProjectListRow
              key={project.id}
              projectId={project.id}
              projectName={project.name}
              isActive={project.id === activeProjectId}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
