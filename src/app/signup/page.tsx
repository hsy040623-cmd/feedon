import SignupForm from "@/components/SignupForm";

// Design Ref: 사용자 요청 — 로그인 화면의 "회원가입" 버튼이 이동하는 계정 생성 화면.

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-center text-2xl font-black uppercase tracking-tight text-white">
          <span className="text-accent">+</span> FEEDON
        </h1>
        <SignupForm />
      </div>
    </div>
  );
}
