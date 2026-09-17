"use client";

import { useState, type ButtonHTMLAttributes } from "react";

// 클릭 즉시 동작(제출 등)을 실행하지 않고, 버튼이 살짝 눌렸다가 돌아오는 모션을 먼저 보여준 뒤
// 실제 동작을 실행한다. "모션 자체가 버튼"이 되도록 하기 위함.
const PRESS_DURATION_MS = 180;

interface MotionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  onPress: () => void;
}

export default function MotionButton({
  onPress,
  className,
  children,
  disabled,
  ...rest
}: MotionButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setPressed(true);
    window.setTimeout(() => {
      setPressed(false);
      onPress();
    }, PRESS_DURATION_MS);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`${className ?? ""} transition-all duration-150 ease-out will-change-transform ${
        pressed ? "scale-90" : "scale-100"
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}
