import { useRef } from "react";
import { File as FileIcon, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { backendClient } from "@/lib/backend/client";
import { cn, formatBytes2 } from "@/lib/utils";

/**
 * Metadata for a file that the user has selected through the picker.
 * `path` is the absolute filesystem path when the file was chosen via
 * the native dialog, or an empty string for the browser `<input>`
 * fallback (the backend will reject such rows at send time).
 */
export type PickedFile = {
  name: string;
  path: string;
  contentType: string;
  size: number;
};

type Props = {
  /** Currently selected file (null when nothing is picked). */
  value: PickedFile | null;

  /** Called when the user picks (or replaces) a file. */
  onPick: (file: PickedFile) => void;

  /** Called when the user clears the existing selection. */
  onClear: () => void;

  /**
   * Optional title shown in the native open-file dialog. Defaults to a
   * generic "Choose file" string.
   */
  pickerTitle?: string;

  /**
   * Optional warning shown when the picker falls back to the browser
   * `<input type="file">` (which can't expose an absolute path). When
   * omitted, a sensible default is used.
   */
  fallbackWarning?: string;

  /**
   * Optional extra classes merged onto the chip's outer container.
   */
  className?: string;

  /**
   * Optional aria-label for the "choose / replace" button. Defaults to
   * "Choose file" / "Replace file" based on `value`.
   */
  pickAriaLabel?: string;
};

const DEFAULT_FALLBACK_WARNING =
  "Browser preview can't expose the file path. Run Dispo as a desktop app to upload files.";

const DEFAULT_CONTENT_TYPE = "application/octet-stream";

/**
 * FilePickerChip is the inline file-selection control used inside form
 * editor rows (and other tight layouts). It encapsulates the dual-mode
 * picker logic: prefer the native Wails open-file dialog (which yields
 * an absolute path) and fall back to a hidden HTML `<input type="file">`
 * when the bridge isn't reachable (e.g. running in a plain browser).
 *
 * The component is intentionally stateless w.r.t. the picked file — the
 * parent owns the value so the chip slots into structured editors
 * without leaking state.
 */
export function FilePickerChip({
  value,
  onPick,
  onClear,
  pickerTitle = "Choose file",
  fallbackWarning = DEFAULT_FALLBACK_WARNING,
  className,
  pickAriaLabel,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNativePick = async () => {
    try {
      const picked = await backendClient.pickFile({ title: pickerTitle });
      if (picked.cancelled) return;

      onPick({
        name: picked.name,
        path: picked.path,
        contentType: picked.contentType || DEFAULT_CONTENT_TYPE,
        size: picked.size,
      });
    } catch (error) {
      // No Wails bridge available — surface the HTML input as a
      // last-resort fallback and let the user know it can't deliver a
      // real path.
      fileInputRef.current?.click();
      if (error) {
        console.warn("native file picker failed, falling back", error);
      }
    }
  };

  const handleFallbackPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onPick({
      name: file.name,
      path: "",
      contentType: file.type || DEFAULT_CONTENT_TYPE,
      size: file.size,
    });
    toast.warning(fallbackWarning);
    event.target.value = "";
  };

  return (
    <div
      className={cn(
        "flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-background px-2",
        className,
      )}
    >
      <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 text-xs">
        {value?.name ? (
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-medium" title={value.name}>
              {value.name}
            </span>
            {value.size ? (
              <span className="shrink-0 text-muted-foreground">
                {formatBytes2(value.size)}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="block truncate text-muted-foreground">
            No file selected
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-xs"
        onClick={() => void handleNativePick()}
        aria-label={
          pickAriaLabel ?? (value?.name ? "Replace file" : "Choose file")
        }
      >
        <Paperclip className="h-3.5 w-3.5" />
        {value?.name ? "Replace" : "Choose"}
      </Button>
      {value?.name ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={onClear}
          aria-label="Clear selected file"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFallbackPick}
      />
    </div>
  );
}
