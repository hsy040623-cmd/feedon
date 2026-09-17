import { createSupabaseServerAuthClient } from "@/lib/supabase-server-auth";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import SiteHeader from "@/components/SiteHeader";

// Design Ref: DESIGN.md 4번(보안·데이터 처리) — 비밀번호 재설정 화면
// Plan SC: PLAN.md 작업 15번 — 최소 인증. /auth/confirm을 거쳐 들어왔는지(로그인 세션이 있는지)를
// 서버에서 먼저 확인한 뒤 폼에 전달한다.
// 사용자 요청: 모든 페이지에 공통 상단 바(로고+이전으로)를 보이게 한다.
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-black">
      <SiteHeader backHref="/login" />
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <ResetPasswordForm hasSession={!!user} />
        </div>
      </div>
    </div>
  );
}
