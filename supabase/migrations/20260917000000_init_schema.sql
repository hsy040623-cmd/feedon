-- Design Ref: DESIGN.md 5번(상태 값 정의), 6번(API 명세) / src/types/domain.ts와 동일한 구조 유지
-- Plan SC: PLAN.md 작업 2번 — Supabase 테이블 설정

-- 요청 처리 상태값 (DESIGN.md 5번 표와 동일)
create type request_status as enum (
  'PENDING',      -- 대기
  'ANALYZING',    -- 분석중
  'NEEDS_REVIEW', -- 확인 요청
  'PROPOSED',     -- 제안 생성됨
  'APPROVED',     -- 승인됨
  'REJECTED',     -- 반려됨
  'FAILED'        -- 실패
);

-- 지원 대상 파일 형식 (PRD.md 6번 범위: 워드/엑셀/파워포인트만 지원)
create type target_file_format as enum ('docx', 'xlsx', 'pptx');

-- 프로젝트(작업 건)
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 클라이언트 수정 요청
create table requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  text text not null,
  reference_image_paths text[] not null default '{}',
  target_file_format target_file_format not null,
  target_file_name text not null,
  target_file_storage_path text not null,
  status request_status not null default 'PENDING',
  ambiguity_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 반영 제안 (Preview) — 승인 전까지 원본을 대체하지 않는다
create table proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests (id) on delete cascade,
  changes jsonb not null default '[]', -- ChangeItem[] : { location, before, after }
  proposed_file_storage_path text not null,
  created_at timestamptz not null default now()
);

create index requests_project_id_idx on requests (project_id);
create index proposals_request_id_idx on proposals (request_id);

-- 1인 작업자 계정을 전제로 하므로(PRD.md 7번), 서버(서비스 롤)에서만 접근하도록 RLS를 활성화하고
-- 별도의 공개 정책은 추가하지 않는다. 즉 SUPABASE_SERVICE_ROLE_KEY를 쓰는 서버 코드만 접근 가능하다.
alter table projects enable row level security;
alter table requests enable row level security;
alter table proposals enable row level security;
