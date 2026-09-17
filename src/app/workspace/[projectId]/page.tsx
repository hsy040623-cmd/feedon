import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getServerAuthUserEmail } from "@/lib/supabase-server-auth";
import ScrollMotionField from "@/components/ScrollMotionField";
import SiteHeader from "@/components/SiteHeader";
import RequestForm from "@/components/RequestForm";
import RequestHistoryList from "@/components/RequestHistoryList";
import MotionLink from "@/components/MotionLink";

// Design Ref: DESIGN.md 화면1 — /start에서 프로젝트를 만들고 나면 이 페이지로 이동해 수정 요청을 입력한다.
// /start와 같은 배경(ScrollMotionField)을 써서 두 페이지의 디자인을 통일한다.
export const dynamic = "force-dynamic";

export default async function WorkspacePage(props: PageProps<"/workspace/[projectId]">) {
  const { projectId } = await props.params;

  const supabase = createSupabaseServerClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .single();

  if (!project) notFound();

  // Plan SC: PLAN.md 작업 7번 — "확인 요청" 등 상태를 실제로 조회할 수 있게 최근 요청 이력을 함께 보여준다.
  const { data: requests } = await supabase
    .from("requests")
    .select("id, text, status, ambiguity_reason, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const requestSummaries = (requests ?? []).map((r) => ({
    id: r.id,
    text: r.text,
    status: r.status,
    ambiguityReason: r.ambiguity_reason,
    createdAt: r.created_at,
  }));
  const userEmail = await getServerAuthUserEmail();

  return (
    <div className="relative min-h-screen text-white">
      {/* 큰 십자가 오브젝트가 흰색 요청 폼과 겹쳐 가독성을 해쳐서, 이 페이지에서는 숨긴다 */}
      <ScrollMotionField showShape={false} />

      <SiteHeader
        backHref="/start"
        userEmail={userEmail}
        rightSlot={
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">{project.name}</span>
        }
      />

      <main className="relative z-10 mx-auto flex max-w-xl flex-col gap-8 px-6 py-12">
        <h1 className="text-3xl font-black uppercase leading-[0.95] tracking-tight text-white">
          클라이언트 수정 요청
        </h1>
        <RequestForm projectId={project.id} />
        <RequestHistoryList projectId={project.id} requests={requestSummaries} />
        <MotionLink
          href={`/projects/${project.id}`}
          className="w-fit text-sm font-bold text-white underline underline-offset-2 hover:text-accent"
        >
          전체 요청 이력 보기 (상태별)
        </MotionLink>
      </main>
    </div>
  );
}
