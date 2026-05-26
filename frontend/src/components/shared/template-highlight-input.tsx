import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  Popover,
  PopoverAnchor,
  PopoverContent,
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
const VARIABLE_NAME_REGEX = /^[A-Za-z0-9_.-]*$/;
const TRAILING_VARIABLE_REGEX = /^[A-Za-z0-9_.-]*\s*\}\}/;

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

type AutocompleteState = {
  open: boolean;
  query: string;
  templateStart: number;
  caret: number;
  selectedIndex: number;
};

const INITIAL_AUTOCOMPLETE_STATE: AutocompleteState = {
  open: false,
  query: "",
  templateStart: -1,
  caret: 0,
  selectedIndex: 0,
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
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [autocomplete, setAutocomplete] = useState<AutocompleteState>(
    INITIAL_AUTOCOMPLETE_STATE,
  );
  const [anchorOffset, setAnchorOffset] = useState(0);

  const segments = useMemo(() => splitTemplateSegments(value), [value]);
  const hasTemplates = segments.some((segment) => segment.type === "template");

  const templateKeys = useMemo(
    () =>
      Object.keys(templateValues).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      ),
    [templateValues],
  );

  const suggestions = useMemo(() => {
    if (!autocomplete.open) {
      return [] as string[];
    }
    const query = autocomplete.query.toLowerCase();
    if (!query) {
      return templateKeys;
    }
    const startsWith: string[] = [];
    const contains: string[] = [];
    for (const key of templateKeys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.startsWith(query)) {
        startsWith.push(key);
      } else if (lowerKey.includes(query)) {
        contains.push(key);
      }
    }
    return [...startsWith, ...contains];
  }, [autocomplete.open, autocomplete.query, templateKeys]);

  const isAutocompleteVisible =
    autocomplete.open && suggestions.length > 0 && templateKeys.length > 0;

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

  const closeAutocomplete = useCallback(() => {
    setAutocomplete((state) =>
      state.open ? { ...state, open: false } : state,
    );
  }, []);

  const detectAutocomplete = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    if (templateKeys.length === 0) {
      closeAutocomplete();
      return;
    }

    const caret = input.selectionStart ?? input.value.length;
    const before = input.value.slice(0, caret);
    const lastOpen = before.lastIndexOf("{{");

    if (lastOpen === -1) {
      closeAutocomplete();
      return;
    }

    const between = before.slice(lastOpen + 2);
    if (between.includes("}}")) {
      closeAutocomplete();
      return;
    }

    const query = between.trim();
    if (!VARIABLE_NAME_REGEX.test(query)) {
      closeAutocomplete();
      return;
    }

    setAutocomplete((prev) => {
      const sameTemplate = prev.templateStart === lastOpen && prev.open;
      return {
        open: true,
        query,
        templateStart: lastOpen,
        caret,
        selectedIndex: sameTemplate ? prev.selectedIndex : 0,
      };
    });
  }, [closeAutocomplete, templateKeys.length]);

  useEffect(() => {
    detectAutocomplete();
  }, [value, detectAutocomplete]);

  useEffect(() => {
    if (!autocomplete.open) return;
    if (suggestions.length === 0) return;
    if (autocomplete.selectedIndex >= suggestions.length) {
      setAutocomplete((state) => ({ ...state, selectedIndex: 0 }));
    }
  }, [autocomplete.open, autocomplete.selectedIndex, suggestions.length]);

  useEffect(() => {
    if (!isAutocompleteVisible) return;
    const element = itemRefs.current[autocomplete.selectedIndex];
    if (element) {
      element.scrollIntoView({ block: "nearest" });
    }
  }, [isAutocompleteVisible, autocomplete.selectedIndex]);

  const recomputeAnchor = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    if (autocomplete.templateStart < 0) return;
    const textBefore = input.value.slice(0, autocomplete.templateStart);
    const measured = measureInputTextWidth(input, textBefore);
    const paddingLeft = parseFloat(
      window.getComputedStyle(input).paddingLeft || "0",
    );
    const rawX = paddingLeft + measured - input.scrollLeft;
    const maxX = input.clientWidth - 8;
    setAnchorOffset(Math.max(0, Math.min(rawX, maxX)));
  }, [autocomplete.templateStart]);

  useLayoutEffect(() => {
    if (!isAutocompleteVisible) return;
    recomputeAnchor();
  }, [isAutocompleteVisible, value, scrollLeft, recomputeAnchor]);

  const insertSuggestion = useCallback(
    (name: string) => {
      const input = inputRef.current;
      if (!input) return;
      const start = autocomplete.templateStart;
      const caret = input.selectionStart ?? autocomplete.caret;
      if (start === -1) return;

      const currentValue = input.value;
      const after = currentValue.slice(caret);
      const trailingMatch = after.match(TRAILING_VARIABLE_REGEX);
      const endOfReplacement = trailingMatch
        ? caret + trailingMatch[0].length
        : caret;

      const replacement = `{{${name}}}`;
      const newValue =
        currentValue.slice(0, start) +
        replacement +
        currentValue.slice(endOfReplacement);

      const newCaret = start + replacement.length;

      setAutocomplete({
        ...INITIAL_AUTOCOMPLETE_STATE,
        caret: newCaret,
      });

      onChange(newValue);

      requestAnimationFrame(() => {
        const target = inputRef.current;
        if (!target) return;
        target.focus();
        try {
          target.setSelectionRange(newCaret, newCaret);
          setScrollLeft(target.scrollLeft);
        } catch {
          // ignore selection errors
        }
      });
    },
    [autocomplete.templateStart, autocomplete.caret, onChange],
  );

  const handleInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (!isAutocompleteVisible) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setAutocomplete((state) => ({
          ...state,
          selectedIndex: (state.selectedIndex + 1) % suggestions.length,
        }));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setAutocomplete((state) => ({
          ...state,
          selectedIndex:
            (state.selectedIndex - 1 + suggestions.length) % suggestions.length,
        }));
      } else if (event.key === "Enter" || event.key === "Tab") {
        const selected = suggestions[autocomplete.selectedIndex];
        if (selected) {
          event.preventDefault();
          insertSuggestion(selected);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeAutocomplete();
      } else if (event.key === "Home" || event.key === "End") {
        // Caret will move; recompute after default behavior
        window.requestAnimationFrame(detectAutocomplete);
      }
    },
    [
      isAutocompleteVisible,
      suggestions,
      autocomplete.selectedIndex,
      insertSuggestion,
      closeAutocomplete,
      detectAutocomplete,
    ],
  );

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
    <Popover
      open={isAutocompleteVisible}
      onOpenChange={(open) => {
        if (!open) {
          closeAutocomplete();
        }
      }}
    >
      <div className={cn("relative w-full", className)}>
        <PopoverAnchor asChild>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{
              left: anchorOffset,
              top: 0,
              bottom: 0,
              width: 1,
            }}
          />
        </PopoverAnchor>

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

                const isFound = hasTemplateValue(
                  segment.name,
                  templateValues,
                );
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
                          className={cn(
                            "h-2 w-2 rounded-full",
                            palette.cardDot,
                          )}
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
          onKeyDown={handleInputKeyDown}
          onKeyUp={syncScroll}
          onClick={() => {
            syncScroll();
            detectAutocomplete();
          }}
          onSelect={() => {
            syncScroll();
            detectAutocomplete();
          }}
          onBlur={() => {
            // Defer closing so clicks on suggestions still register.
            window.setTimeout(() => {
              const active = document.activeElement;
              const inListItem = listRef.current?.contains(active as Node);
              if (!inListItem) {
                closeAutocomplete();
              }
            }, 120);
          }}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isAutocompleteVisible}
          aria-controls={
            isAutocompleteVisible ? "template-suggestions" : undefined
          }
          aria-activedescendant={
            isAutocompleteVisible
              ? `template-suggestion-${autocomplete.selectedIndex}`
              : undefined
          }
          className={cn(
            hasTemplates
              ? "relative z-10 bg-transparent text-transparent caret-foreground selection:bg-primary/20 selection:text-transparent"
              : "",
          )}
        />
      </div>

      <PopoverContent
        id="template-suggestions"
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (
            inputRef.current &&
            event.target instanceof Node &&
            inputRef.current.contains(event.target)
          ) {
            event.preventDefault();
          }
        }}
        className="w-72 max-w-[min(20rem,calc(100vw-1rem))] p-1"
      >
        <div className="px-2 pb-1.5 pt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          Environment variables
        </div>
        <div
          ref={listRef}
          role="listbox"
          className="max-h-64 overflow-y-auto"
        >
          {suggestions.map((name, index) => {
            const selected = index === autocomplete.selectedIndex;
            const palette = TEMPLATE_COLORS[getColorIndex(name)];
            const preview = templateValues[name];
            return (
              <button
                key={name}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                id={`template-suggestion-${index}`}
                type="button"
                role="option"
                aria-selected={selected}
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertSuggestion(name);
                }}
                onMouseEnter={() => {
                  setAutocomplete((state) => ({
                    ...state,
                    selectedIndex: index,
                  }));
                }}
                className={cn(
                  "group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
                  selected
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/60",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    palette.cardDot,
                  )}
                />
                <span
                  className={cn(
                    "truncate font-mono text-xs",
                    selected ? "" : palette.text,
                  )}
                >
                  {name}
                </span>
                {preview ? (
                  <span className="ml-auto max-w-[55%] truncate font-mono text-[10px] text-muted-foreground">
                    {preview}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="border-t border-border/60 px-2 pb-1 pt-1.5 text-[10px] text-muted-foreground">
          <span className="font-mono">↑↓</span> navigate{" "}
          <span className="mx-1">·</span>
          <span className="font-mono">Enter</span> insert{" "}
          <span className="mx-1">·</span>
          <span className="font-mono">Esc</span> close
        </div>
      </PopoverContent>
    </Popover>
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

let measurementCanvas: HTMLCanvasElement | null = null;

function measureInputTextWidth(
  input: HTMLInputElement,
  text: string,
): number {
  if (typeof document === "undefined") return 0;
  if (!measurementCanvas) {
    measurementCanvas = document.createElement("canvas");
  }
  const ctx = measurementCanvas.getContext("2d");
  if (!ctx) return 0;
  const style = window.getComputedStyle(input);
  ctx.font = `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const letterSpacing = style.letterSpacing;
  if (letterSpacing && letterSpacing !== "normal") {
    (ctx as unknown as { letterSpacing: string }).letterSpacing =
      letterSpacing;
  }
  return ctx.measureText(text).width;
}
