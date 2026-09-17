import JSZip from "jszip";
import type { ChangeItem } from "@/types/domain";

// Design Ref: DESIGN.md 3번(기술 선택) — 워드 파일 안의 텍스트를 찾아 바꾸는 문서 처리 로직.
// Plan SC: PLAN.md 작업 9번 — 워드(.docx) 반영 제안 생성 기능.
//
// .docx는 사실 zip 압축 파일이고, 본문 텍스트는 그 안의 word/document.xml에 XML로 들어있다.
// jszip으로 zip을 열어 그 XML 문자열 안에서 "변경 전" 텍스트를 찾아 "변경 후" 텍스트로 바꾼 뒤
// 다시 압축하는 방식으로 구현한다.
//
// 알려진 한계: 워드는 서식이 바뀌는 경계(굵게 처리된 단어 등)에서 한 문장을 여러 개의
// <w:t> 조각으로 쪼개기도 한다. 이 경우 문장이 XML 안에서 한 덩어리로 붙어있지 않아
// 단순 문자열 치환으로는 찾지 못할 수 있다 — 이런 요청은 반영되지 않고 원본이 그대로 남는다.

/** XML 텍스트 노드에 들어갈 수 있도록 특수문자를 이스케이프한다 */
function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * 워드(.docx) 파일 안에서 changes의 before → after 텍스트를 찾아 바꾼 새 파일을 만든다.
 * before가 비어있는 항목은 원문에서 위치를 특정할 수 없어 건너뛴다.
 */
export async function applyChangesToDocx(fileBuffer: Buffer, changes: ChangeItem[]): Promise<Buffer> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const documentXmlPath = "word/document.xml";
  const documentEntry = zip.file(documentXmlPath);

  if (!documentEntry) {
    // 정상적인 .docx가 아니면 손대지 않고 원본을 그대로 돌려준다
    return fileBuffer;
  }

  let xml = await documentEntry.async("string");

  for (const change of changes) {
    if (!change.before) continue; // 변경 전 내용을 모르면 위치를 특정할 수 없어 건너뜀

    const before = escapeXmlText(change.before);
    const after = escapeXmlText(change.after);
    xml = xml.split(before).join(after);
  }

  zip.file(documentXmlPath, xml);
  const output = await zip.generateAsync({ type: "nodebuffer" });
  return output;
}
