"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import MotionButton from "./MotionButton";

// Design Ref: DESIGN.md 4번(보안·데이터 처리) — Supabase 기본 인증으로 비밀번호를 재설정하는 화면.
// Plan SC: PLAN.md 작업 15번 — 최소 인증. /auth/confirm에서 만들어진 임시 로그인 세션으로
// 비밀번호만 바꾸고, 이후에는 이 비밀번호로 /login에서 로그인한다.
// 세션 여부는 서버 컴포넌트(page.tsx)에서 미리 확인해 prop으로 받는다
// (마운트 후 useEffect+setState로 다시 확인하면 react-hooks/set-state-in-effect 규칙에 걸린다).

export default function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.push("/");
      router.refresh();
    } catch {
      setError("비밀번호를 바꾸지 못했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasSession) {
    return (
      <div className="flex flex-col gap-3 border-2 border-black bg-white p-5 text-black">
        <p className="text-sm">
          재설정 링크가 만료됐거나 잘못됐어요. 로그인 화면에서 &ldquo;비밀번호를 잊으셨나요?&rdquo;로 다시
          요청하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border-2 border-black bg-white p-5">
      <label htmlFor="new-password" className="text-xs font-bold uppercase tracking-wide text-black">
        새 비밀번호 (8자 이상)
      </label>
      <input
        id="new-password"
        type="password"
        className="border-2 border-black px-3 py-2 text-black"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <MotionButton
        onPress={handleSubmit}
        disabled={submitting}
        className="bg-black px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-accent disabled:opacity-40"
      >
        {submitting ? "저장 중..." : "비밀번호 저장"}
      </MotionButton>

      {error && <p className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">{error}</p>}
    </div>
  );
}
