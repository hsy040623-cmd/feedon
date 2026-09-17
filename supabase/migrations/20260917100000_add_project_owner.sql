-- Design Ref: CHECK.md 1번(치명적) — 로그인 없이도 자유롭게 쓸 수 있게 하되, "전체 프로젝트 목록 열람"만
-- 막기 위해 소유자 컬럼을 추가한다. 로그인한 사람은 owner_id로, 게스트는 브라우저 쿠키에 담긴
-- 프로젝트 id 목록으로 "내 프로젝트" 범위를 좁힌다. 링크를 직접 아는 프로젝트는 지금처럼 그대로 열람 가능.

alter table projects
  add column owner_id uuid references auth.users (id) on delete set null;

create index projects_owner_id_idx on projects (owner_id);
