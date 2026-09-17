"use client";

import { createBrowserClient } from "@supabase/ssr";

// Design Ref: DESIGN.md 4번(보안·데이터 처리) — "1인 작업자 계정... Supabase의 기본 인증 기능으로 로그인만 확인"
// Plan SC: PLAN.md 작업 15번 — 로그인/로그아웃 등 인증 상태를 브라우저(클라이언트)에서 다루기 위한 클라이언트.
// service role 키가 아닌 공개 가능한 anon 키만 쓰므로, 클라이언트(브라우저) 코드에서 사용해도 안전하다.
// @supabase/ssr을 쓰면 세션이 쿠키에 저장돼, 서버(proxy.ts 등)에서도 같은 로그인 상태를 읽을 수 있다.

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
