import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { withFileNameSuffix } from "@/lib/upload-constraints";
import { buildContentDisposition, getMimeTypeForExtension } from "@/lib/download-headers";

// Design Ref: DESIGN.md 6번(API 명세) — GET /api/requests/:id/download, 화면2(반영 제안 미리보기)의 다운로드 버튼
// Design Ref: DESIGN.md 4번(보안·데이터 처리) — Storage 접근은 서버에서만 한다.
// Plan SC: PLAN.md 작업 12번 — 작업자가 원본/제안 파일을 받을 수 있게 한다.
//
// 이전에는 화면에서 Supabase Storage의 서명된 URL을 직접 링크했는데, 그러면 파일명을 Storage가
// 내려주는 헤더에 맡기게 된다. 다른 도메인이라 <a download> 속성도 무시되고, 링크는 10분 뒤 만료된다.
// 실제로 맥+크롬에서 저장 창이 뜰 때 이름이 확장자 없이 들어가 워드 파일이 텍스트로 열리는 문제가 있었다.
// 그래서 다운로드를 앱 자신의 주소로 옮겨, 파일명과 형식을 앱이 직접 정해 내려보낸다.
//
// 열람 권한은 기존 규칙(CHECK.md 1번)을 그대로 따른다 — 요청 id(링크)를 아는 사람은 읽을 수 있고,
// 승인·반려 같은 "쓰기"만 canModifyProject로 따로 막는다. 화면2에서 이미 같은 파일을 볼 수 있었으므로
// 이 라우트가 접근 범위를 넓히지는 않는다.

export async function GET(
  request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  const { requestId } = await context.params;
  const wantsProposal = new URL(request.url).searchParams.get("type") !== "original";
  const supabase = createSupabaseServerClient();

  const { data: requestRow } = await supabase
    .from("requests")
    .select("id, status, target_file_name, target_file_format, target_file_storage_path")
    .eq("id", requestId)
    .single();

  if (!requestRow) {
    return NextResponse.json(
      { error: { code: "REQUEST_NOT_FOUND", message: "요청을 찾을 수 없습니다." } },
      { status: 404 }
    );
  }

  let storagePath = requestRow.target_file_storage_path as string;
  let fileName = requestRow.target_file_name as string;

  if (wantsProposal) {
    const { data: proposal } = await supabase
      .from("proposals")
      .select("proposed_file_storage_path")
      .eq("request_id", requestId)
      .maybeSingle();

    if (!proposal) {
      return NextResponse.json(
        { error: { code: "PROPOSAL_NOT_FOUND", message: "반영 제안 파일이 없습니다." } },
        { status: 404 }
      );
    }
    storagePath = proposal.proposed_file_storage_path;
    // 원본과 같은 이름으로 내려보내면 작업자가 구분하려고 이름을 고치다 확장자를 지우게 된다.
    fileName = withFileNameSuffix(fileName, requestRow.status === "APPROVED" ? "최종" : "반영제안");
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("feedback-files")
    .download(storagePath);

  if (downloadError || !file) {
    return NextResponse.json(
      { error: { code: "FILE_NOT_FOUND", message: "파일을 불러올 수 없습니다." } },
      { status: 404 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": getMimeTypeForExtension(requestRow.target_file_format as string),
      "Content-Disposition": buildContentDisposition(fileName),
      "Content-Length": String(buffer.length),
      // 제안 파일은 승인 여부에 따라 이름이 바뀌므로 캐시에 남기지 않는다
      "Cache-Control": "no-store",
    },
  });
}
