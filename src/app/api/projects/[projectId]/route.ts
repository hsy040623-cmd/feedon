import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Design Ref: 사용자 요청 — 프로젝트 목록 화면에서 프로젝트를 삭제할 수 있어야 한다.
// 프로젝트를 지우면 관련 요청·제안 행은 DB의 on delete cascade로 함께 지워지지만,
// Storage에 올라간 실제 파일(대상 파일·참고 이미지·제안 파일)은 별도로 지워야 한다.

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await context.params;
  const supabase = createSupabaseServerClient();

  const { data: requests, error: requestsError } = await supabase
    .from("requests")
    .select("id, target_file_storage_path, reference_image_paths")
    .eq("project_id", projectId);

  if (requestsError) {
    return NextResponse.json(
      { error: { code: "PROJECT_DELETE_FAILED", message: requestsError.message } },
      { status: 500 }
    );
  }

  const storagePaths: string[] = [];
  for (const request of requests ?? []) {
    storagePaths.push(request.target_file_storage_path, ...(request.reference_image_paths ?? []));
  }

  if ((requests ?? []).length > 0) {
    const requestIds = (requests ?? []).map((r) => r.id);
    const { data: proposals, error: proposalsError } = await supabase
      .from("proposals")
      .select("proposed_file_storage_path")
      .in("request_id", requestIds);

    if (proposalsError) {
      return NextResponse.json(
        { error: { code: "PROJECT_DELETE_FAILED", message: proposalsError.message } },
        { status: 500 }
      );
    }
    storagePaths.push(...(proposals ?? []).map((p) => p.proposed_file_storage_path));
  }

  if (storagePaths.length > 0) {
    const { error: removeError } = await supabase.storage.from("feedback-files").remove(storagePaths);
    if (removeError) {
      return NextResponse.json(
        { error: { code: "PROJECT_DELETE_FAILED", message: removeError.message } },
        { status: 500 }
      );
    }
  }

  const { error: deleteError } = await supabase.from("projects").delete().eq("id", projectId);
  if (deleteError) {
    return NextResponse.json(
      { error: { code: "PROJECT_DELETE_FAILED", message: deleteError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { id: projectId } });
}
