// /start 온보딩 2번째 섹션의 배경 모션. 대각선 줄무늬가 흘러가는 느낌을 CSS만으로 구현한다
// (globals.css의 @keyframes stripes 사용). 이미지 파일 없이 순수 CSS 그라디언트.

export default function MotionStripes() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.08] motion-safe:animate-[stripes_18s_linear_infinite] dark:opacity-[0.12]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, currentColor 0, currentColor 2px, transparent 2px, transparent 40px)",
        backgroundSize: "160px 160px",
        color: "var(--foreground)",
      }}
    />
  );
}
