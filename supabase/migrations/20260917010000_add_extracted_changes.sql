-- Design Ref: DESIGN.md 2번(데이터 흐름) — AI 텍스트 분석 결과를 저장
-- Plan SC: PLAN.md 작업 5번 — AI 텍스트 분석(수정 대상·내용 추출) 결과를 requests에 보관해 두었다가
-- 이후 작업(8~11번, 반영 제안 파일 생성)에서 읽어 쓴다.

alter table requests
  add column extracted_changes jsonb; -- ChangeItem[] : { location, before, after }
