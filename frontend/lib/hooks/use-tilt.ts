"use client";

import { useRef } from "react";
import type { MouseEvent } from "react";
import { useMotionValue, useSpring, useTransform } from "framer-motion";

const TILT_RANGE_DEG = 6;
const SPRING_CONFIG = { stiffness: 300, damping: 30, mass: 0.5 };

export function useTilt() {
  const ref = useRef<HTMLDivElement>(null);

  // Normalized pointer position within the element, 0..1 on each axis.
  // Resting/leave state is 0.5, 0.5 (dead center) so it maps to 0deg tilt.
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const rawRotateX = useTransform(pointerY, [0, 1], [TILT_RANGE_DEG, -TILT_RANGE_DEG]);
  const rawRotateY = useTransform(pointerX, [0, 1], [-TILT_RANGE_DEG, TILT_RANGE_DEG]);

  const rotateX = useSpring(rawRotateX, SPRING_CONFIG);
  const rotateY = useSpring(rawRotateY, SPRING_CONFIG);

  const onMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    pointerX.set(x);
    pointerY.set(y);
  };

  const onMouseLeave = () => {
    pointerX.set(0.5);
    pointerY.set(0.5);
  };

  return { ref, rotateX, rotateY, onMouseMove, onMouseLeave };
}