"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";
import { useWheelToHorizontalScroll } from "@/hooks/use-wheel-to-horizontal";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  wheelToHorizontalScroll?: boolean;
};

/**
 * Minimum pointer travel (px) before a press is treated as a drag.
 * Anything below this still produces a normal `click` on the child,
 * so tab buttons keep working for single clicks.
 */
const DRAG_START_THRESHOLD_PX = 4;

/**
 * Horizontal scroll container that can also be panned by dragging.
 *
 * UX notes:
 * - `mousemove`/`mouseup` are listened on `window` for the duration of a
 *   gesture, so the drag continues to follow the cursor even when it
 *   leaves the strip (the classic "the scroll froze when I moved out"
 *   issue).
 * - A small movement threshold prevents accidental clicks from being
 *   reinterpreted as drags.
 * - A click that immediately follows a real drag is swallowed via the
 *   capture phase, so dragging never accidentally activates a child.
 */
export const DragScrollArea = forwardRef<HTMLDivElement, Props>(
  function DragScrollArea(
    {
      className,
      children,
      wheelToHorizontalScroll = true,
      onMouseDown: onMouseDownProp,
      ...props
    },
    forwardedRef,
  ) {
    const ref = useRef<HTMLDivElement>(null);

    useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement, []);

    const isDraggingRef = useRef(false);
    const justDraggedRef = useRef(false);

    useWheelToHorizontalScroll({ ref, enable: wheelToHorizontalScroll });

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
      onMouseDownProp?.(event);

      if (event.button !== 0 || event.defaultPrevented) return;

      const el = ref.current;

      if (!el) return;

      justDraggedRef.current = false;

      const startX = event.clientX;
      const startScrollLeft = el.scrollLeft;

      const handleWindowMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;

        if (!isDraggingRef.current) {
          if (Math.abs(delta) < DRAG_START_THRESHOLD_PX) return;

          isDraggingRef.current = true;
          el.classList.add("cursor-grabbing");
          document.body.style.userSelect = "none";
        }

        el.scrollLeft = startScrollLeft - delta;
      };

      const handleWindowMouseUp = () => {
        window.removeEventListener("mousemove", handleWindowMouseMove);
        window.removeEventListener("mouseup", handleWindowMouseUp);

        if (isDraggingRef.current) {
          justDraggedRef.current = true;
          isDraggingRef.current = false;
          el.classList.remove("cursor-grabbing");
          document.body.style.userSelect = "";
        }
      };

      window.addEventListener("mousemove", handleWindowMouseMove);
      window.addEventListener("mouseup", handleWindowMouseUp);
    };

    const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
      if (justDraggedRef.current) {
        event.preventDefault();
        event.stopPropagation();
        justDraggedRef.current = false;
      }
    };

    return (
      <div
        ref={ref}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
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
  },
);
