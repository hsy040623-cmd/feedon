import { NextResponse } from "next/server";
import { createOpenAiClient } from "@/lib/openai";
import { createSupabaseServerClient } from "@/lib/supabase";

// Design Ref: DESIGN.md 6번(API 명세) — 응답 형식 { data } / { error: { code, message } }
// Plan SC: PLAN.md 작업 2번 — API 라우트 기본 구조 + OpenAI 연동 확인 + Supabase 설정 확인

/** OpenAI API와 Supabase 연결 상태를 확인하는 헬스체크 엔드포인트 */
export async function GET() {
  const result: {
    openai: "ok" | "fail";
    supabase: "ok" | "fail";
    errors: string[];
  } = { openai: "fail", supabase: "fail", errors: [] };

  try {
    const openai = createOpenAiClient();
    // 가장 가벼운 호출로 키가 유효한지만 확인한다 (모델 목록 조회)
    await openai.models.list();
    result.openai = "ok";
  } catch (error) {
    result.errors.push(`openai: ${(error as Error).message}`);
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("projects").select("id", { count: "exact", head: true });
    if (error) throw error;
    result.supabase = "ok";
  } catch (error) {
    result.errors.push(`supabase: ${(error as Error).message}`);
  }

  const allOk = result.openai === "ok" && result.supabase === "ok";

  return NextResponse.json(
    allOk ? { data: result } : { error: { code: "HEALTH_CHECK_FAILED", message: "연동 확인 실패", detail: result } },
    { status: allOk ? 200 : 500 }
  );
}
