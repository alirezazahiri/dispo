import { useEffect, useMemo, useRef } from "react";
import { debounce, type DebouncedFunction } from "@/lib/utils";

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number,
): DebouncedFunction<T> {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debounced = useMemo(
    () =>
      debounce<T>(
        ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
        delay,
      ),
    [delay],
  );

  useEffect(() => {
    return () => {
      debounced.cancel();
    };
  }, [debounced]);

  return debounced;
}
