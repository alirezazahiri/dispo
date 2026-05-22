import { Navigate } from "react-router-dom";

import { useCollectionsStore } from "@/features/collections";

export function RootRedirect() {
  const firstCollectionId = useCollectionsStore(
    (state) => state.collectionOrder[0],
  );

  if (!firstCollectionId) {
    return null;
  }

  return <Navigate to={`/collections/${firstCollectionId}`} replace />;
}
