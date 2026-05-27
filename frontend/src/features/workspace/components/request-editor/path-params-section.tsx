import { Info, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Checkbox,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components";
import { TemplateHighlightInput } from "@/components/shared";
import type { KeyValuePair } from "../../types";

type PathParamsSectionProps = {
  rows: KeyValuePair[];
  orphanCount: number;
  onAddRow: () => void;
  onUpdateRow: (rowId: string, data: Partial<KeyValuePair>) => void;
  onRemoveRow: (rowId: string) => void;
  templateValues: Record<string, string>;
};

export function PathParamsSection({
  rows,
  orphanCount,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  templateValues,
}: PathParamsSectionProps) {
  return (
    <div className="border-b border-border">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-sm text-muted-foreground">Path Params</div>

          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="About path params"
                  className="
                    inline-flex h-5 w-5 items-center justify-center
                    rounded text-muted-foreground/70
                    hover:bg-accent/60 hover:text-foreground
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-ring
                  "
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-xs">
                <p className="text-xs leading-relaxed">
                  Type <code className="font-mono">:name</code> in the URL to
                  auto-add a row, or define rows here first and reference them
                  by name.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {orphanCount > 0 ? (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 truncate">
              {orphanCount} row{orphanCount === 1 ? "" : "s"} not referenced
              from the URL
            </span>
          ) : null}
        </div>
        <Button
          onClick={onAddRow}
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
      </div>

      <div className="p-4">
        <div className="min-w-[640px] space-y-2">
          <div className="grid grid-cols-[80px_1fr_1fr_48px] gap-2 text-xs text-muted-foreground px-2">
            <div>Enabled</div>
            <div>Key</div>
            <div>Value</div>
            <div />
          </div>

          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[80px_1fr_1fr_48px] gap-2 items-center"
            >
              <div className="flex items-center pl-1">
                <Checkbox
                  checked={row.enabled}
                  onCheckedChange={(checked) =>
                    onUpdateRow(row.id, { enabled: checked })
                  }
                  aria-label="Toggle path param row"
                />
              </div>

              <Input
                value={row.key}
                onChange={(event) =>
                  onUpdateRow(row.id, { key: event.target.value })
                }
                placeholder="Key"
              />

              <TemplateHighlightInput
                value={row.value}
                onChange={(value) => onUpdateRow(row.id, { value })}
                placeholder={
                  row.key
                    ? `:${row.key} param value...`
                    : "Path param value..."
                }
                previewLabel="Template variable"
                templateValues={templateValues}
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveRow(row.id)}
                className="text-muted-foreground"
                aria-label="Remove path param row"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No path params yet. Add one here, or type{" "}
              <code className="font-mono">:name</code> in the URL.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
