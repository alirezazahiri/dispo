import { RefObject, useEffect } from "react";

type Props = {
  ref: RefObject<HTMLElement>;
  enable?: boolean;
};

/**
 * Redirects vertical mouse-wheel motion into horizontal scrolling on the
 * referenced element.
 *
 * Behaviour:
 * - Only intercepts when the wheel motion is predominantly vertical
 *   (horizontal trackpad / shift+wheel gestures are left untouched, so the
 *   browser scrolls them natively).
 * - Only intercepts when the element actually has horizontal overflow.
 * - Calls `preventDefault()` so the parent / page does not also scroll
 *   vertically while we redirect the wheel. Listener is registered with
 *   `{ passive: false }` so the call has effect.
 * - At the horizontal scroll bounds the wheel is passed back through to
 *   the parent, giving a natural hand-off (the page can continue scrolling
 *   vertically once the user has scrolled the list to the end).
 */
export const useWheelToHorizontalScroll = ({ ref, enable = true }: Props) => {
  useEffect(() => {
    if (!enable) return;

    const element = ref.current;

    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const maxScrollLeft = element.scrollWidth - element.clientWidth;

      if (maxScrollLeft <= 0) return;

      const goingRight = event.deltaY > 0;
      const atStart = element.scrollLeft <= 0;
      const atEnd = element.scrollLeft >= maxScrollLeft;

      if ((goingRight && atEnd) || (!goingRight && atStart)) return;

      event.preventDefault();

      const next = element.scrollLeft + event.deltaY;

      element.scrollLeft = Math.max(0, Math.min(maxScrollLeft, next));
    };

    element.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      element.removeEventListener("wheel", onWheel);
    };
  }, [enable, ref]);
};
