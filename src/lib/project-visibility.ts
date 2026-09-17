import { cookies } from "next/headers";
import { createSupabaseServerClient } from "./supabase";
import { getServerAuthUserId } from "./supabase-server-auth";

// Design Ref: CHECK.md 1번(치명적) — "로그인 없이도 자유롭게 쓸 수 있어야 하지만, 아무나 전체 프로젝트
// 목록을 열람할 수 있으면 안 된다"를 동시에 만족시키기 위한 모듈.
// - 로그인한 사람: projects.owner_id로 "내가 만든 프로젝트"만 목록에 노출한다.
// - 게스트(비로그인): 이 브라우저가 만든 프로젝트 id를 쿠키에 저장해두고, 그 id들만 목록에 노출한다.
// - 목록(열람)만 막는 것이고, 프로젝트 id(링크)를 직접 아는 사람은 지금처럼 그 프로젝트에 계속 들어갈 수 있다
//   (승인/반려/삭제 등 "쓰기" 작업의 인증은 별도 항목에서 다룬다).

export const GUEST_PROJECT_IDS_COOKIE = "feedon_project_ids";
const MAX_GUEST_PROJECT_IDS = 100;

export async function getGuestProjectIds(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(GUEST_PROJECT_IDS_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** 게스트 쿠키에 새로 만든 프로젝트 id를 추가한 값을 돌려준다 (라우트 핸들러에서 응답에 실어 보낼 용도) */
export function appendGuestProjectId(existingIds: string[], newId: string): string {
  const updated = [newId, ...existingIds.filter((id) => id !== newId)].slice(0, MAX_GUEST_PROJECT_IDS);
  return JSON.stringify(updated);
}

export interface VisibleProject {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * 로그인했으면 내가 만든 프로젝트만, 게스트면 이 브라우저에서 만든 프로젝트만 최신순으로 돌려준다.
 * (전체 프로젝트 열람을 막기 위한 함수 — 목록 화면·API에서 항상 이 함수만 쓴다)
 */
export async function fetchVisibleProjects(): Promise<VisibleProject[]> {
  const supabase = createSupabaseServerClient();
  const userId = await getServerAuthUserId();

  if (userId) {
    const { data } = await supabase
      .from("projects")
      .select("id, name, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((p) => ({ id: p.id, name: p.name, createdAt: p.created_at }));
  }

  const guestIds = await getGuestProjectIds();
  if (guestIds.length === 0) return [];

  const { data } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .in("id", guestIds)
    .order("created_at", { ascending: false });
  return (data ?? []).map((p) => ({ id: p.id, name: p.name, createdAt: p.created_at }));
}
