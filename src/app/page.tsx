import { createSupabaseServerClient } from "@/lib/supabase";
import { getServerAuthUserEmail } from "@/lib/supabase-server-auth";
import AnimatedBackground from "@/components/AnimatedBackground";
import SiteHeader from "@/components/SiteHeader";
import MotionLink from "@/components/MotionLink";

// Design Ref: DESIGN.md 화면1 — 히어로에서 "+ 시작하기"를 누르면 /start(모션 온보딩)로 이동한다.
// plus-ex.com 레퍼런스: 진입 시 눈에 띄는 모션 배경 히어로 + 오른쪽 고정 탭
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .order("created_at", { ascending: false });

  const projects = data ?? [];
  const userEmail = await getServerAuthUserEmail();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SiteHeader
        userEmail={userEmail}
        rightSlot={
          <MotionLink
            href="/projects"
            className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-white hover:opacity-80"
          >
            {projects.length}개 프로젝트
          </MotionLink>
        }
      />

      <section className="relative flex min-h-[80vh] items-end overflow-hidden bg-black pb-16">
        <AnimatedBackground />
        <h1 className="relative z-10 px-6 text-4xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
          Feedback
          <br />
          Reflection
          <br />
          Assistant
        </h1>
      </section>

      <MotionLink
        href="/start"
        className="fixed right-0 top-1/2 z-50 -translate-y-1/2 border-2 border-black bg-black px-3 py-6 text-sm font-bold uppercase tracking-wide text-white [writing-mode:vertical-rl] hover:bg-accent dark:border-white"
      >
        + 시작하기
      </MotionLink>
    </div>
  );
}
