"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MotionButton from "./MotionButton";

// Design Ref: /start 온보딩 흐름의 마지막 섹션 — 프로젝트를 만들고 나면 워크스페이스(/workspace/[projectId])로 이동한다.

export default function StartProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("프로젝트 이름을 입력하세요.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "프로젝트 생성에 실패했습니다.");

      router.push(`/workspace/${json.data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-4 border-2 border-black bg-white p-6">
      <label htmlFor="start-project-name" className="text-xs font-bold uppercase tracking-wide text-black">
        프로젝트 이름
      </label>
      <input
        id="start-project-name"
        className="border-2 border-black px-3 py-2 text-black"
        placeholder="예: 클라이언트 A 웹사이트"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <MotionButton
        onPress={handleSubmit}
        disabled={submitting}
        className="bg-black px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-accent disabled:opacity-40"
      >
        {submitting ? "..." : "Done"}
      </MotionButton>
      {error && (
        <p className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">{error}</p>
      )}
    </div>
  );
}
