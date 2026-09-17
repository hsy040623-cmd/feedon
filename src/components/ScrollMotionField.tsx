"use client";

import { useEffect, useRef } from "react";

// /start, /workspace 페이지 전체 뒤에 고정(fixed)되는 배경. 섹션마다 따로 애니메이션을 도는 게 아니라,
// 스크롤 위치(0~100%)를 목표값으로 두고 매 프레임 조금씩 따라가는(lerp) 방식으로 이동·회전·확대·진행선을
// 갱신하기 때문에, 스크롤이 멈춰도 잔여 움직임이 자연스럽게 이어지고 뚝뚝 끊기지 않는다.
// 큰 오브젝트와 진행선에는 네온처럼 보이도록 여러 겹의 drop-shadow/box-shadow 글로우를 줬다.

export default function ScrollMotionField({ showShape = true }: { showShape?: boolean }) {
  const shapeRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let target = 0;
    let current = 0;
    let rafId = 0;

    const computeTarget = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      target = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    };

    const apply = (progress: number) => {
      if (shapeRef.current) {
        const drift = progress * 70; // 스크롤할수록 아래로 크게 드리프트 (vh 단위)
        const rotate = progress * 220;
        const scale = 1 + progress * 0.4;
        shapeRef.current.style.transform = `translate(-50%, calc(-50% + ${drift}vh)) rotate(${rotate}deg) scale(${scale})`;
      }
      if (lineRef.current) {
        lineRef.current.style.transform = `scaleY(${progress})`;
      }
    };

    const loop = () => {
      // 목표값(current scroll 비율)을 향해 매 프레임 8%씩 따라가며 부드러운 관성 효과를 낸다
      current += (target - current) * 0.08;
      apply(current);
      rafId = requestAnimationFrame(loop);
    };

    const onScroll = () => computeTarget();

    computeTarget();
    current = target;
    rafId = requestAnimationFrame(loop);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      {/* 은은한 레드 글로우 */}
      <div className="absolute left-1/2 top-1/2 h-[55vmax] w-[55vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-3xl motion-safe:animate-pulse" />

      {/* 큰 단일 + 오브젝트 — 요청 입력 폼과 겹쳐 가독성을 해치는 페이지에서는 숨긴다 */}
      {showShape && (
        <div ref={shapeRef} className="absolute left-1/2 top-1/2 h-[62vmin] w-[62vmin]" style={{ transform: "translate(-50%, -50%)" }}>
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full drop-shadow-[0_0_18px_rgba(255,255,255,0.5)] drop-shadow-[0_0_55px_rgba(230,51,43,0.45)]"
          >
            <rect x="42" y="0" width="16" height="100" fill="white" fillOpacity="0.92" />
            <rect x="0" y="42" width="100" height="16" fill="white" fillOpacity="0.92" />
            <circle cx="50" cy="50" r="10" fill="#e6332b" />
          </svg>
        </div>
      )}

      {/* 오른쪽 진행선 — 스크롤할수록 아래로 자라난다 */}
      <div className="absolute right-6 top-0 h-full w-px bg-accent/20">
        <div
          ref={lineRef}
          className="h-full w-full origin-top bg-accent shadow-[0_0_12px_2px_rgba(230,51,43,0.7)]"
          style={{ transform: "scaleY(0)" }}
        />
      </div>
    </div>
  );
}
