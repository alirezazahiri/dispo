import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  FloatingActionButton,
} from "@/components";
import { FileCode2, Settings2 } from "lucide-react";
import type { TextBodyContentType } from "@/types";
import { useWorkspaceUpdateTab } from "../../../stores";
import type { RequestTab } from "../../../types";
import { TEXT_CONTENT_TYPE_LABELS, TEXT_CONTENT_TYPES } from "./constants";
import { buildBodyUpdate } from "./utils";

type Props = {
  tab: RequestTab;
  currentContentType: TextBodyContentType;
};

/**
 * Floating action button shown over the Monaco editor for the `text` body
 * mode. Currently exposes a single "Content Type" sub-menu; further
 * text-specific options (formatting, schema validation, …) can land here
 * without affecting the other body modes.
 */
export function TextEditorOptionsFab({ tab, currentContentType }: Props) {
  const updateTab = useWorkspaceUpdateTab();

  const handleContentTypeChange = (value: string) => {
    const nextContentType = value as TextBodyContentType;

    updateTab(
      tab.id,
      buildBodyUpdate(tab, {
        bodyContentType: nextContentType,
      }),
    );

    updateTab(tab.id, {
      isDirty: true,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FloatingActionButton
          position="bottom-right"
          variant="surface"
          size="sm"
          aria-label="Body settings"
        >
          <Settings2 />
        </FloatingActionButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="top" className="w-48">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileCode2 />
            Content Type
          </DropdownMenuSubTrigger>

          <DropdownMenuPortal>
            <DropdownMenuSubContent className="w-44">
              <DropdownMenuRadioGroup
                value={currentContentType}
                onValueChange={handleContentTypeChange}
              >
                {TEXT_CONTENT_TYPES.map((contentType) => (
                  <DropdownMenuRadioItem key={contentType} value={contentType}>
                    {TEXT_CONTENT_TYPE_LABELS[contentType]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
