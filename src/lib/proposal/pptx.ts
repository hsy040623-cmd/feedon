import JSZip from "jszip";
import type { ChangeItem } from "@/types/domain";

// Design Ref: DESIGN.md 3번(기술 선택) — 파워포인트 파일 안의 텍스트를 찾아 바꾸는 문서 처리 로직.
// Plan SC: PLAN.md 작업 11번 — 파워포인트(.pptx) 반영 제안 생성 기능.
//
// .pptx도 zip 압축 파일이고, 슬라이드마다 ppt/slides/slide1.xml, slide2.xml ... 로 나뉘어 있다.
// 각 슬라이드 안의 텍스트는 <a:t>내용</a:t> 태그(DrawingML)에 들어있어, 워드/엑셀과 같은 방식으로
// 모든 슬라이드 XML을 순회하며 문자열을 치환한다.
//
// 알려진 한계: 도형/텍스트 상자 서식이 바뀌는 경계에서 <a:t>가 여러 조각으로 나뉘면 단순 문자열
// 치환으로는 찾지 못할 수 있다 — 워드 때와 같은 성격의 한계다.

/** XML 텍스트 노드에 들어갈 수 있도록 특수문자를 이스케이프한다 */
function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * 파워포인트(.pptx) 파일 안의 모든 슬라이드에서 changes의 before → after 텍스트를 찾아 바꾼
 * 새 파일을 만든다. before가 비어있는 항목은 원문에서 위치를 특정할 수 없어 건너뛴다.
 */
export async function applyChangesToPptx(fileBuffer: Buffer, changes: ChangeItem[]): Promise<Buffer> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const slidePaths = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort();

  if (slidePaths.length === 0) {
    // 정상적인 .pptx가 아니면(슬라이드를 못 찾으면) 손대지 않고 원본을 그대로 돌려준다
    return fileBuffer;
  }

  const validChanges = changes.filter((change) => change.before);
  if (validChanges.length === 0) return fileBuffer;

  for (const slidePath of slidePaths) {
    const entry = zip.file(slidePath);
    if (!entry) continue;

    let xml = await entry.async("string");
    for (const change of validChanges) {
      const before = escapeXmlText(change.before);
      const after = escapeXmlText(change.after);
      xml = xml.split(before).join(after);
    }
    zip.file(slidePath, xml);
  }

  const output = await zip.generateAsync({ type: "nodebuffer" });
  return output;
}
