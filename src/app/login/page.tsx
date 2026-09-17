import LoginForm from "@/components/LoginForm";
import SiteHeader from "@/components/SiteHeader";

// Design Ref: DESIGN.md 4번(보안·데이터 처리) — "1인 작업자 계정... 로그인만 확인"
// Plan SC: PLAN.md 작업 15번 — 최소 인증 적용. 이 화면 외에는 proxy.ts가 로그인 여부를 먼저 확인한다.
// 사용자 요청: 모든 페이지에 공통 상단 바(로고+이전으로)를 보이게 한다.

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black">
      <SiteHeader backHref="/" />
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
