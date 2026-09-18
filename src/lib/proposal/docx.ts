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
 * 문서 안의 모든 텍스트 run(<w:r>)이 targetColorHex 색상을 쓰도록 word/document.xml을 고친다.
 * - 이미 <w:rPr>(run 서식)이 있는 run은 그 안의 <w:color>를 바꾸거나(없으면 추가) 한다.
 * - <w:rPr>이 아예 없는 run은 <w:rPr><w:color .../></w:rPr>을 새로 만들어 넣는다.
 * - 내용이 없는 self-closing run(<w:r/>)은 칠할 텍스트가 없어 건드리지 않는다.
 *
 * 실제 워드 문서에는 속성 없는 run 서식이 <w:rPr></w:rPr>이 아니라 <w:rPr/>(self-closing)로
 * 저장되는 경우가 흔한데, 이전 버전은 이걸 "rPr 없음"으로 착각해 <w:rPr>을 하나 더 끼워 넣었다.
 * 한 run 안에 <w:rPr>이 두 번 들어가거나(중복), self-closing run 뒤에 <w:rPr>이 형제로 붙는 등
 * 잘못된 XML이 만들어져 워드가 파일을 손상된 것으로 인식하는 문제가 있었다 — 그래서 0번 단계로
 * self-closing <w:rPr/>을 먼저 <w:rPr></w:rPr>로 정규화하고, self-closing run은 아예 건드리지 않게
 * 고쳤다.
 * 정식 XML 파서 없이 정규식으로 처리하므로, 아주 드물게 문서 구조가 특이하면(중첩된 표 등)
 * 일부 run을 놓칠 수 있다 — "전체 텍스트 색상 변경" 1차 지원의 알려진 한계로 남겨둔다.
 */
function applyColorToDocumentXml(xml: string, targetColorHex: string): string {
  // 0) self-closing 빈 run 서식(<w:rPr/>)을 <w:rPr></w:rPr>로 정규화해서 1번 단계가 인식하게 한다.
  let result = xml.replace(/<w:rPr\s*\/>/g, "<w:rPr></w:rPr>");

  // 1) 이미 <w:rPr>...</w:rPr>이 있는 run: 그 안의 <w:color>를 교체하거나, 없으면 추가한다.
  result = result.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/g, (_match, inner: string) => {
    if (/<w:color\b[^/>]*\/>/.test(inner)) {
      const updatedInner = inner.replace(/<w:color\b[^/>]*\/>/, `<w:color w:val="${targetColorHex}"/>`);
      return `<w:rPr>${updatedInner}</w:rPr>`;
    }
    return `<w:rPr><w:color w:val="${targetColorHex}"/>${inner}</w:rPr>`;
  });

  // 2) <w:rPr>이 아예 없는, 내용이 있는 run(<w:r> 또는 <w:r rsidRPr="...">)에만 새로 만들어 넣는다.
  //    self-closing run(<w:r/>, <w:r .../>)은 닫는 ">"가 항상 "/" 바로 뒤에 오므로
  //    (?<!\/)>로 제외한다 — 내용이 없어 칠할 게 없고, 잘못 건드리면 구조가 깨진다.
  result = result.replace(
    /<w:r(?:\s[^>]*)?(?<!\/)>(?!\s*<w:rPr>)/g,
    (match) => `${match}<w:rPr><w:color w:val="${targetColorHex}"/></w:rPr>`
  );

  return result;
}

/**
 * 워드(.docx) 파일 안에서 changes의 before → after 텍스트를 찾아 바꾸고, colorChange가 있으면
 * 문서 전체 텍스트 색상도 바꾼 새 파일을 만든다.
 * before가 비어있는 항목은 원문에서 위치를 특정할 수 없어 건너뛴다.
 */
export async function applyChangesToDocx(
  fileBuffer: Buffer,
  changes: ChangeItem[],
  colorChange: { targetColorHex: string } | null = null
): Promise<Buffer> {
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

  if (colorChange) {
    xml = applyColorToDocumentXml(xml, colorChange.targetColorHex);
  }

  zip.file(documentXmlPath, xml);
  const output = await zip.generateAsync({ type: "nodebuffer" });
  return output;
}
