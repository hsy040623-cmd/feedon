import type { ReactNode } from "react";
import MotionLink from "./MotionLink";
import LogoutButton from "./LogoutButton";

// 모든 페이지 공통 상단 바. "+ FEEDON"은 항상 홈("/")으로 이동하는 링크이고,
// 홈이 아닌 페이지에서는 그 아래(구분되게 더 작고 흐리게) "이전으로" 화살표 링크를 추가로 보여준다.
// 두 링크 모두 MotionLink를 써서, 클릭하면 살짝 눌렸다가 이동한다.
// SiteHeader는 proxy.ts가 로그인을 확인한 화면에서만 쓰이므로(로그인 화면 제외), 로그아웃 버튼을 항상 보여준다.

export default function SiteHeader({
  backHref,
  rightSlot,
}: {
  /** 지정하면 로고 아래에 "이전으로" 링크가 나타난다. 홈 화면에서는 생략한다. */
  backHref?: string;
  rightSlot?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-black bg-black px-6 py-4">
      <div className="flex items-center justify-between">
        <MotionLink
          href="/"
          className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-white hover:text-accent"
        >
          <span aria-hidden className="text-accent">
            +
          </span>
          FEEDON
        </MotionLink>
        <div className="flex items-center gap-3">
          {rightSlot}
          <LogoutButton />
        </div>
      </div>

      {backHref && (
        <MotionLink
          href={backHref}
          aria-label="이전으로"
          className="mt-2 flex items-center text-sm font-bold text-white/60 hover:text-accent"
        >
          ←
        </MotionLink>
      )}
    </header>
  );
}
