import type { RequestTab } from "../../types";
import { useWorkspaceStore } from "../../stores";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components";
import { MonacoBaseEditor } from "@/components/shared";

type Props = {
  tab: RequestTab;
};

export function RequestEditor({ tab }: Props) {
  const updateTab = useWorkspaceStore((state) => state.updateTab);

  const handleBodyChange = (value: string) => {
    updateTab(tab.id, {
      body: value,

      isDirty: true,
    });
  };

  return (
    <section
      className="
        flex min-h-0 h-full flex-1 flex-col
        bg-[hsl(var(--editor))]
      "
    >
      <Tabs
        defaultValue="body"
        className="
          flex min-h-0 flex-1 flex-col
        "
      >
        <div
          className="
            border-b border-border
            bg-background px-4 py-2
          "
        >
          <TabsList
            className="
              h-8 bg-transparent p-0
            "
          >
            <TabsTrigger
              value="body"
              className="
                h-8 rounded-md px-3
                data-[state=active]:bg-accent
                data-[state=active]:shadow-none
              "
            >
              Body
            </TabsTrigger>

            <TabsTrigger
              value="headers"
              className="
                h-8 rounded-md px-3
                data-[state=active]:bg-accent
                data-[state=active]:shadow-none
              "
            >
              Headers
            </TabsTrigger>

            <TabsTrigger
              value="params"
              className="
                h-8 rounded-md px-3
                data-[state=active]:bg-accent
                data-[state=active]:shadow-none
              "
            >
              Params
            </TabsTrigger>

            <TabsTrigger
              value="auth"
              className="
                h-8 rounded-md px-3
                data-[state=active]:bg-accent
                data-[state=active]:shadow-none
              "
            >
              Auth
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="body"
          className="
            mt-0 min-h-0 flex-1
            data-[state=inactive]:hidden
          "
        >
          <div className="h-full w-full">
            <MonacoBaseEditor
              value={tab.body}
              onChange={handleBodyChange}
              defaultLanguage="json"
            />
          </div>
        </TabsContent>

        <TabsContent
          value="headers"
          className="
            mt-0 min-h-0 flex-1
          "
        >
          <PlaceholderView label="Headers" />
        </TabsContent>

        <TabsContent
          value="params"
          className="
            mt-0 min-h-0 flex-1
          "
        >
          <PlaceholderView label="Params" />
        </TabsContent>

        <TabsContent
          value="auth"
          className="
            mt-0 min-h-0 flex-1
          "
        >
          <PlaceholderView label="Auth" />
        </TabsContent>
      </Tabs>
    </section>
  );
}

type PlaceholderViewProps = {
  label: string;
};

function PlaceholderView({ label }: PlaceholderViewProps) {
  return (
    <div
      className="
        flex h-full items-center justify-center
        text-sm text-muted-foreground
      "
    >
      {label} editor coming soon
    </div>
  );
}
