import { RenameDialog } from "./rename-dialog";

type CreateFolderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void> | void;
};

export function CreateFolderDialog({ open, onOpenChange, onCreate }: CreateFolderDialogProps) {
  return (
    <RenameDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Folder"
      description="Add a folder to organize saved requests."
      submitLabel="Create"
      placeholder="Folder name"
      onSubmit={onCreate}
    />
  );
}
