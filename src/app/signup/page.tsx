import SignupForm from "@/components/SignupForm";
import SiteHeader from "@/components/SiteHeader";

// Design Ref: 사용자 요청 — 로그인 화면의 "회원가입" 버튼이 이동하는 계정 생성 화면.
// 사용자 요청: 모든 페이지에 공통 상단 바(로고+이전으로)를 보이게 한다.

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-black">
      <SiteHeader backHref="/login" />
      <div className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
