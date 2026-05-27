import { FileJson, FolderInput, Terminal } from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui";
import { useImportCollection } from "../hooks/use-import-collection";

type ImportSource = {
  id: "postman" | "httpie";
  label: string;
  Icon: typeof FileJson;
};

const IMPORT_SOURCES: ImportSource[] = [
  {
    id: "postman",
    label: "From Postman",
    Icon: FileJson,
  },
  {
    id: "httpie",
    label: "From HTTPie",
    Icon: Terminal,
  },
];

/**
 * Sub-menu exposing collection import sources. New importers can be added
 * by appending to {@link IMPORT_SOURCES} once their handlers are wired up.
 */
export function ImportCollectionSubmenu() {
  const importCollection = useImportCollection();

  const handleImport = (source: ImportSource["id"]) => {
    void importCollection(source);
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger chevronDirection="left">
        Import Collection
        <FolderInput />
      </DropdownMenuSubTrigger>

      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-44">
          {IMPORT_SOURCES.map(({ id, label, Icon }) => (
            <DropdownMenuItem key={id} onClick={() => handleImport(id)}>
              <Icon />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
