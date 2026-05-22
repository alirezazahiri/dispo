import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
} from "@/components";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  previewLabel?: string;
  templateValues?: Record<string, string>;
};

const TEMPLATE_REGEX = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;

type Palette = {
  text: string;
  bg: string;
  cardAccent: string;
  cardDot: string;
};

const TEMPLATE_COLORS: Palette[] = [
  {
    text: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-500/15 dark:bg-blue-400/15",
    cardAccent: "border-blue-500/30",
    cardDot: "bg-blue-400",
  },
  {
    text: "text-violet-700 dark:text-violet-300",
    bg: "bg-violet-500/15 dark:bg-violet-400/15",
    cardAccent: "border-violet-500/30",
    cardDot: "bg-violet-400",
  },
  {
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-500/15 dark:bg-emerald-400/15",
    cardAccent: "border-emerald-500/30",
    cardDot: "bg-emerald-400",
  },
  {
    text: "text-cyan-700 dark:text-cyan-300",
    bg: "bg-cyan-500/15 dark:bg-cyan-400/15",
    cardAccent: "border-cyan-500/30",
    cardDot: "bg-cyan-400",
  },
];

const MISSING_TEMPLATE_PALETTE: Palette = {
  text: "text-red-700 dark:text-red-300",
  bg: "bg-red-500/15 dark:bg-red-400/15",
  cardAccent: "border-red-500/30",
  cardDot: "bg-red-400",
};

