import CornerMarks from "@/components/CornerMarks";
import ScrollHint from "@/components/ScrollHint";
import ScrollMotionField from "@/components/ScrollMotionField";
import SiteHeader from "@/components/SiteHeader";
import StartProjectForm from "@/components/StartProjectForm";

// Design Ref: virtual.plus-ex.com 레퍼런스 — 시작하기를 누르면 모션이 있는 별도 페이지로 이동하고,
// 스크롤을 내리는 동안 배경 모션이 끊기지 않고 이어진다(ScrollMotionField, 스크롤 위치에 따라 반응).
// 홈 화면(동심원 모티프)과 구분되도록 이 페이지는 "+" 패턴 필드로 다르게 만들었다.
// 스크롤을 내리면 프로젝트 생성 폼이 나오고, 완료하면 /workspace/[projectId]로 이동한다.

export default function StartPage() {
  return (
    <main className="relative text-white">
      <SiteHeader backHref="/" />
      <ScrollMotionField />

      <section className="relative z-10 flex min-h-screen flex-col items-start justify-end p-8">
        <CornerMarks tone="light" />
        <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">
          Let&apos;s Sort
          <br />
          Your Feedback
        </h1>
        <ScrollHint />
      </section>

      <section className="relative z-10 flex min-h-screen flex-col items-start justify-center p-8">
        <p className="max-w-xl text-2xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
          One project.
          <br />
          One focus.
          <br />
          Scroll down to begin.
        </p>
      </section>

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 p-8">
        <h2 className="text-2xl font-black uppercase tracking-tight">프로젝트 만들기</h2>
        <StartProjectForm />
      </section>
    </main>
  );
}
