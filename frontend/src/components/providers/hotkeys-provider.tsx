import { PropsWithChildren } from "react";

import { useSidebarHotkeys } from "@/components/sidebar";

export const HotkeysProvider = ({ children }: PropsWithChildren) => {
  useSidebarHotkeys();

  return children;
};
