import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { canModifyProject } from "@/lib/project-visibility";

// Design Ref: DESIGN.md 6번(API 명세) — POST /api/requests/:id/reject, 화면2(반영 제안 미리보기)의 "반려" 버튼
// Plan SC: PLAN.md 작업 13번 — 반려 시 제안 파일만 Storage에서 폐기하고, 요청 이력(메타데이터)은 그대로 남긴다.
// CLAUDE.md 핵심 동작 원칙 3번: 반려된 제안은 별도 사유 기록 없이 처리를 종료한다.
// Design Ref: CHECK.md 2번(치명적) — 이 요청이 속한 프로젝트의 소유자(로그인)나 만든 브라우저(게스트
// 쿠키)가 아니면 반려를 막는다.

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
      { error: { code: "FORBIDDEN", message: "이 요청을 반려할 권한이 없습니다." } },
      { status: 403 }
    );
  }

  if (existing.status !== "PROPOSED") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_STATUS",
          message: "반영 제안이 생성된 상태(제안 생성됨)에서만 반려할 수 있습니다.",
        },
      },
      { status: 400 }
    );
  }

  const { data: proposal, error: proposalFetchError } = await supabase
    .from("proposals")
    .select("id, proposed_file_storage_path")
    .eq("request_id", requestId)
    .maybeSingle();

  if (proposalFetchError) {
    return NextResponse.json(
      { error: { code: "REJECT_FAILED", message: proposalFetchError.message } },
      { status: 500 }
    );
  }

  if (proposal) {
    const { error: removeError } = await supabase.storage
      .from("feedback-files")
      .remove([proposal.proposed_file_storage_path]);

    if (removeError) {
      return NextResponse.json(
        { error: { code: "REJECT_FAILED", message: removeError.message } },
        { status: 500 }
      );
    }
  }

  const { error: updateError } = await supabase
    .from("requests")
    .update({ status: "REJECTED" })
    .eq("id", requestId);

  if (updateError) {
    return NextResponse.json(
      { error: { code: "REJECT_FAILED", message: updateError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { id: requestId, status: "REJECTED" } });
}
