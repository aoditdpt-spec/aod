"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import type { ReactNode } from "react";

// A card that tilts towards the pointer in 3D, with a soft light following the cursor.
export function TiltCard({ children, className = "", max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const spring = { stiffness: 200, damping: 18 };
  const rotateX = useSpring(useTransform(y, [0, 1], [max, -max]), spring);
  const rotateY = useSpring(useTransform(x, [0, 1], [-max, max]), spring);
  const lightX = useTransform(x, (v) => `${v * 100}%`);
  const lightY = useTransform(y, (v) => `${v * 100}%`);
  const light = useMotionTemplate`radial-gradient(circle at ${lightX} ${lightY}, rgba(255,255,255,0.55), transparent 60%)`;

  return (
    <div className="h-full [perspective:900px]">
      <motion.div
        className={`relative h-full [transform-style:preserve-3d] ${className}`}
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
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 [.group:hover_&]:opacity-100"
          style={{ background: light }}
        />
      </motion.div>
    </div>
  );
}
