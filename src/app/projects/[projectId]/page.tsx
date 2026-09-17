import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getServerAuthUserEmail } from "@/lib/supabase-server-auth";
import { fetchVisibleProjects } from "@/lib/project-visibility";
import ScrollMotionField from "@/components/ScrollMotionField";
import SiteHeader from "@/components/SiteHeader";
import ProjectListPanel from "@/components/ProjectListPanel";
import RequestHistoryByStatus from "@/components/RequestHistoryByStatus";
import MotionLink from "@/components/MotionLink";

// Design Ref: DESIGN.md 화면3(프로젝트 목록 화면) — 좌측 프로젝트 목록, 우측 선택한 프로젝트의
// 요청 이력을 상태별로 보여준다.
// Plan SC: PLAN.md 작업 14번 — 프로젝트별 요청 이력 화면(상태별 목록) 구현
// Design Ref: CHECK.md 1번 — 좌측 목록은 "내(로그인 시)/이 브라우저(게스트)" 프로젝트만 보여준다.
// 다만 지금 보고 있는 프로젝트 자체는 링크를 아는 사람이면 목록에 없어도 계속 열람할 수 있어야 하므로
// (직접 링크 접근 모델), activeProject는 목록과 별개로 id로 직접 조회한다.
export const dynamic = "force-dynamic";

export default async function ProjectHistoryPage(props: PageProps<"/projects/[projectId]">) {
  const { projectId } = await props.params;

  const supabase = createSupabaseServerClient();

  const [projects, activeProjectResult] = await Promise.all([
    fetchVisibleProjects(),
    supabase.from("projects").select("id, name, created_at").eq("id", projectId).single(),
  ]);

  if (!activeProjectResult.data) notFound();
  const activeProject = {
    id: activeProjectResult.data.id,
    name: activeProjectResult.data.name,
    createdAt: activeProjectResult.data.created_at,
  };

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
  const userEmail = await getServerAuthUserEmail();

  return (
    <div className="relative min-h-screen text-white">
      <ScrollMotionField showShape={false} />
      <SiteHeader
        backHref="/"
        userEmail={userEmail}
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
