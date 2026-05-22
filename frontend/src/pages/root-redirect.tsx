import { Navigate } from "react-router-dom";
import { useState } from "react";

import { useCollectionsStore } from "@/features/collections";
import { Button } from "@/components/ui";
import { CreateCollectionDialog } from "@/features/sidebar/components";

export function RootRedirect() {
  const createCollection = useCollectionsStore((state) => state.createCollection);
  const firstCollectionId = useCollectionsStore(
    (state) => state.collectionOrder[0],
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!firstCollectionId) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center bg-background p-6">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <p className="text-lg font-semibold text-foreground">No collections yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first collection to start organizing requests.
          </p>
          <Button onClick={() => setDialogOpen(true)}>Create your first collection</Button>
        </div>
        <CreateCollectionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreate={async (name) => {
            await createCollection(name);
            setDialogOpen(false);
          }}
        />
      </div>
    );
  }

  return <Navigate to={`/collections/${firstCollectionId}`} replace />;
}
