"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_TARGET_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  getFileExtension,
} from "@/lib/upload-constraints";
import MotionButton from "./MotionButton";

// Design Ref: DESIGN.md 화면1(요청 입력 화면) 중앙·하단 — 텍스트 입력 + 참고 이미지 업로드 + 대상 파일 업로드 + "분석 요청" 버튼
// Plan SC: PLAN.md 작업 4번 — 클라이언트 수정 요청 입력 UI 구현
// Plan SC: PLAN.md 작업 5~7번 — 제출 즉시 AI가 텍스트+이미지를 분석하고, 모호/상충하면 "확인 요청"으로 안내한다.

export default function RequestForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleTargetFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setError("");
    setSuccessMessage("");

    if (!file) {
      setTargetFile(null);
      return;
    }
    if (!ALLOWED_TARGET_EXTENSIONS.includes(getFileExtension(file.name))) {
      setError("지원하지 않는 파일 형식이에요. 워드(.docx), 엑셀(.xlsx), 파워포인트(.pptx)만 업로드할 수 있어요.");
      e.target.value = "";
      setTargetFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("대상 파일은 20MB 이하만 업로드할 수 있어요.");
      e.target.value = "";
      setTargetFile(null);
      return;
    }
    setTargetFile(file);
  };

  const handleReferenceImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setError("");
    setSuccessMessage("");

    for (const file of files) {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
        setError("참고 이미지는 PNG 또는 JPG만 업로드할 수 있어요.");
        e.target.value = "";
        setReferenceImages([]);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError("참고 이미지는 20MB 이하만 업로드할 수 있어요.");
        e.target.value = "";
        setReferenceImages([]);
        return;
      }
    }
    setReferenceImages(files);
  };

  const handleSubmit = async () => {
    if (!projectId) {
      setError("먼저 프로젝트를 선택하거나 만들어주세요.");
      return;
    }
    if (!text.trim()) {
      setError("수정 요청 내용을 입력하세요.");
      return;
    }
    if (!targetFile) {
      setError("대상 파일을 업로드하세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");
    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("text", text.trim());
      formData.append("targetFile", targetFile);
      referenceImages.forEach((file) => formData.append("referenceImages", file));

      const res = await fetch("/api/requests", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "요청 제출에 실패했습니다.");

      if (json.data.status === "NEEDS_REVIEW") {
        setError(`확인이 필요해요: ${json.data.ambiguityReason}`);
      } else if (json.data.status === "FAILED") {
        setError("AI 분석 중 오류가 발생했어요. 다시 시도해주세요.");
      } else {
        setSuccessMessage("반영 제안이 생성됐어요. 승인/반려 기능은 다음 개발 단계에서 이어집니다.");
        setText("");
        setTargetFile(null);
        setReferenceImages([]);
      }
      // 아래 "최근 요청" 목록(서버 컴포넌트)이 방금 제출한 요청을 바로 보여주도록 새로고침한다
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 border-2 border-black bg-white p-5">
      <label htmlFor="request-text" className="text-xs font-bold uppercase tracking-wide text-black">
        클라이언트 수정 요청
      </label>
      <textarea
        id="request-text"
        className="min-h-24 border-2 border-black px-3 py-2 text-black"
        placeholder="예: 3페이지 제목을 '2026년 상반기 실적 보고'로 바꿔주세요."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="reference-images" className="text-xs font-bold uppercase tracking-wide text-black">
          참고 이미지/스크린샷 (선택, PNG/JPG, 20MB 이하)
        </label>
        <input
          id="reference-images"
          type="file"
          accept="image/png,image/jpeg"
          multiple
          onChange={handleReferenceImagesChange}
        />
        {referenceImages.length > 0 && (
          <p className="w-fit rounded-full border-2 border-black px-3 py-1 text-xs font-bold text-black">
            {referenceImages.length}개 선택됨
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="target-file" className="text-xs font-bold uppercase tracking-wide text-black">
          대상 파일 (워드 .docx / 엑셀 .xlsx / 파워포인트 .pptx, 20MB 이하)
        </label>
        <input id="target-file" type="file" accept=".docx,.xlsx,.pptx" onChange={handleTargetFileChange} />
        {targetFile && (
          <p className="w-fit rounded-full border-2 border-black px-3 py-1 text-xs font-bold text-black">
            {targetFile.name}
          </p>
        )}
      </div>

      <MotionButton
        onPress={handleSubmit}
        disabled={submitting}
        className="self-start bg-black px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-accent disabled:opacity-40"
      >
        {submitting ? "요청 접수 중..." : "분석 요청"}
      </MotionButton>

      {error && (
        <p className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">{error}</p>
      )}
      {successMessage && (
        <p className="w-fit rounded-full bg-black px-3 py-1 text-xs font-bold text-white">{successMessage}</p>
      )}
    </section>
  );
}
