import { RenameDialog } from "./rename-dialog";

type CreateCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void> | void;
};

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateCollectionDialogProps) {
  return (
    <RenameDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create Collection"
      description="Create a collection to group requests."
      submitLabel="Create"
      placeholder="Collection name"
      onSubmit={onCreate}
    />
  );
}
