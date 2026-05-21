"use client";

import React, { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { useWheelToHorizontalScroll } from "@/hooks/use-wheel-to-horizontal";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  wheelToHorizontalScroll?: boolean;
};

export function DragScrollArea({
  className,
  children,
  wheelToHorizontalScroll,
  ...props
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const isDraggingRef = useRef(false);

  const startXRef = useRef(0);

  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;

    if (!el) return;

    isDraggingRef.current = true;

    startXRef.current = e.pageX;

    scrollLeftRef.current = el.scrollLeft;

    el.classList.add("cursor-grabbing");

    document.body.style.userSelect = "none";
  };

  const handleMouseUp = () => {
    const el = ref.current;

    isDraggingRef.current = false;

    el?.classList.remove("cursor-grabbing");

    document.body.style.userSelect = "";
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;

    if (!el || !isDraggingRef.current) {
      return;
    }

    const delta = e.pageX - startXRef.current;

    el.scrollLeft = scrollLeftRef.current - delta;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = ref.current;

    if (!el) return;

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  };

  useWheelToHorizontalScroll({ ref, enable: wheelToHorizontalScroll });

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      className={cn(
        `
          cursor-pointer
          overflow-x-auto
          overflow-y-hidden
          select-none
        `,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
