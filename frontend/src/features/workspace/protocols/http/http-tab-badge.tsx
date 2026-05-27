import { MethodBadge } from "@/components/shared";
import type { RequestTab } from "../../types";

export function HttpTabBadge({ tab }: { tab: RequestTab }) {
  return <MethodBadge method={tab.method} />;
}
