import { PropsWithChildren } from "react";

import { useSidebarHotkeys } from "@/features/sidebar";
import { useSearchBarHotkeys } from "@/features/searchbar";

export const HotkeysProvider = ({ children }: PropsWithChildren) => {
  useSidebarHotkeys();
  useSearchBarHotkeys();

  return children;
};
