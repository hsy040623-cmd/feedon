import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Design Ref: DESIGN.md 6번(API 명세) — GET/POST /api/projects
// Plan SC: PLAN.md 작업 3번 — 프로젝트(작업 건) 생성·선택 기능

/** 프로젝트 목록 조회 (최신순) */
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: "PROJECTS_LIST_FAILED", message: error.message } },
      { status: 500 }
    );
  }

  const projects = data.map((p) => ({ id: p.id, name: p.name, createdAt: p.created_at }));
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
  const { data, error } = await supabase
    .from("projects")
    .insert({ name })
    .select("id, name, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "PROJECT_CREATE_FAILED", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { data: { id: data.id, name: data.name, createdAt: data.created_at } },
    { status: 201 }
  );
}
