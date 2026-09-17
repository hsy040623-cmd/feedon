import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { canModifyProject } from "@/lib/project-visibility";

// Design Ref: DESIGN.md 6번(API 명세) — POST /api/requests/:id/approve, 화면2(반영 제안 미리보기)의 "승인" 버튼
// Plan SC: PLAN.md 작업 13번 — 승인 시 제안 파일이 최종 산출물로 확정된다 (원본은 그대로, 제안 파일은 이미 Storage에
// 저장돼 있으므로 상태만 APPROVED로 바꾸면 화면2에서 바로 "최종 파일"로 다운로드할 수 있게 된다).
// Design Ref: CHECK.md 2번(치명적) — 이 요청이 속한 프로젝트의 소유자(로그인)나 만든 브라우저(게스트
// 쿠키)가 아니면 승인을 막는다.

export async function POST(
  _request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await context.params;
  const supabase = createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("requests")
    .select("id, status, project_id, projects(owner_id)")
    .eq("id", requestId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: { code: "REQUEST_NOT_FOUND", message: "요청을 찾을 수 없습니다." } },
      { status: 404 }
    );
  }

  const projectOwnerId = (existing.projects as unknown as { owner_id: string | null } | null)?.owner_id ?? null;
  if (!(await canModifyProject(existing.project_id, projectOwnerId))) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "이 요청을 승인할 권한이 없습니다." } },
      { status: 403 }
    );
  }

  if (existing.status !== "PROPOSED") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_STATUS",
          message: "반영 제안이 생성된 상태(제안 생성됨)에서만 승인할 수 있습니다.",
        },
      },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("requests")
    .update({ status: "APPROVED" })
    .eq("id", requestId);

  if (updateError) {
    return NextResponse.json(
      { error: { code: "APPROVE_FAILED", message: updateError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { id: requestId, status: "APPROVED" } });
}
