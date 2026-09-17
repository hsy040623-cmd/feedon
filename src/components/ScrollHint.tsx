// 첫 모션 섹션 하단의 "아래로 스크롤" 안내. 장식용이라 스크린리더에서는 숨긴다.

export default function ScrollHint() {
  return (
    <div
      aria-hidden
      className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 text-white motion-safe:animate-bounce"
    >
      <span className="text-xs font-bold uppercase tracking-widest">Scroll</span>
      <span className="text-xl leading-none">↓</span>
    </div>
  );
}
