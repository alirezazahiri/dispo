import { RefObject, useEffect } from "react";

type Props = {
  ref: RefObject<HTMLElement>;
  enable?: boolean;
};

export const useWheelToHorizontalScroll = ({ ref, enable = true }: Props) => {
  useEffect(() => {
    if (!enable) return;

    const element = ref.current;

    if (!element) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        element.scrollLeft += event.deltaY;
      }
    };

    element.addEventListener("wheel", onWheel);

    return () => {
      element.removeEventListener("wheel", onWheel);
    };
  }, []);
};
