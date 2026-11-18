"use client";

import * as m from "motion/react-m";
import { useMotionValue, useSpring, useTransform } from "motion/react";
import type { ReactNode } from "react";

// The animation for cards that don't open anything (facts, promises, checks; first used on
// "Book with confidence"): they arrive in a wave (put them in a StaggerList / StaggerItem), then
// on hover they only tilt towards the pointer in 3D, pop up and zoom in a little. No colour
// change, border change, glow or light (a white light used to follow the cursor; removed on
// purpose). Cards that open a page use the hover styles in src/components/ui/cards.ts instead.
// The card fills its grid cell (`fill`) unless something sits under it in the same cell.
export function TiltCard({
  children,
  className = "",
  max = 8,
  fill = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  fill?: boolean;
}) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const spring = { stiffness: 200, damping: 18 };
  const rotateX = useSpring(useTransform(y, [0, 1], [max, -max]), spring);
  const rotateY = useSpring(useTransform(x, [0, 1], [-max, max]), spring);

  return (
    <div className={`[perspective:900px] ${fill ? "h-full" : ""}`}>
      <m.div
        className={`group group/tilt relative [transform-style:preserve-3d] ${fill ? "h-full" : ""} ${className}`}
        style={{ rotateX, rotateY }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          x.set((e.clientX - r.left) / r.width);
          y.set((e.clientY - r.top) / r.height);
        }}
        onPointerLeave={() => {
          x.set(0.5);
          y.set(0.5);
        }}
        whileHover={{ scale: 1.03, y: -6 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {children}
      </m.div>
    </div>
  );
}
