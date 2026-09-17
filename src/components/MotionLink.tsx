"use client";

import { useRouter } from "next/navigation";
import { useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";

// 클릭 즉시 페이지를 이동하지 않고, 살짝 눌렸다가 돌아오는 모션을 먼저 보여준 뒤 이동한다.
// next/link 대신 이 컴포넌트를 쓰는 곳에서는 "모션 자체가 버튼" 느낌을 준다.
const PRESS_DURATION_MS = 180;

interface MotionLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> {
  href: string;
  children: ReactNode;
}

export default function MotionLink({ href, className, children, ...rest }: MotionLinkProps) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setPressed(true);
    window.setTimeout(() => {
      setPressed(false);
      router.push(href);
    }, PRESS_DURATION_MS);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`${className ?? ""} transition-all duration-150 ease-out will-change-transform ${
        pressed ? "scale-90" : "scale-100"
      }`}
      {...rest}
    >
      {children}
    </a>
  );
}
