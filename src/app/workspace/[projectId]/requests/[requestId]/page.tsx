import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getServerAuthUserEmail } from "@/lib/supabase-server-auth";
import ScrollMotionField from "@/components/ScrollMotionField";
import SiteHeader from "@/components/SiteHeader";
import { REQUEST_STATUS_LABEL } from "@/lib/request-status";
import type { ChangeItem, RequestStatus } from "@/types/domain";
import ApproveRejectActions from "@/components/ApproveRejectActions";

// Design Ref: DESIGN.md 화면2(반영 제안 미리보기 화면) — 원본 vs 제안 비교, AI가 추출한 수정 사양 요약,
// 승인/반려 버튼을 보여준다.
// Plan SC: PLAN.md 작업 12번 — 반영 제안 미리보기 화면(작업자 확인 UI) 구현
// Plan SC: PLAN.md 작업 13번 — 승인/반려 버튼을 실제 처리 API(ApproveRejectActions)에 연결한다.
export const dynamic = "force-dynamic";

/** Storage는 비공개 버킷이라, 서버에서 짧게 유효한 서명된 다운로드 링크를 만들어서 내려준다 */
const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 10;

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

  // Storage 키는 확장자만 쓰는 안전한 이름이라(원본 파일명은 여기서만 쓰임), 다운로드할 때
  // 브라우저가 원래 파일명으로 저장하도록 download 파라미터를 붙인다.
  // (createSignedUrl의 download 옵션은 한글 등 비-ASCII 파일명을 이중 인코딩하는 라이브러리 버그가 있어
  // 직접 encodeURIComponent로 한 번만 인코딩해 붙인다)
  const { data: originalUrlData } = await supabase.storage
    .from("feedback-files")
    .createSignedUrl(request.target_file_storage_path, SIGNED_URL_EXPIRES_IN_SECONDS);
  const originalDownloadUrl = originalUrlData?.signedUrl
    ? `${originalUrlData.signedUrl}&download=${encodeURIComponent(request.target_file_name)}`
    : null;

  let proposalUrl: string | null = null;
  if (proposal) {
    const { data: proposalUrlData } = await supabase.storage
      .from("feedback-files")
      .createSignedUrl(proposal.proposed_file_storage_path, SIGNED_URL_EXPIRES_IN_SECONDS);
    proposalUrl = proposalUrlData?.signedUrl
      ? `${proposalUrlData.signedUrl}&download=${encodeURIComponent(request.target_file_name)}`
      : null;
  }

  const changes = (proposal?.changes ?? []) as ChangeItem[];
  const status = request.status as RequestStatus;
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
            {originalDownloadUrl ? (
              <a
                href={originalDownloadUrl}
                className="w-fit rounded-full bg-black px-3 py-1 text-xs font-bold text-white transition-all hover:bg-accent"
              >
                원본 다운로드
              </a>
            ) : (
              <p className="text-xs text-zinc-500">다운로드 링크를 불러올 수 없어요.</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wide">
              {status === "APPROVED" ? "최종 확정 파일" : "반영 제안 파일"}
            </h2>
            {proposalUrl ? (
              <>
                <p className="text-sm">
                  {request.target_file_name} {status === "APPROVED" ? "(최종)" : "(제안)"}
                </p>
                <a
                  href={proposalUrl}
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
