import { FileJson, FolderInput, Terminal } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui";

type ImportSource = {
  id: "postman" | "httpie";
  label: string;
  Icon: typeof FileJson;
  onSelect: () => void;
};

const notifyComingSoon = (source: string) => {
  toast.info(`Importing from ${source} is not implemented yet.`);
};

const IMPORT_SOURCES: ImportSource[] = [
  {
    id: "postman",
    label: "From Postman",
    Icon: FileJson,
    onSelect: () => notifyComingSoon("Postman"),
  },
  {
    id: "httpie",
    label: "From HTTPie",
    Icon: Terminal,
    onSelect: () => notifyComingSoon("HTTPie"),
  },
];

/**
 * Sub-menu exposing collection import sources. New importers can be added
 * by appending to {@link IMPORT_SOURCES} once their handlers are wired up.
 */
export function ImportCollectionSubmenu() {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger chevronDirection="left">
        Import Collection
        <FolderInput />
      </DropdownMenuSubTrigger>

      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-44">
          {IMPORT_SOURCES.map(({ id, label, Icon, onSelect }) => (
            <DropdownMenuItem key={id} onClick={onSelect}>
              <Icon />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
