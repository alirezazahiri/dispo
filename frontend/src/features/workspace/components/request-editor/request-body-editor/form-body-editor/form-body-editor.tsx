import { useCallback, useMemo } from "react";
import { nanoid } from "nanoid";
import { Plus } from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import type { FormBodyContentType } from "@/types";
import { useWorkspaceUpdateTab } from "../../../../stores";
import type { FormBodyField, RequestTab } from "../../../../types";
import {
  FORM_CONTENT_TYPE_LABELS,
  FORM_CONTENT_TYPES,
} from "../constants";
import { buildBodyUpdate } from "../utils";
import { FormBodyRow } from "./form-body-row";

type Props = {
  tab: RequestTab;
};

function createEmptyField(): FormBodyField {
  return {
    id: nanoid(),
    enabled: true,
    kind: "text",
    key: "",
    value: "",
  };
}

export function FormBodyEditor({ tab }: Props) {
  const updateTab = useWorkspaceUpdateTab();
  const fields = useMemo(() => tab.formFields ?? [], [tab.formFields]);
  const subtype = tab.formSubtype ?? "application/x-www-form-urlencoded";
  const allowFileKind = subtype === "multipart/form-data";

  const writeFields = useCallback(
    (nextFields: FormBodyField[]) => {
      updateTab(tab.id, {
        formFields: nextFields,
        isDirty: true,
      });
    },
    [tab.id, updateTab],
  );

  const handleAddRow = () => {
    writeFields([...fields, createEmptyField()]);
  };

  const handleUpdateRow = (rowId: string, data: Partial<FormBodyField>) => {
    writeFields(
      fields.map((row) =>
        row.id === rowId
          ? {
              ...row,
              ...data,
            }
          : row,
      ),
    );
  };

  const handleRemoveRow = (rowId: string) => {
    writeFields(fields.filter((row) => row.id !== rowId));
  };

  const handleSubtypeChange = (value: string) => {
    const nextSubtype = value as FormBodyContentType;
    if (nextSubtype === subtype) return;

    // Switching to url-encoded coerces every file row back to text so we
    // don't silently drop file data behind a setting toggle.
    const nextFields =
      nextSubtype === "application/x-www-form-urlencoded"
        ? fields.map((field) =>
            field.kind === "file"
              ? {
                  ...field,
                  kind: "text" as const,
                  value: "",
                  fileName: undefined,
                  fileContentType: undefined,
                  fileSize: undefined,
                }
              : field,
          )
        : fields;

    updateTab(tab.id, {
      ...buildBodyUpdate(tab, {
        formSubtype: nextSubtype,
      }),
      formFields: nextFields,
      isDirty: true,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">Form Data</div>
          <Select value={subtype} onValueChange={handleSubtypeChange}>
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORM_CONTENT_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="text-xs">
                  <div className="flex flex-col">
                    <span>{FORM_CONTENT_TYPE_LABELS[type]}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleAddRow}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="min-w-[640px] space-y-2">
          <div
            className={
              allowFileKind
                ? "grid grid-cols-[60px_1fr_110px_1.4fr_40px] gap-2 px-2 text-xs text-muted-foreground"
                : "grid grid-cols-[60px_1fr_1fr_40px] gap-2 px-2 text-xs text-muted-foreground"
            }
          >
            <div>Enabled</div>
            <div>Key</div>
            {allowFileKind ? <div>Type</div> : null}
            <div>Value</div>
            <div />
          </div>

          {fields.map((row) => (
            <FormBodyRow
              key={row.id}
              row={row}
              allowFileKind={allowFileKind}
              onUpdate={(data) => handleUpdateRow(row.id, data)}
              onRemove={() => handleRemoveRow(row.id)}
            />
          ))}

          {!fields.length ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No fields yet. Click <span className="font-medium">Add Field</span>{" "}
              to compose your form body.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
