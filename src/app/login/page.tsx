import LoginForm from "@/components/LoginForm";

// Design Ref: DESIGN.md 4번(보안·데이터 처리) — "1인 작업자 계정... 로그인만 확인"
// Plan SC: PLAN.md 작업 15번 — 최소 인증 적용. 이 화면 외에는 proxy.ts가 로그인 여부를 먼저 확인한다.

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-center text-2xl font-black uppercase tracking-tight text-white">
          <span className="text-accent">+</span> FEEDON
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
