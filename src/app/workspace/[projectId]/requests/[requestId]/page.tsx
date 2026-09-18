import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getServerAuthUserEmail } from "@/lib/supabase-server-auth";
import ScrollMotionField from "@/components/ScrollMotionField";
import SiteHeader from "@/components/SiteHeader";
import { REQUEST_STATUS_LABEL } from "@/lib/request-status";
import { getFileExtension, withFileNameSuffix } from "@/lib/upload-constraints";
import type { ChangeItem, RequestStatus } from "@/types/domain";
import ApproveRejectActions from "@/components/ApproveRejectActions";

// Design Ref: DESIGN.md 화면2(반영 제안 미리보기 화면) — 원본 vs 제안 비교, AI가 추출한 수정 사양 요약,
// 승인/반려 버튼을 보여준다.
// Plan SC: PLAN.md 작업 12번 — 반영 제안 미리보기 화면(작업자 확인 UI) 구현
// Plan SC: PLAN.md 작업 13번 — 승인/반려 버튼을 실제 처리 API(ApproveRejectActions)에 연결한다.
export const dynamic = "force-dynamic";

export default async function RequestDetailPage(
  props: PageProps<"/workspace/[projectId]/requests/[requestId]">
) {
  const { projectId, requestId } = await props.params;

  const supabase = createSupabaseServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .single();
  if (!project) notFound();

  const { data: request } = await supabase
    .from("requests")
    .select("id, text, status, ambiguity_reason, target_file_name, target_file_storage_path, created_at")
    .eq("id", requestId)
    .eq("project_id", project.id)
    .single();
  if (!request) notFound();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, changes, proposed_file_storage_path")
    .eq("request_id", request.id)
    .maybeSingle();

  const changes = (proposal?.changes ?? []) as ChangeItem[];
  const status = request.status as RequestStatus;

  // 제안 파일은 원본과 같은 이름으로 내려보내지 않는다 — 작업자가 구분하려고 이름을 고치다가
  // 확장자(.docx)를 지워버리면 워드가 아닌 텍스트 파일로 열려버린다.
  const proposalFileName = withFileNameSuffix(
    request.target_file_name,
    status === "APPROVED" ? "최종" : "반영제안"
  );

  // 다운로드는 Storage 서명 URL을 직접 링크하지 않고 앱의 라우트를 거친다. 같은 도메인이라
  // <a download>가 동작해 파일명이 확실히 지켜지고, 링크가 10분 뒤 만료되는 문제도 없다.
  //
  // 반려하면 제안 파일은 Storage에서 지워지지만 proposals 행은 이력으로 남는다(reject 라우트).
  // 그래서 행이 있는지만 보고 링크를 띄우면 눌렀을 때 깨지므로, 반려된 요청은 링크를 만들지 않는다.
  const originalDownloadUrl = `/api/requests/${request.id}/download?type=original`;
  const proposalDownloadUrl =
    proposal && status !== "REJECTED" ? `/api/requests/${request.id}/download?type=proposal` : null;
  const isNeedsReview = status === "NEEDS_REVIEW";
  const isFailed = status === "FAILED";
  const userEmail = await getServerAuthUserEmail();

  return (
    <div className="relative min-h-screen text-white">
      {/* 요청 폼 페이지와 마찬가지로 큰 십자가 오브젝트는 가독성을 해쳐서 숨긴다 */}
      <ScrollMotionField showShape={false} />

      <SiteHeader
        backHref={`/workspace/${project.id}`}
        userEmail={userEmail}
        rightSlot={
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">{project.name}</span>
        }
      />

      <main className="relative z-10 mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl font-black uppercase leading-[0.95] tracking-tight text-white">
            반영 제안 확인
          </h1>
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-bold text-white ${
              isNeedsReview || isFailed ? "bg-accent" : "border-2 border-white/40"
            }`}
          >
            {REQUEST_STATUS_LABEL[status]}
          </span>
        </div>

        <section className="border-2 border-black bg-white p-5 text-black">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide">클라이언트 요청</h2>
          <p className="whitespace-pre-wrap text-sm">{request.text}</p>
        </section>

        {(isNeedsReview || isFailed) && request.ambiguity_reason && (
          <section className="border-2 border-accent bg-white p-5 text-black">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-accent">
              {isNeedsReview ? "확인이 필요해요" : "처리 중 오류가 발생했어요"}
            </h2>
            <p className="text-sm">{request.ambiguity_reason}</p>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 border-2 border-black bg-white p-5 text-black sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wide">원본 파일</h2>
            <p className="text-sm">{request.target_file_name}</p>
            <a
              href={originalDownloadUrl}
              download={request.target_file_name}
              className="w-fit rounded-full bg-black px-3 py-1 text-xs font-bold text-white transition-all hover:bg-accent"
            >
              원본 다운로드
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wide">
              {status === "APPROVED" ? "최종 확정 파일" : "반영 제안 파일"}
            </h2>
            {proposalDownloadUrl ? (
              <>
                <p className="text-sm">{proposalFileName}</p>
                <p className="text-xs text-zinc-500">
                  저장 창이 뜨면 이름 뒤의 확장자(.{getFileExtension(request.target_file_name)})는 꼭 남겨두세요.
                  지우면 워드가 아닌 텍스트 파일로 열립니다.
                </p>
                <a
                  href={proposalDownloadUrl}
                  download={proposalFileName}
                  className="w-fit rounded-full bg-black px-3 py-1 text-xs font-bold text-white transition-all hover:bg-accent"
                >
                  {status === "APPROVED" ? "최종 파일 다운로드" : "제안 파일 다운로드"}
                </a>
              </>
            ) : status === "REJECTED" ? (
              <p className="text-sm text-zinc-500">반려되어 제안 파일이 폐기됐어요.</p>
            ) : (
              <p className="text-sm text-zinc-500">아직 생성된 제안 파일이 없어요.</p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3 border-2 border-black bg-white p-5 text-black">
          <h2 className="text-xs font-bold uppercase tracking-wide">AI가 추출한 수정 사항</h2>
          {changes.length === 0 ? (
            <p className="text-sm text-zinc-500">추출된 수정 사항이 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {changes.map((change, index) => (
                <li
                  key={index}
                  className="flex flex-col gap-1 border-t border-black/10 pt-3 first:border-t-0 first:pt-0"
                >
                  <span className="text-xs font-bold text-zinc-500">{change.location}</span>
                  <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-3">
                    <span className="w-fit rounded bg-zinc-100 px-2 py-1 line-through decoration-accent">
                      {change.before || "(위치 지정 없음)"}
                    </span>
                    <span aria-hidden className="text-accent">
                      →
                    </span>
                    <span className="w-fit rounded bg-black px-2 py-1 font-bold text-white">{change.after}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {status === "PROPOSED" && (
          <section className="flex flex-col gap-3 border-2 border-black bg-white p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-black">승인 / 반려</h2>
            <ApproveRejectActions requestId={request.id} />
          </section>
        )}

        {status === "APPROVED" && (
          <p className="w-fit rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
            승인됨 — 제안 파일이 최종 산출물로 확정됐어요.
          </p>
        )}
        {status === "REJECTED" && (
          <p className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
            반려됨 — 제안 파일이 폐기됐어요.
          </p>
        )}
      </main>
    </div>
  );
}
