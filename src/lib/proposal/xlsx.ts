import JSZip from "jszip";
import type { ChangeItem } from "@/types/domain";

// Design Ref: DESIGN.md 3번(기술 선택) — 엑셀 파일 안의 텍스트를 찾아 바꾸는 문서 처리 로직.
// Plan SC: PLAN.md 작업 10번 — 엑셀(.xlsx) 반영 제안 생성 기능.
//
// .xlsx도 docx처럼 zip 압축 파일이다. 셀에 들어가는 문자열은 대부분 xl/sharedStrings.xml에
// <si><t>내용</t></si> 형태로 모아서 저장되고, 각 시트는 그 안의 순번을 참조하는 방식이다.
// 그래서 워드 때와 같은 방식으로 sharedStrings.xml 안에서 문자열을 바로 치환하면 된다.
//
// 알려진 한계: 숫자만 있는 셀이나, 공유 문자열 없이 시트 XML에 직접 적힌(inline string) 텍스트는
// sharedStrings.xml에 없어 이 방식으로는 바뀌지 않는다.

/** XML 텍스트 노드에 들어갈 수 있도록 특수문자를 이스케이프한다 */
function escapeXmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * 엑셀(.xlsx) 파일 안에서 changes의 before → after 텍스트를 찾아 바꾼 새 파일을 만든다.
 * before가 비어있는 항목은 원문에서 위치를 특정할 수 없어 건너뛴다.
 */
export async function applyChangesToXlsx(fileBuffer: Buffer, changes: ChangeItem[]): Promise<Buffer> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const sharedStringsPath = "xl/sharedStrings.xml";
  const sharedStringsEntry = zip.file(sharedStringsPath);

  if (!sharedStringsEntry) {
    // 공유 문자열이 없는(=치환할 텍스트를 찾을 수 없는) 파일이면 손대지 않고 원본을 그대로 돌려준다
    return fileBuffer;
  }

  let xml = await sharedStringsEntry.async("string");

  for (const change of changes) {
    if (!change.before) continue; // 변경 전 내용을 모르면 위치를 특정할 수 없어 건너뜀

    const before = escapeXmlText(change.before);
    const after = escapeXmlText(change.after);
    xml = xml.split(before).join(after);
  }

  zip.file(sharedStringsPath, xml);
  const output = await zip.generateAsync({ type: "nodebuffer" });
  return output;
}
