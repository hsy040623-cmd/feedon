import { createSupabaseServerAuthClient } from "@/lib/supabase-server-auth";
import ResetPasswordForm from "@/components/ResetPasswordForm";

// Design Ref: DESIGN.md 4번(보안·데이터 처리) — 비밀번호 재설정 화면
// Plan SC: PLAN.md 작업 15번 — 최소 인증. /auth/confirm을 거쳐 들어왔는지(로그인 세션이 있는지)를
// 서버에서 먼저 확인한 뒤 폼에 전달한다.
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-center text-2xl font-black uppercase tracking-tight text-white">
          <span className="text-accent">+</span> FEEDON
        </h1>
        <ResetPasswordForm hasSession={!!user} />
      </div>
    </div>
  );
}
