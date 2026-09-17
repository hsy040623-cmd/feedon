import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { analyzeRequest, type ReferenceImageInput } from "@/lib/ai/analyze-text";
import { generateProposalFile } from "@/lib/proposal/generate-proposal";
import type { TargetFileFormat } from "@/types/domain";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_TARGET_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  getFileExtension,
  getImageExtensionFromMimeType,
} from "@/lib/upload-constraints";

// Design Ref: DESIGN.md 6번(API 명세) — POST /api/requests
// Plan SC: PLAN.md 작업 4번 — 클라이언트 수정 요청 입력 UI(텍스트+참고 이미지+대상 파일) 제출 처리
// Plan SC: PLAN.md 작업 5번 — 저장 직후 AI 텍스트 분석을 실행해 수정 항목을 추출한다.
// Plan SC: PLAN.md 작업 6번 — 업로드된 참고 이미지가 있으면 함께 분석에 넘긴다.
// Plan SC: PLAN.md 작업 8번 — 분석이 명확하면 반영 제안(Preview) 파일을 별도 경로에 생성한다.
// Plan SC: PLAN.md 작업 9~11번 — 워드/엑셀/파워포인트 각각 실제 텍스트 치환 로직으로 생성한다.

export async function POST(request: Request) {
  const form = await request.formData();

  const projectId = form.get("projectId");
  const text = form.get("text");
  const targetFile = form.get("targetFile");
  const referenceImages = form.getAll("referenceImages").filter((v): v is File => v instanceof File);

  if (typeof projectId !== "string" || !projectId) {
    return NextResponse.json(
      { error: { code: "INVALID_PROJECT", message: "프로젝트를 선택하세요." } },
      { status: 400 }
    );
  }
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: { code: "INVALID_TEXT", message: "수정 요청 내용을 입력하세요." } },
      { status: 400 }
    );
  }
  if (!(targetFile instanceof File) || targetFile.size === 0) {
    return NextResponse.json(
      { error: { code: "INVALID_TARGET_FILE", message: "대상 파일을 업로드하세요." } },
      { status: 400 }
    );
  }

  const extension = getFileExtension(targetFile.name);
  if (!ALLOWED_TARGET_EXTENSIONS.includes(extension)) {
    return NextResponse.json(
      {
        error: {
          code: "UNSUPPORTED_FILE_FORMAT",
          message: "지원하지 않는 파일 형식이에요. 워드(.docx), 엑셀(.xlsx), 파워포인트(.pptx)만 업로드할 수 있어요.",
        },
      },
      { status: 400 }
    );
  }
  if (targetFile.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: { code: "TARGET_FILE_TOO_LARGE", message: "대상 파일은 20MB 이하만 업로드할 수 있어요." } },
      { status: 400 }
    );
  }

  for (const image of referenceImages) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: { code: "UNSUPPORTED_IMAGE_FORMAT", message: "참고 이미지는 PNG 또는 JPG만 업로드할 수 있어요." } },
        { status: 400 }
      );
    }
    if (image.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: { code: "IMAGE_TOO_LARGE", message: "참고 이미지는 20MB 이하만 업로드할 수 있어요." } },
        { status: 400 }
      );
    }
  }

  const supabase = createSupabaseServerClient();
  const requestId = randomUUID();

  const targetFileBuffer = Buffer.from(await targetFile.arrayBuffer());
  const targetFileContentType = targetFile.type || "application/octet-stream";
  // Storage 키는 원본 파일명(한글 등) 대신 검증된 확장자만 써서 "Invalid key" 오류를 피한다.
  // 사람이 보는 원래 파일명은 target_file_name 컬럼에 그대로 저장해 화면·다운로드에 쓴다.
  const targetFileStoragePath = `requests/${requestId}/target.${extension}`;
  const targetUpload = await supabase.storage
    .from("feedback-files")
    .upload(targetFileStoragePath, targetFileBuffer, { contentType: targetFileContentType });

  if (targetUpload.error) {
    return NextResponse.json(
      { error: { code: "TARGET_FILE_UPLOAD_FAILED", message: targetUpload.error.message } },
      { status: 500 }
    );
  }

  const referenceImagePaths: string[] = [];
  const referenceImageInputs: ReferenceImageInput[] = [];
  for (const [index, image] of referenceImages.entries()) {
    const path = `requests/${requestId}/ref-${index}.${getImageExtensionFromMimeType(image.type)}`;
    const buffer = Buffer.from(await image.arrayBuffer());
    const uploadResult = await supabase.storage
      .from("feedback-files")
      .upload(path, buffer, { contentType: image.type || undefined });

    if (uploadResult.error) {
      return NextResponse.json(
        { error: { code: "IMAGE_UPLOAD_FAILED", message: uploadResult.error.message } },
        { status: 500 }
      );
    }
    referenceImagePaths.push(path);
    referenceImageInputs.push({ buffer, mimeType: image.type });
  }

  const trimmedText = text.trim();

  const { error: insertError } = await supabase.from("requests").insert({
    id: requestId,
    project_id: projectId,
    text: trimmedText,
    reference_image_paths: referenceImagePaths,
    target_file_format: extension,
    target_file_name: targetFile.name,
    target_file_storage_path: targetFileStoragePath,
    status: "PENDING",
  });

  if (insertError) {
    return NextResponse.json(
      { error: { code: "REQUEST_CREATE_FAILED", message: insertError.message } },
      { status: 500 }
    );
  }

  // AI 텍스트+이미지 분석 (PLAN.md 5·6번). 모호/상충하면 확인 요청 상태로, 실패하면 실패 상태로 남긴다.
  await supabase.from("requests").update({ status: "ANALYZING" }).eq("id", requestId);

  let finalStatus: "NEEDS_REVIEW" | "PROPOSED" | "FAILED" = "PROPOSED";
  let ambiguityReason: string | null = null;

  try {
    const analysis = await analyzeRequest(trimmedText, referenceImageInputs);
    if (analysis.ambiguous || analysis.changes.length === 0) {
      finalStatus = "NEEDS_REVIEW";
      ambiguityReason = analysis.ambiguityReason ?? "요청 내용이 모호합니다.";
      await supabase
        .from("requests")
        .update({ status: finalStatus, ambiguity_reason: ambiguityReason })
        .eq("id", requestId);
    } else {
      // 반영 제안(Preview) 생성 — 원본(targetFileBuffer)은 건드리지 않고 별도 경로에만 저장한다.
      const proposal = await generateProposalFile({
        targetFileBuffer,
        format: extension as TargetFileFormat,
        contentType: targetFileContentType,
        changes: analysis.changes,
      });

      const proposalId = randomUUID();
      const proposalStoragePath = `requests/${requestId}/proposal-${proposalId}.${extension}`;
      const proposalUpload = await supabase.storage
        .from("feedback-files")
        .upload(proposalStoragePath, proposal.buffer, { contentType: proposal.contentType });

      if (proposalUpload.error) throw new Error(proposalUpload.error.message);

      const { error: proposalInsertError } = await supabase.from("proposals").insert({
        id: proposalId,
        request_id: requestId,
        changes: analysis.changes,
        proposed_file_storage_path: proposalStoragePath,
      });

      if (proposalInsertError) throw new Error(proposalInsertError.message);

      finalStatus = "PROPOSED";
      await supabase
        .from("requests")
        .update({ status: finalStatus, extracted_changes: analysis.changes })
        .eq("id", requestId);
    }
  } catch (analysisError) {
    finalStatus = "FAILED";
    await supabase
      .from("requests")
      .update({ status: finalStatus, ambiguity_reason: (analysisError as Error).message })
      .eq("id", requestId);
  }

  return NextResponse.json(
    { data: { id: requestId, status: finalStatus, ambiguityReason } },
    { status: 201 }
  );
}
