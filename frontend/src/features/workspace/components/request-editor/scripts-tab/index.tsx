import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components";
import { ScriptEditor } from "./script-editor";

type Props = {
  preRequestScript: string;
  postResponseScript: string;
  onPreRequestScriptChange: (value: string) => void;
  onPostResponseScriptChange: (value: string) => void;
};

export function ScriptsTab({
  preRequestScript,
  postResponseScript,
  onPreRequestScriptChange,
  onPostResponseScriptChange,
}: Props) {
  return (
    <Tabs defaultValue="pre" className="flex h-full min-h-0 flex-1 flex-col">
      <div className="border-b border-border bg-background px-4 py-2">
        <TabsList className="h-8 bg-transparent p-0">
          <TabsTrigger
            value="pre"
            className="h-8 rounded-md px-3 data-[state=active]:bg-accent data-[state=active]:shadow-none"
          >
            Pre-request
          </TabsTrigger>
          <TabsTrigger
            value="post"
            className="h-8 rounded-md px-3 data-[state=active]:bg-accent data-[state=active]:shadow-none"
          >
            Post-response
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="pre" className="mt-0 min-h-0 flex-1">
        <ScriptEditor phase="pre" value={preRequestScript} onChange={onPreRequestScriptChange} />
      </TabsContent>

      <TabsContent value="post" className="mt-0 min-h-0 flex-1">
        <ScriptEditor
          phase="post"
          value={postResponseScript}
          onChange={onPostResponseScriptChange}
        />
      </TabsContent>
    </Tabs>
  );
}
