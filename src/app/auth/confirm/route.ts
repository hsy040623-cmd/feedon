import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerAuthClient } from "@/lib/supabase-server-auth";

// Design Ref: DESIGN.md 4번(보안·데이터 처리) — Supabase 기본 인증(초대/비밀번호 재설정) 확인 링크를 받는 경로.
// Plan SC: PLAN.md 작업 15번 — 최소 인증. 초대 메일·비밀번호 재설정 메일의 링크가 이 경로로 들어오면
// Supabase에 토큰을 확인시켜 로그인 세션을 만든 뒤, next(기본 "/")로 보낸다.

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (tokenHash && type) {
    const supabase = await createSupabaseServerAuthClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
