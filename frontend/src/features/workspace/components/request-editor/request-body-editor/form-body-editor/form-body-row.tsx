import { Trash2 } from "lucide-react";
import {
  Button,
  Checkbox,
  Input,
  ToggleGroup,
  ToggleGroupItem,
} from "@/components";
import { FilePickerChip, type PickedFile } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { FormBodyField, FormBodyFieldKind } from "../../../../types";

type Props = {
  row: FormBodyField;
  allowFileKind: boolean;
  onUpdate: (data: Partial<FormBodyField>) => void;
  onRemove: () => void;
};

const KIND_OPTIONS: { value: FormBodyFieldKind; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "file", label: "File" },
];

export function FormBodyRow({ row, allowFileKind, onUpdate, onRemove }: Props) {
  const handleKindChange = (kind: FormBodyFieldKind) => {
    if (kind === row.kind) return;
    if (kind === "file") {
      onUpdate({
        kind: "file",
        value: "",
      });
      return;
    }
    onUpdate({
      kind: "text",
      value: "",
      fileName: undefined,
      filePath: undefined,
      fileContentType: undefined,
      fileSize: undefined,
    });
  };

  const handleFilePicked = (picked: PickedFile) => {
    onUpdate({
      kind: "file",
      value: "",
      fileName: picked.name,
      filePath: picked.path,
      fileContentType: picked.contentType,
      fileSize: picked.size,
    });
  };

  const handleClearFile = () => {
    onUpdate({
      value: "",
      fileName: undefined,
      filePath: undefined,
      fileContentType: undefined,
      fileSize: undefined,
    });
  };

  const isFileRow = row.kind === "file" && allowFileKind;

  const chipValue: PickedFile | null = row.fileName
    ? {
        name: row.fileName,
        path: row.filePath ?? "",
        contentType: row.fileContentType ?? "",
        size: row.fileSize ?? 0,
      }
    : null;

  return (
    <div
      className={cn(
        "grid items-center gap-2",
        allowFileKind
          ? "grid-cols-[60px_1fr_110px_1.4fr_40px]"
          : "grid-cols-[60px_1fr_1fr_40px]",
      )}
    >
      <div className="flex items-center pl-1">
        <Checkbox
          checked={row.enabled}
          onCheckedChange={(checked) =>
            onUpdate({
              enabled: Boolean(checked),
            })
          }
          aria-label="Toggle form field"
        />
      </div>

      <Input
        value={row.key}
        onChange={(event) => onUpdate({ key: event.target.value })}
        placeholder="Field name"
      />

      {allowFileKind ? (
        <ToggleGroup
          type="single"
          value={row.kind}
          onValueChange={(value) =>
            value ? handleKindChange(value as FormBodyFieldKind) : undefined
          }
          aria-label="Field kind"
        >
          {KIND_OPTIONS.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={option.label}
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : null}

      {isFileRow ? (
        <FilePickerChip
          value={chipValue}
          onPick={handleFilePicked}
          onClear={handleClearFile}
          pickerTitle={`Choose file for "${row.key || "field"}"`}
          fallbackWarning={
            "Browser preview can't expose the file path. " +
            "Run Dispo as a desktop app to upload form files."
          }
        />
      ) : (
        <Input
          value={row.value}
          onChange={(event) => onUpdate({ value: event.target.value })}
          placeholder="Field value"
        />
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-muted-foreground"
        aria-label="Remove form field"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
