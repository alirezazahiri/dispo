import { Plus, Trash2 } from "lucide-react";
import { Button, Checkbox, Input } from "@/components";

export type KeyValueRow = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

type Props = {
  title: string;
  rows: KeyValueRow[];
  onAddRow: () => void;
  onUpdateRow: (rowId: string, data: Partial<KeyValueRow>) => void;
  onRemoveRow: (rowId: string) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  emptyMessage?: string;
};

export function KeyValueRowsEditor({
  title,
  rows,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  emptyMessage = "No rows yet. Add one to get started.",
}: Props) {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{title}</div>
        <Button onClick={onAddRow} variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
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
                    onUpdateRow(row.id, {
                      enabled: checked,
                    })
                  }
                  aria-label={`Toggle ${title} row`}
                />
              </div>

              <Input
                value={row.key}
                onChange={(event) =>
                  onUpdateRow(row.id, {
                    key: event.target.value,
                  })
                }
                placeholder={keyPlaceholder}
              />

              <Input
                value={row.value}
                onChange={(event) =>
                  onUpdateRow(row.id, {
                    value: event.target.value,
                  })
                }
                placeholder={valuePlaceholder}
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveRow(row.id)}
                className="text-muted-foreground"
                aria-label={`Remove ${title} row`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {!rows.length ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              {emptyMessage}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
