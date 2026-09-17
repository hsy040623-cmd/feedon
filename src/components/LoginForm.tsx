"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import MotionButton from "./MotionButton";

// Design Ref: DESIGN.md 4번(보안·데이터 처리) — "1인 작업자 계정... Supabase의 기본 인증 기능으로 로그인만 확인"
// Plan SC: PLAN.md 작업 15번 — 최소 인증. 이메일+비밀번호 로그인과, 비밀번호를 잊었을 때
// Supabase의 재설정 메일을 요청하는 기능만 제공한다(회원가입 UI는 비범위).
// 다른 폼(RequestForm 등)과 마찬가지로 <form onSubmit> 대신 MotionButton의 onPress로 제출을 처리한다.

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력하세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    setResetMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push("/");
      router.refresh();
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError("비밀번호를 재설정하려면 이메일을 먼저 입력하세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    setResetMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
      });
      if (resetError) throw resetError;
      setResetMessage("비밀번호 재설정 메일을 보냈어요. 메일함을 확인하세요.");
    } catch {
      setError("재설정 메일을 보내지 못했습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 border-2 border-black bg-white p-5">
      <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wide text-black">
        이메일
      </label>
      <input
        id="login-email"
        type="email"
        className="border-2 border-black px-3 py-2 text-black"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wide text-black">
        비밀번호
      </label>
      <input
        id="login-password"
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
        {submitting ? "로그인 중..." : "로그인"}
      </MotionButton>

      <button
        type="button"
        onClick={handleResetPassword}
        disabled={submitting}
        className="w-fit text-xs font-bold text-black underline underline-offset-2 hover:text-accent disabled:opacity-40"
      >
        비밀번호를 잊으셨나요?
      </button>

      {error && <p className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">{error}</p>}
      {resetMessage && (
        <p className="w-fit rounded-full bg-black px-3 py-1 text-xs font-bold text-white">{resetMessage}</p>
      )}
    </div>
  );
}
