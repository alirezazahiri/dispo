import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button, Separator } from "@/components";
import { DragScrollArea } from "@/components/shared";
import { useDebouncedCallback } from "@/hooks";
import { useWorkspaceCreateTab, useWorkspaceTabs } from "../../stores";
import { WorkspaceTabItem } from "./workspace-tab-item";

const AUTO_SCROLL_DEBOUNCE_MS = 250;

export function WorkspaceTabs() {
  const tabs = useWorkspaceTabs();
  const createTab = useWorkspaceCreateTab();

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTabCountRef = useRef(tabs.length);

  const scrollLastTabIntoView = useDebouncedCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const lastChild = container.lastElementChild as HTMLElement | null;
    if (!lastChild) return;

    const containerRect = container.getBoundingClientRect();
    const childRect = lastChild.getBoundingClientRect();

    const isFullyVisible =
      childRect.left >= containerRect.left &&
      childRect.right <= containerRect.right;
    if (isFullyVisible) return;

    const overflowRight = childRect.right - containerRect.right;
    const overflowLeft = containerRect.left - childRect.left;

    const delta = overflowRight > 0 ? overflowRight + 8 : -(overflowLeft + 8);

    container.scrollTo({
      left: container.scrollLeft + delta,
      behavior: "smooth",
    });
  }, AUTO_SCROLL_DEBOUNCE_MS);

  useEffect(() => {
    if (tabs.length > prevTabCountRef.current) {
      scrollLastTabIntoView();
    }
    prevTabCountRef.current = tabs.length;
  }, [tabs.length, scrollLastTabIntoView]);

  return (
    <>
      <div
        className="
          relative flex h-11 shrink-0 items-center
          border-b border-border
          bg-card px-2
        "
      >
        {/* left fade */}
        <div
          className="
            pointer-events-none absolute left-0 top-0 z-10
            h-full w-8
            bg-gradient-to-r
            from-card to-transparent
          "
        />

        {/* tabs */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <DragScrollArea
            ref={scrollRef}
            className="
              scrollbar-hidden flex h-full items-center gap-1
            "
          >
            {tabs.map((tab) => (
              <WorkspaceTabItem key={tab.id} tab={tab} />
            ))}
          </DragScrollArea>
        </div>

        {/* right fade */}
        <div
          className="
            pointer-events-none absolute right-10 top-0 z-10
            h-full w-8
            bg-gradient-to-l
            from-card to-transparent
          "
        />

        <Button
          size="icon"
          variant="ghost"
          onClick={() => createTab()}
          className="
            ml-1 h-8 w-8 shrink-0
            text-muted-foreground
            hover:bg-accent
            hover:text-foreground
          "
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Separator />
    </>
  );
}
