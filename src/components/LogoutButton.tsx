"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

// Design Ref: DESIGN.md 4번(보안·데이터 처리) — "로그인만 확인"하는 최소 인증의 짝인 로그아웃.
// Plan SC: PLAN.md 작업 15번 — SiteHeader 어디서나 로그아웃할 수 있게 한다.

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-xs font-bold text-white/60 hover:text-accent"
    >
      로그아웃
    </button>
  );
}
