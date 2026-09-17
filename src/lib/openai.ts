import OpenAI from "openai";

// Design Ref: DESIGN.md 3번(기술 선택) — OpenAI API로 텍스트·이미지 수정 요청을 분석

/** 서버 전용 OpenAI 클라이언트 — API 라우트에서만 사용한다 */
export function createOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 없습니다. .env를 확인하세요.");
  }

  return new OpenAI({ apiKey });
}
