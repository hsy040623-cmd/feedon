import { createClient } from "@supabase/supabase-js";

// Design Ref: DESIGN.md 4번(보안·데이터 처리) — Storage/DB는 서버에서만 접근
// 서비스 롤 키를 쓰는 클라이언트이므로, 절대 클라이언트(브라우저) 코드에서 import하지 않는다.

/** 서버 전용 Supabase 클라이언트 — API 라우트에서만 사용한다 */
export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase 환경변수가 없습니다. .env의 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY를 확인하세요."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
