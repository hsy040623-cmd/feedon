import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Design Ref: 사용자 요청 — "로그인 안 해도 자유롭게 쓸 수 있게" 앱 전체를 공개로 열어두고,
// 로그인은 선택 사항(우측 상단 버튼)으로만 제공한다. PLAN.md 15번에서 만든 "전체 화면 강제 로그인"은
// 여기서 걷어내고, 로그인 세션 쿠키를 최신 상태로 갱신하는 역할만 남긴다.
// (이 Next.js 버전은 middleware.ts가 proxy.ts로 이름이 바뀌었다 — node_modules/next/dist/docs 확인함)

// 이미 로그인한 사람이 다시 들어가면 "/"로 돌려보내는 경로 (로그인/회원가입 화면)
const LOGGED_OUT_ONLY_PATHS = ["/login", "/signup"];

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
  // (로그인 상태를 화면에 반영하기 위한 용도일 뿐, 여기서 접근을 막지는 않는다)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const loggedOutOnly = matchesPath(pathname, LOGGED_OUT_ONLY_PATHS);

  if (user && loggedOutOnly) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
