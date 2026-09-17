import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import ScrollMotionField from "@/components/ScrollMotionField";
import SiteHeader from "@/components/SiteHeader";
import ProjectListPanel from "@/components/ProjectListPanel";

// Design Ref: DESIGN.md 화면3(프로젝트 목록 화면) — 프로젝트를 아직 선택하지 않았을 때 진입하는 경로.
// 프로젝트가 있으면 가장 최근 프로젝트로 이동하고, 없으면 안내와 함께 새 프로젝트 만들기로 유도한다.
// Plan SC: PLAN.md 작업 14번 — 프로젝트별 요청 이력 화면(상태별 목록) 구현
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  const projects = (data ?? []).map((p) => ({ id: p.id, name: p.name, createdAt: p.created_at }));

  if (projects.length > 0) {
    redirect(`/projects/${projects[0].id}`);
  }

  return (
    <div className="relative min-h-screen text-white">
      <ScrollMotionField showShape={false} />
      <SiteHeader backHref="/" />
      <main className="relative z-10 mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12 sm:flex-row">
        <ProjectListPanel projects={projects} />
        <section className="flex flex-1 flex-col gap-2 border-2 border-black bg-white p-5 text-black">
          <h2 className="text-xs font-bold uppercase tracking-wide">요청 이력</h2>
          <p className="text-sm text-zinc-600">
            아직 프로젝트가 없어요. 왼쪽의 &ldquo;+ 새 프로젝트&rdquo;로 먼저 프로젝트를 만들어보세요.
          </p>
        </section>
      </main>
    </div>
  );
}
