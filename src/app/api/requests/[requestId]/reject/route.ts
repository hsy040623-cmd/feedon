import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Design Ref: DESIGN.md 6번(API 명세) — POST /api/requests/:id/reject, 화면2(반영 제안 미리보기)의 "반려" 버튼
// Plan SC: PLAN.md 작업 13번 — 반려 시 제안 파일만 Storage에서 폐기하고, 요청 이력(메타데이터)은 그대로 남긴다.
// CLAUDE.md 핵심 동작 원칙 3번: 반려된 제안은 별도 사유 기록 없이 처리를 종료한다.

export async function POST(
  _request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await context.params;
  const supabase = createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("requests")
    .select("id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: { code: "REQUEST_NOT_FOUND", message: "요청을 찾을 수 없습니다." } },
      { status: 404 }
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
