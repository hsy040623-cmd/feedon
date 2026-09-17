// Design Ref: virtual.plus-ex.com 레퍼런스의 화면 모서리 작은 십자(크로스헤어) 장식에서 착안한 순수 장식 요소.
// 실제 이미지를 쓰지 않고 SVG 선으로 직접 그린다. 스크린리더에서는 숨긴다(aria-hidden).

function Mark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`h-5 w-5 ${className ?? ""}`}>
      <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function CornerMarks({ tone }: { tone: "light" | "dark" }) {
  const color = tone === "light" ? "text-white/50" : "text-black/40";

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-6 z-10 ${color}`}>
      <Mark className="absolute left-0 top-0" />
      <Mark className="absolute right-0 top-0" />
      <Mark className="absolute bottom-0 left-0" />
      <Mark className="absolute bottom-0 right-0" />
    </div>
  );
}
