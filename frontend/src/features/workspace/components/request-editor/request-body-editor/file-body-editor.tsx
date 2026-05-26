import { useRef } from "react";
import { File as FileIcon, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button, Input, Label } from "@/components";
import { backendClient } from "@/lib/backend/client";
import { cn, formatBytes2 } from "@/lib/utils";
import { useWorkspaceUpdateTab } from "../../../stores";
import type { FileBodyData, RequestTab } from "../../../types";
import { DEFAULT_FILE_CONTENT_TYPE } from "./constants";
import { buildBodyUpdate } from "./utils";

type Props = {
  tab: RequestTab;
};

export function FileBodyEditor({ tab }: Props) {
  const updateTab = useWorkspaceUpdateTab();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const file = tab.fileBody;
  const contentType = tab.fileContentType || DEFAULT_FILE_CONTENT_TYPE;

  const applyPickedFile = (picked: FileBodyData) => {
    updateTab(tab.id, {
      ...buildBodyUpdate(tab, {
        fileContentType: picked.contentType,
      }),
      fileBody: picked,
      isDirty: true,
    });
  };

  /**
   * Native open-file dialog (desktop). Falls back to the hidden HTML
   * `<input>` when the Wails bridge isn't available (e.g. dev preview in
   * a browser). The native path is the one that produces an absolute
   * `filePath` the backend can read at send time.
   */
  const handleNativePick = async () => {
    try {
      const result = await backendClient.pickFile({
        title: "Choose file body",
      });
      if (result.cancelled) return;

      applyPickedFile({
        name: result.name,
        path: result.path,
        contentType: result.contentType || DEFAULT_FILE_CONTENT_TYPE,
        size: result.size,
      });
    } catch (error) {
      // Browser preview (no Wails bridge) — surface the HTML input.
      fileInputRef.current?.click();
      if (error) {
        console.warn("native file picker failed, falling back", error);
      }
    }
  };

  const handleFilePick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (!picked) return;

    const detectedContentType = picked.type || DEFAULT_FILE_CONTENT_TYPE;
    applyPickedFile({
      name: picked.name,
      contentType: detectedContentType,
      size: picked.size,
      // Browser security prevents access to the absolute path. The send
      // will fail at the backend with a "missing file path" error — we
      // surface a toast so the user understands the limitation.
      path: "",
    });
    toast.warning(
      "Browser preview can't expose the file path. " +
        "Run Dispo as a desktop app to send binary bodies.",
    );

    event.target.value = "";
  };

  const handleClear = () => {
    updateTab(tab.id, {
      fileBody: null,
      isDirty: true,
    });
  };

  const handleContentTypeChange = (value: string) => {
    const nextContentType = value.trim() || DEFAULT_FILE_CONTENT_TYPE;
    updateTab(tab.id, {
      ...buildBodyUpdate(tab, {
        fileContentType: nextContentType,
      }),
      fileBody: file
        ? {
            ...file,
            contentType: nextContentType,
          }
        : file,
      isDirty: true,
    });
  };

  return (
    <div className="h-full min-h-0 overflow-auto p-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div>
          <div className="text-sm font-medium">Binary File Body</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Send a single file as the raw request body. The file's bytes
            replace the body verbatim and the request <code>Content-Type</code>{" "}
            header is set automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleNativePick()}
          className={cn(
            "group flex w-full flex-col items-center justify-center gap-2",
            "rounded-md border border-dashed border-border bg-card/40",
            "px-6 py-10 text-center transition-colors",
            "hover:border-primary/60 hover:bg-accent/40",
            file && "border-solid border-border bg-card",
          )}
        >
          {file ? (
            <>
              <FileIcon className="h-8 w-8 text-muted-foreground" />
              <div className="font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatBytes2(file.size)} · {file.contentType}
              </div>
              <span className="mt-2 text-xs text-primary group-hover:underline">
                Replace file
              </span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="font-medium">Click to choose a file</div>
              <div className="text-xs text-muted-foreground">
                Any file type. The mime is detected from the file extension.
              </div>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFilePick}
        />

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Content Type
          </Label>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground">
              <Paperclip className="h-4 w-4" />
            </div>
            <Input
              value={contentType}
              onChange={(event) => handleContentTypeChange(event.target.value)}
              placeholder={DEFAULT_FILE_CONTENT_TYPE}
            />
            {file ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="text-muted-foreground"
                aria-label="Remove file"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Defaults to <code>{DEFAULT_FILE_CONTENT_TYPE}</code> for unknown
            file types. Override it for specific formats (e.g.{" "}
            <code>image/png</code>).
          </p>
        </div>
      </div>
    </div>
  );
}
