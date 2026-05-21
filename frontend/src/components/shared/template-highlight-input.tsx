import { useMemo, useRef, useState } from "react";
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
const TEMPLATE_COLORS = [
  {
    badge: "text-blue-700 dark:text-blue-300",
    cardAccent: "border-blue-500/30",
    cardDot: "bg-blue-400",
  },
  {
    badge: "text-violet-700 dark:text-violet-300",
    cardAccent: "border-violet-500/30",
    cardDot: "bg-violet-400",
  },
  {
    badge: "text-emerald-700 dark:text-emerald-300",
    cardAccent: "border-emerald-500/30",
    cardDot: "bg-emerald-400",
  },
  {
    badge: "text-cyan-700 dark:text-cyan-300",
    cardAccent: "border-green-500/30",
    cardDot: "bg-green-400",
  },
];

const MISSING_TEMPLATE_COLORS = {
  badge: "text-red-700 dark:text-red-300",
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
  const [isEditing, setIsEditing] = useState(false);

  const segments = useMemo(() => splitTemplateSegments(value), [value]);
  const hasTemplates = segments.some((segment) => segment.type === "template");

  return (
    <div className={cn("relative w-full", className)}>
      {hasTemplates ? (
        <div
          className="
            absolute inset-0 z-20 flex items-center pointer-events-none
            overflow-hidden rounded-md px-3 py-2
            text-base md:text-sm
          "
          aria-hidden="true"
        >
          <div className="w-full overflow-hidden whitespace-nowrap">
            {segments.map((segment, index) => {
              if (segment.type === "text") {
                return (
                  <span
                    key={`${segment.content}-${index}`}
                    className="whitespace-pre text-foreground/80"
                  >
                    {segment.content}
                  </span>
                );
              }

              const color = TEMPLATE_COLORS[segment.colorIndex];
              const isFound = hasTemplateValue(segment.name, templateValues);
              const palette = isFound ? color : MISSING_TEMPLATE_COLORS;

              const tokenNode = (
                <span
                  className={cn(
                    `
                      pointer-events-auto whitespace-pre
                      align-baseline
                    `,
                    palette.badge,
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    inputRef.current?.focus();
                  }}
                >
                  {segment.content}
                </span>
              );

              if (isEditing) {
                return <span key={`${segment.content}-${index}`}>{tokenNode}</span>;
              }

              return (
                <HoverCard key={`${segment.content}-${index}`} openDelay={50} closeDelay={50}>
                  <HoverCardTrigger asChild>
                    {tokenNode}
                  </HoverCardTrigger>

                  <HoverCardContent
                    align="start"
                    sideOffset={8}
                    className={cn(
                      `
                        min-w-[220px] w-auto rounded-md border bg-popover p-2
                        shadow-lg
                      `,
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
                      <code className="font-mono text-foreground">{segment.name}</code>
                    </div>
                    <div
                      className={cn(
                        "mt-1 text-[11px] font-mono",
                        isFound ? "text-muted-foreground" : "text-red-300",
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
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        placeholder={placeholder}
        className={cn(
          hasTemplates
            ? "relative z-10 bg-transparent text-transparent caret-foreground selection:bg-primary/20"
            : "",
        )}
      />
    </div>
  );
}

type Segment = {
  type: "text" | "template";
  content: string;
  name: string;
  colorIndex: number;
};

function splitTemplateSegments(value: string): Segment[] {
  if (!value) {
    return [
      {
        type: "text",
        content: "",
        name: "",
        colorIndex: 0,
      },
    ];
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
        name: "",
        colorIndex: 0,
      });
    }

    const variableName = String(match[1] ?? "").trim();
    const matchEnd = match.index + match[0].length;
    segments.push({
      type: "template",
      content: match[0],
      name: variableName,
      colorIndex: getColorIndex(variableName),
    });

    lastIndex = matchEnd;
    match = regex.exec(value);
  }

  if (lastIndex < value.length) {
    segments.push({
      type: "text",
      content: value.slice(lastIndex),
      name: "",
      colorIndex: 0,
    });
  }

  return segments.length
    ? segments
    : [
        {
          type: "text",
          content: value,
          name: "",
          colorIndex: 0,
        },
      ];
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
