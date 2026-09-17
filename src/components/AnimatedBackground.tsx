// Design Ref: plus-ex.com 레퍼런스의 "진입 시 눈에 띄는 회전 모션" 느낌을 CSS 애니메이션(원형 링)으로 재해석.
// 실제 이미지를 가져오지 않고, 블랙/화이트/레드 톤의 동심원을 서로 다른 속도로 회전시켜 배경 모션을 만든다.
// 굵은 레드 링에 네온 글로우(box-shadow)를 줘서 모션이 잘 보이도록 했다.
// 장식용이라 스크린리더에서는 숨기고(aria-hidden), 모션 최소화 설정을 존중한다(motion-safe).

export default function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 motion-safe:animate-[spin_50s_linear_infinite]">
        <div className="h-full w-full rounded-full border-2 border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.08)]" />
      </div>
      <div className="absolute left-1/2 top-1/2 h-[105vmin] w-[105vmin] -translate-x-1/2 -translate-y-1/2 motion-safe:animate-[spin_34s_linear_infinite_reverse]">
        <div className="h-full w-full rounded-full border-[6px] border-accent/80 shadow-[0_0_45px_10px_rgba(230,51,43,0.4)]" />
      </div>
      <div className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 motion-safe:animate-[spin_22s_linear_infinite]">
        <div className="h-full w-full rounded-full border-[3px] border-white/45 shadow-[0_0_25px_rgba(255,255,255,0.18)]" />
      </div>
      <div className="absolute left-1/2 top-1/2 h-[38vmin] w-[38vmin] -translate-x-1/2 -translate-y-1/2 motion-safe:animate-[spin_14s_linear_infinite_reverse]">
        <div className="h-full w-full rounded-full border-2 border-dashed border-white/35" />
      </div>
      <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_35px_12px_rgba(230,51,43,0.55)] motion-safe:animate-pulse" />
    </div>
  );
}
