import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Design Ref: DESIGN.md 4번(보안·데이터 처리) — 로그인 상태 확인용 서버 클라이언트.
// Plan SC: PLAN.md 작업 15번 — 서버 컴포넌트/라우트 핸들러에서 현재 로그인한 사용자를 확인할 때 쓴다.
// 데이터(프로젝트/요청/제안) 접근용 서비스 롤 클라이언트(src/lib/supabase.ts)와는 용도가 다르다 —
// 이 클라이언트는 anon 키 + 쿠키의 로그인 세션만 다루고, RLS를 우회하지 않는다.

/** 서버 컴포넌트에서 "지금 로그인한 사람이 있는지"만 간단히 확인할 때 쓴다 (없으면 게스트) */
export async function getServerAuthUserEmail(): Promise<string | null> {
  const supabase = await createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

/** 로그인한 사용자의 id (없으면 null=게스트). projects.owner_id와 비교해 "내 프로젝트"만 보여줄 때 쓴다 */
export async function getServerAuthUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function createSupabaseServerAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component에서는 쿠키를 쓸 수 없다 — proxy가 세션 갱신을 담당하므로 무시해도 된다.
          }
        },
      },
    }
  );
}
