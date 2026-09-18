import type JSZip from "jszip";

// Design Ref: DESIGN.md 7번(제약 조건) — 업로드 용량 20MB 제한.
// Plan SC: PLAN.md 작업 9~11번 — 워드/엑셀/파워포인트 제안 파일을 다시 압축할 때 공통으로 쓰는 설정.
//
// .docx/.xlsx/.pptx는 모두 zip 파일이고, 원본은 워드·엑셀·파워포인트가 DEFLATE로 압축해 저장한다.
// 그런데 jszip의 generateAsync는 아무 옵션을 주지 않으면 압축을 아예 하지 않는(STORE) 방식이라,
// 텍스트 몇 글자만 바꿨는데도 제안 파일이 원본보다 몇 배로 커진다(실측: 201KB → 640KB).
// 파일이 열리는 데는 문제가 없지만 20MB 제한에 걸릴 여지가 있어, 원본과 같은 DEFLATE로 다시 묶는다.

/** 제안 파일을 원본처럼 DEFLATE 압축해서 내보내기 위한 jszip 옵션 */
export const ZIP_OUTPUT_OPTIONS: JSZip.JSZipGeneratorOptions<"nodebuffer"> = {
  type: "nodebuffer",
  compression: "DEFLATE",
  compressionOptions: { level: 6 },
};

/**
 * zip 안의 XML을 바꿔 쓸 때 쓰는 옵션.
 *
 * jszip은 "word/document.xml"처럼 폴더가 있는 경로에 파일을 쓰면 "word/" 폴더 항목까지 zip에
 * 새로 추가한다. 워드·엑셀·파워포인트가 저장한 원본에는 이런 폴더 항목이 없으므로, 원본과 같은
 * 구성을 유지하도록 폴더 항목을 만들지 않게 한다.
 */
export const ZIP_WRITE_OPTIONS: JSZip.JSZipFileOptions = { createFolders: false };
