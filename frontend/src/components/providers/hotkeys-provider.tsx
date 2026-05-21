import { PropsWithChildren } from "react";

import { useSidebarHotkeys } from "@/features/sidebar";
import { useSearchBarHotkeys } from "@/features/searchbar";
import { useRequestWorkspaceHotkeys } from "@/features/workspace";

export const HotkeysProvider: React.FC<PropsWithChildren> = ({ children }) => {
  useSidebarHotkeys();
  useSearchBarHotkeys();
  useRequestWorkspaceHotkeys();

  return <>{children}</>;
};
