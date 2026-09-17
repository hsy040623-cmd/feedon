import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getServerAuthUserId } from "@/lib/supabase-server-auth";
import {
  GUEST_PROJECT_IDS_COOKIE,
  appendGuestProjectId,
  fetchVisibleProjects,
  getGuestProjectIds,
} from "@/lib/project-visibility";

// Design Ref: DESIGN.md 6번(API 명세) — GET/POST /api/projects
// Plan SC: PLAN.md 작업 3번 — 프로젝트(작업 건) 생성·선택 기능
// Design Ref: CHECK.md 1번(치명적) — 전체 프로젝트 열람 차단. GET은 항상 "내 프로젝트"만 돌려준다
// (로그인 시 owner_id, 게스트는 쿠키에 저장된 id 목록 기준) — src/lib/project-visibility.ts 참고.

/** 로그인했으면 내가 만든 프로젝트, 게스트면 이 브라우저에서 만든 프로젝트만 조회 (최신순) */
export async function GET() {
  const projects = await fetchVisibleProjects();
  return NextResponse.json({ data: projects });
}

/** 프로젝트(작업 건) 생성 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: { code: "INVALID_NAME", message: "프로젝트 이름을 입력하세요." } },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();
  const ownerId = await getServerAuthUserId();

  const { data, error } = await supabase
    .from("projects")
    .insert({ name, owner_id: ownerId })
    .select("id, name, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "PROJECT_CREATE_FAILED", message: error.message } },
      { status: 500 }
    );
  }

  const response = NextResponse.json(
    { data: { id: data.id, name: data.name, createdAt: data.created_at } },
    { status: 201 }
  );

  // 게스트도(로그인 사용자도 겸사겸사) 이 브라우저가 만든 프로젝트 id를 쿠키에 남겨서, 다음에 다시
  // 들어와도 "내 프로젝트" 목록에서 보이게 한다. 1년 유지, 이 값만으로는 아무것도 할 수 없는(단순 id
  // 목록) 정보라 httpOnly로 막아둔다.
  const guestIds = await getGuestProjectIds();
  response.cookies.set(GUEST_PROJECT_IDS_COOKIE, appendGuestProjectId(guestIds, data.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return response;
}
