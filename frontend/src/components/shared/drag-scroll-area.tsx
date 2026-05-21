"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function DragScrollArea({ className, children, ...props }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);

  const isDraggingRef = React.useRef(false);

  const startXRef = React.useRef(0);

  const scrollLeftRef = React.useRef(0);

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

  React.useEffect(() => {
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
          scrollbar-hidden
          cursor-grab
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
