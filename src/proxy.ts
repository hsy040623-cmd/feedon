import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Design Ref: DESIGN.md 4번(보안·데이터 처리) — "1인 작업자 계정... Supabase의 기본 인증 기능으로 로그인만 확인"
// Plan SC: PLAN.md 작업 15번 — 최소 인증 적용. /login을 빼고는 모든 화면·API 요청을 이 Proxy에서
// 먼저 확인해서, 로그인하지 않았으면 화면은 /login으로 보내고 API는 401을 돌려준다.
// (이 Next.js 버전은 middleware.ts가 proxy.ts로 이름이 바뀌었다 — node_modules/next/dist/docs 확인함)

// 로그인 여부와 상관없이 항상 들어갈 수 있는 경로 (초대/비밀번호 재설정 흐름 포함)
const ALWAYS_ALLOWED_PATHS = ["/auth/confirm", "/reset-password"];
// 로그인 안 했을 때만 허용하고, 이미 로그인했으면 "/"로 돌려보내는 경로
const LOGGED_OUT_ONLY_PATHS = ["/login"];

function matchesPath(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getSession()이 아닌 getUser()를 쓴다 — 쿠키 값만 믿지 않고 Supabase Auth 서버에 다시 확인한다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const alwaysAllowed = matchesPath(pathname, ALWAYS_ALLOWED_PATHS);
  const loggedOutOnly = matchesPath(pathname, LOGGED_OUT_ONLY_PATHS);

  if (alwaysAllowed) {
    return response;
  }

  if (!user && !loggedOutOnly) {
    if (isApi) {
      return NextResponse.json(
        { error: { code: "UNAUTHENTICATED", message: "로그인이 필요합니다." } },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && loggedOutOnly) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