export function TemplateHighlightInput({
  value,
  onChange,
  placeholder,
  className,
  previewLabel = "Template variable",
  templateValues = {},
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  const segments = useMemo(() => splitTemplateSegments(value), [value]);
  const hasTemplates = segments.some((segment) => segment.type === "template");

  const syncScroll = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    setScrollLeft(input.scrollLeft);
  }, []);

  useLayoutEffect(() => {
    syncScroll();
  }, [value, syncScroll]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const handleScroll = () => syncScroll();
    input.addEventListener("scroll", handleScroll, { passive: true });
    return () => input.removeEventListener("scroll", handleScroll);
  }, [syncScroll]);

  const setCaretAt = useCallback((position: number) => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    requestAnimationFrame(() => {
      try {
        input.setSelectionRange(position, position);
        setScrollLeft(input.scrollLeft);
      } catch {
        // ignore selection errors on unsupported input types
      }
    });
  }, []);

  const selectRange = useCallback((start: number, end: number) => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    requestAnimationFrame(() => {
      try {
        input.setSelectionRange(start, end);
        setScrollLeft(input.scrollLeft);
      } catch {
        // ignore
      }
    });
  }, []);

  const handleTokenMouseDown = useCallback(
    (
      event: ReactMouseEvent<HTMLSpanElement>,
      startIndex: number,
      length: number,
    ) => {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0) {
        setCaretAt(startIndex + length);
        return;
      }
      const ratio = Math.max(
        0,
        Math.min(1, (event.clientX - rect.left) / rect.width),
      );
      const charOffset = Math.round(ratio * length);
      setCaretAt(startIndex + charOffset);
    },
    [setCaretAt],
  );

  const handleTokenDoubleClick = useCallback(
    (
      event: ReactMouseEvent<HTMLSpanElement>,
      startIndex: number,
      length: number,
    ) => {
      event.preventDefault();
      selectRange(startIndex, startIndex + length);
    },
    [selectRange],
  );

  return (
    <div className={cn("relative w-full", className)}>
      {hasTemplates ? (
        <div
          ref={overlayRef}
          className="
            pointer-events-none absolute inset-0 z-20 flex items-center
            overflow-hidden rounded-md px-3 py-2
            text-base md:text-sm
          "
          aria-hidden="true"
        >
          <div
            className="w-full whitespace-pre"
            style={{ transform: `translateX(${-scrollLeft}px)` }}
          >
            {segments.map((segment) => {
              if (segment.type === "text") {
                return (
                  <span
                    key={`t-${segment.startIndex}`}
                    className="whitespace-pre text-foreground/80"
                  >
                    {segment.content}
                  </span>
                );
              }

              const isFound = hasTemplateValue(segment.name, templateValues);
              const palette = isFound
                ? TEMPLATE_COLORS[segment.colorIndex]
                : MISSING_TEMPLATE_PALETTE;

              const tokenNode = (
                <span
                  className={cn(
                    "pointer-events-auto cursor-text whitespace-pre rounded-sm align-baseline",
                    "transition-colors",
                    palette.text,
                    palette.bg,
                  )}
                  onMouseDown={(event) =>
                    handleTokenMouseDown(
                      event,
                      segment.startIndex,
                      segment.content.length,
                    )
                  }
                  onDoubleClick={(event) =>
                    handleTokenDoubleClick(
                      event,
                      segment.startIndex,
                      segment.content.length,
                    )
                  }
                >
                  {segment.content}
                </span>
              );

              return (
                <HoverCard
                  key={`v-${segment.startIndex}`}
                  openDelay={120}
                  closeDelay={80}
                >
                  <HoverCardTrigger asChild>{tokenNode}</HoverCardTrigger>

                  <HoverCardContent
                    align="start"
                    sideOffset={8}
                    className={cn(
                      "min-w-[220px] w-auto rounded-md border bg-popover p-2 shadow-lg",
                      palette.cardAccent,
                    )}
                  >
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {previewLabel}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={cn("h-2 w-2 rounded-full", palette.cardDot)}
                      />
                      <code className="font-mono text-foreground">
                        {segment.name}
                      </code>
                    </div>
                    <div
                      className={cn(
                        "mt-1 break-all text-[11px] font-mono",
                        isFound
                          ? "text-muted-foreground"
                          : "text-red-500 dark:text-red-300",
                      )}
                    >
                      {isFound ? templateValues[segment.name] : "not found"}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>
        </div>
      ) : null}

      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setScrollLeft(event.target.scrollLeft);
        }}
        onScroll={syncScroll}
        onKeyUp={syncScroll}
        onClick={syncScroll}
        onSelect={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className={cn(
          hasTemplates
            ? "relative z-10 bg-transparent text-transparent caret-foreground selection:bg-primary/20 selection:text-transparent"
            : "",
        )}
      />
    </div>
  );
}

type Segment =
  | {
      type: "text";
      content: string;
      startIndex: number;
    }
  | {
      type: "template";
      content: string;
      name: string;
      startIndex: number;
      colorIndex: number;
    };

function splitTemplateSegments(value: string): Segment[] {
  if (!value) {
    return [];
  }

  const segments: Segment[] = [];
  let lastIndex = 0;
  const regex = new RegExp(TEMPLATE_REGEX);
  let match = regex.exec(value);

  while (match) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: value.slice(lastIndex, match.index),
        startIndex: lastIndex,
      });
    }

    const variableName = String(match[1] ?? "").trim();
    const matchEnd = match.index + match[0].length;
    segments.push({
      type: "template",
      content: match[0],
      name: variableName,
      startIndex: match.index,
      colorIndex: getColorIndex(variableName),
    });

    lastIndex = matchEnd;
    match = regex.exec(value);
  }

  if (lastIndex < value.length) {
    segments.push({
      type: "text",
      content: value.slice(lastIndex),
      startIndex: lastIndex,
    });
  }

  return segments;
}

function getColorIndex(variableName: string): number {
  let hash = 0;
  for (let index = 0; index < variableName.length; index += 1) {
    hash = (hash << 5) - hash + variableName.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash) % TEMPLATE_COLORS.length;
}

function hasTemplateValue(
  variableName: string,
  templateValues: Record<string, string>,
): boolean {
  return Object.prototype.hasOwnProperty.call(templateValues, variableName);
}
