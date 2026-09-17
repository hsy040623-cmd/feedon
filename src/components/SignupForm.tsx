"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import MotionButton from "./MotionButton";

// Design Ref: 사용자 요청 — 로그인 화면에서 바로 계정을 만들 수 있는 회원가입 기능.
// 메일 발송이 막혀 있어도 쓸 수 있도록, Supabase 프로젝트의 "가입 시 이메일 인증" 설정을
// 꺼뒀다(mailer_autoconfirm) — signUp() 성공 시 바로 로그인 세션이 만들어진다.

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email.trim() || password.length < 8) {
      setError("이메일을 입력하고, 비밀번호는 8자 이상으로 입력하세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      router.push("/");
      router.refresh();
    } catch {
      setError("가입에 실패했습니다. 이미 사용 중인 이메일일 수 있어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 border-2 border-black bg-white p-5">
      <label htmlFor="signup-email" className="text-xs font-bold uppercase tracking-wide text-black">
        이메일
      </label>
      <input
        id="signup-email"
        type="email"
        className="border-2 border-black px-3 py-2 text-black"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="signup-password" className="text-xs font-bold uppercase tracking-wide text-black">
        비밀번호 (8자 이상)
      </label>
      <input
        id="signup-password"
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
        {submitting ? "가입 중..." : "회원가입"}
      </MotionButton>

      {error && <p className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">{error}</p>}
    </div>
  );
}
