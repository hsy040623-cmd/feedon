import type { ChangeItem, TargetFileFormat } from "@/types/domain";
import { applyChangesToDocx } from "./docx";
import { applyChangesToXlsx } from "./xlsx";
import { applyChangesToPptx } from "./pptx";

// Design Ref: DESIGN.md 2번(데이터 흐름) — "명확하면 대상 파일 형식에 맞는 처리 로직을 호출해
// 실제로 수정이 적용된 새 파일(반영 제안)을 생성한다. 원본 파일은 그대로 둔다."
// Plan SC: PLAN.md 작업 8번(공통 디스패처 구조) + 9~11번(워드/엑셀/파워포인트 실제 치환 로직) —
// 대상 파일 형식에 맞는 포맷별 생성기를 골라 반영 제안 파일을 만든다.

export interface GenerateProposalInput {
  /** 원본 대상 파일의 바이트 (절대 이 값을 직접 수정하지 않는다) */
  targetFileBuffer: Buffer;
  format: TargetFileFormat;
  /** 업로드 시 대상 파일의 Content-Type (패스스루일 때 그대로 사용) */
  contentType: string;
  changes: ChangeItem[];
}

export interface GenerateProposalOutput {
  /** 제안(Preview) 파일로 저장할 바이트 */
  buffer: Buffer;
  contentType: string;
}

type FormatGenerator = (input: GenerateProposalInput) => Promise<GenerateProposalOutput>;

/** 워드(.docx) — word/document.xml 안에서 before → after 텍스트를 실제로 치환한다 (PLAN.md 9번) */
const docxGenerator: FormatGenerator = async ({ targetFileBuffer, contentType, changes }) => ({
  buffer: await applyChangesToDocx(targetFileBuffer, changes),
  contentType,
});

/** 엑셀(.xlsx) — xl/sharedStrings.xml 안에서 before → after 텍스트를 실제로 치환한다 (PLAN.md 10번) */
const xlsxGenerator: FormatGenerator = async ({ targetFileBuffer, contentType, changes }) => ({
  buffer: await applyChangesToXlsx(targetFileBuffer, changes),
  contentType,
});

/** 파워포인트(.pptx) — 각 슬라이드 XML 안에서 before → after 텍스트를 실제로 치환한다 (PLAN.md 11번) */
const pptxGenerator: FormatGenerator = async ({ targetFileBuffer, contentType, changes }) => ({
  buffer: await applyChangesToPptx(targetFileBuffer, changes),
  contentType,
});

const GENERATORS: Record<TargetFileFormat, FormatGenerator> = {
  docx: docxGenerator,
  xlsx: xlsxGenerator,
  pptx: pptxGenerator,
};

/** 대상 파일 형식에 맞는 생성기를 골라 반영 제안 파일을 만든다 */
export async function generateProposalFile(input: GenerateProposalInput): Promise<GenerateProposalOutput> {
  const generator = GENERATORS[input.format];
  return generator(input);
}
