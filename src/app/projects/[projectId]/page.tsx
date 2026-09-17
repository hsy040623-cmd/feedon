import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import ScrollMotionField from "@/components/ScrollMotionField";
import SiteHeader from "@/components/SiteHeader";
import ProjectListPanel from "@/components/ProjectListPanel";
import RequestHistoryByStatus from "@/components/RequestHistoryByStatus";
import MotionLink from "@/components/MotionLink";

// Design Ref: DESIGN.md 화면3(프로젝트 목록 화면) — 좌측 프로젝트 목록, 우측 선택한 프로젝트의
// 요청 이력을 상태별로 보여준다.
// Plan SC: PLAN.md 작업 14번 — 프로젝트별 요청 이력 화면(상태별 목록) 구현
export const dynamic = "force-dynamic";

export default async function ProjectHistoryPage(props: PageProps<"/projects/[projectId]">) {
  const { projectId } = await props.params;

  const supabase = createSupabaseServerClient();

  const { data: projectsData } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });
  const projects = (projectsData ?? []).map((p) => ({ id: p.id, name: p.name, createdAt: p.created_at }));

  const activeProject = projects.find((p) => p.id === projectId);
  if (!activeProject) notFound();

  const { data: requestsData } = await supabase
    .from("requests")
    .select("id, text, status, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const requests = (requestsData ?? []).map((r) => ({
    id: r.id,
    text: r.text,
    status: r.status,
    createdAt: r.created_at,
  }));

  return (
    <div className="relative min-h-screen text-white">
      <ScrollMotionField showShape={false} />
      <SiteHeader
        backHref="/"
        rightSlot={
          <MotionLink
            href={`/workspace/${activeProject.id}`}
            className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-white hover:opacity-80"
          >
            수정 요청 입력하기
          </MotionLink>
        }
      />
      <main className="relative z-10 mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-start">
        <ProjectListPanel projects={projects} activeProjectId={activeProject.id} />
        <div className="flex flex-1 flex-col gap-6">
          <h1 className="text-2xl font-black uppercase leading-[0.95] tracking-tight text-white">
            {activeProject.name}
          </h1>
          <RequestHistoryByStatus projectId={activeProject.id} requests={requests} />
        </div>
      </main>
    </div>
  );
}
