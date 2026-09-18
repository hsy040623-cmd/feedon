import { createOpenAiClient } from "@/lib/openai";
import type { ChangeItem } from "@/types/domain";

// Design Ref: DESIGN.md 2번(데이터 흐름) — OpenAI API로 텍스트(+참고 이미지)를 분석해
// [수정 대상 위치 + 변경 전 + 변경 후] 구조로 추출한다.
// Plan SC: PLAN.md 작업 5번(텍스트 분석) + 6번(이미지 분석 결합) — 참고 이미지가 있으면 함께 보내
// 텍스트와 이미지 지시를 종합해서 하나의 결과로 추출한다.
// PRD.md 5번 Must 1 / 6번 범위 규칙: 대상/내용 중 하나라도 불명확하거나, 텍스트와 이미지 지시가
// 상충하면 "확인 요청"으로 분류한다.

const SYSTEM_PROMPT = `당신은 클라이언트의 디자인/문서 수정 요청을 분석하는 보조 도구입니다.
요청에는 텍스트와, 때로는 원하는 방향을 보여주는 참고 이미지(스크린샷 등)가 함께 첨부됩니다.
텍스트만으로 판단하지 말고, 첨부된 이미지가 있다면 이미지에 표시된 영역·글씨·화살표 등도 함께 고려해
"무엇을(수정 대상 위치) + 어떻게(변경 전 내용 → 변경 후 내용)"를 쌍으로 추출하세요.

다음 JSON 형식으로만 답하세요:
{
  "ambiguous": boolean,
  "ambiguityReason": string | null,
  "changes": [
    { "location": string, "before": string, "after": string }
  ],
  "colorChange": { "targetColorHex": string } | null
}

규칙:
- 수정 대상이나 변경 내용 중 하나라도 명확하지 않으면(예: "더 예쁘게 해주세요"처럼 구체적 지시가 없는 경우) ambiguous를 true로 하고, ambiguityReason에 무엇이 불명확한지 한국어로 간단히 설명하세요. 이때 changes는 빈 배열로 둡니다.
- 텍스트의 지시와 이미지에 표시된 지시가 서로 다르거나 상충하면(예: 텍스트는 "제목을 바꿔달라"고 하는데 이미지는 다른 부분을 가리키는 경우) ambiguous를 true로 하고, 무엇이 상충하는지 ambiguityReason에 설명하세요.
- 요청이 명확하면 ambiguous를 false로 하고, changes에 추출한 항목을 모두 담으세요.
- 변경 전 내용(before)을 알 수 없으면("어딘가 있는 제목을 바꿔주세요" 등 위치만 있고 원문을 모르는 경우) 그 자체로는 모호로 보지 않되, before는 빈 문자열로 둘 수 있습니다.
- 문서 "전체" 텍스트의 색상을 바꿔달라는 요청(예: "전체 글자를 파란색으로", "모든 텍스트를 빨간색으로 해주세요")이면, changes는 빈 배열로 두고 ambiguous는 false로 한 뒤, colorChange에 { "targetColorHex": "RRGGBB 형식의 6자리 16진수(앞에 # 없이)" }를 채우세요. 색상 이름(파란색, 빨간색 등)은 가장 가까운 표준 색상의 16진수로 변환하세요(예: 파란색→0000FF, 빨간색→FF0000, 검정→000000, 흰색→FFFFFF).
- 색상 변경이 아니면 colorChange는 반드시 null로 두세요.
- 전체가 아니라 "제목만", "특정 단어만" 등 일부 범위의 색상 변경이나, 색상이 아닌 다른 서식(글꼴, 굵기, 크기, 정렬 등) 변경 요청은 아직 지원하지 않습니다 — 이런 요청은 ambiguous를 true로 하고 ambiguityReason에 "지금은 문서 전체 텍스트 색상 변경만 지원합니다"라고 안내하세요.
- JSON 외의 다른 텍스트는 출력하지 마세요.`;

/** #RRGGBB의 RRGGBB 부분(앞의 #은 뺀 6자리 16진수)만 유효한 값으로 인정한다 */
const HEX_COLOR_PATTERN = /^[0-9A-Fa-f]{6}$/;

export interface AnalyzeTextResult {
  ambiguous: boolean;
  ambiguityReason?: string;
  changes: ChangeItem[];
  /** 문서 전체 텍스트를 이 색으로 바꿔달라는 요청이면 채워진다 (RRGGBB, # 없음) */
  colorChange: { targetColorHex: string } | null;
}

export interface ReferenceImageInput {
  /** 이미지 원본 바이트 */
  buffer: Buffer;
  /** 예: image/png, image/jpeg */
  mimeType: string;
}

/**
 * 클라이언트 요청 텍스트(+참고 이미지)를 분석해 수정 항목을 추출하거나, 모호/상충하면 그 이유를 반환한다.
 * images를 비워두면 텍스트만으로 분석한다.
 */
export async function analyzeRequest(
  text: string,
  images: ReferenceImageInput[] = []
): Promise<AnalyzeTextResult> {
  const openai = createOpenAiClient();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text },
          ...images.map((image) => ({
            type: "image_url" as const,
            image_url: { url: `data:${image.mimeType};base64,${image.buffer.toString("base64")}` },
          })),
        ],
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: {
    ambiguous?: boolean;
    ambiguityReason?: string | null;
    changes?: ChangeItem[];
    colorChange?: { targetColorHex?: string } | null;
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    // AI 응답이 JSON이 아니면 분석 실패로 보고 확인 요청 상태로 처리한다
    return {
      ambiguous: true,
      ambiguityReason: "AI 분석 결과를 해석하지 못했습니다. 다시 시도해주세요.",
      changes: [],
      colorChange: null,
    };
  }

  // AI가 형식에 안 맞는 색상값을 주면(예: "blue", "#00F") 무시한다 — 잘못된 값을 그대로 문서에 쓰면
  // 파일이 깨질 수 있어, 유효한 RRGGBB 6자리 16진수일 때만 채택한다.
  const rawHex = parsed.colorChange?.targetColorHex?.replace(/^#/, "");
  const colorChange = rawHex && HEX_COLOR_PATTERN.test(rawHex) ? { targetColorHex: rawHex.toUpperCase() } : null;

  return {
    ambiguous: Boolean(parsed.ambiguous),
    ambiguityReason: parsed.ambiguityReason ?? undefined,
    changes: Array.isArray(parsed.changes) ? parsed.changes : [],
    colorChange,
  };
}
