"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import type { ReactNode } from "react";

// The site-wide card animation (first used on "Book with confidence"):
// cards arrive in a wave (put them in a StaggerList / StaggerItem), then on hover they tilt
// towards the pointer in 3D, grow slightly, a soft light follows the cursor, the border warms
// (`cardHover`) and the icon pops (`iconHover`). Use these three together on every card grid.
export const cardHover = "transition-colors duration-300 hover:border-brand/40";
export const iconHover = "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6";

// A card that tilts towards the pointer in 3D, with a soft light following the cursor.
// `tone="dark"` dims the light for cards on dark backgrounds. The card fills its grid cell
// (`fill`) unless something sits under it in the same cell.
export function TiltCard({
  children,
  className = "",
  max = 8,
  tone = "light",
  fill = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  tone?: "light" | "dark";
  fill?: boolean;
}) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const spring = { stiffness: 200, damping: 18 };
  const rotateX = useSpring(useTransform(y, [0, 1], [max, -max]), spring);
  const rotateY = useSpring(useTransform(x, [0, 1], [-max, max]), spring);
  const lightX = useTransform(x, (v) => `${v * 100}%`);
  const lightY = useTransform(y, (v) => `${v * 100}%`);
  const glow = tone === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.55)";
  const light = useMotionTemplate`radial-gradient(circle at ${lightX} ${lightY}, ${glow}, transparent 60%)`;

  return (
    <div className={`[perspective:900px] ${fill ? "h-full" : ""}`}>
      <motion.div
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
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
          style={{ background: light }}
        />
      </motion.div>
    </div>
  );
}
