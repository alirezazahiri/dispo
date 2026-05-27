import type { RequestTab, KeyValuePair, RequestAuthType } from "../../types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import {
  KeyValueRowsEditor,
  TemplateHighlightInput,
} from "@/components/shared";
import { useActiveEnvironment, useWorkspaceUpdateTab } from "../../stores";
import { useCollectionsStore } from "@/features/collections/stores/collections.store";
import { resolveEffectiveAuth } from "../../utils/resolve-effective-auth";
import { buildTemplateValues } from "@/lib/utils";
import { PathParamsSection } from "../../components/request-editor/path-params-section";
import { extractPathParamNames } from "../../components/request-toolbar/utils";
import { SseOptionsEditor } from "./sse-options-editor";

type Props = {
  tab: RequestTab;
};

export function SseRequestEditor({ tab }: Props) {
  const updateTab = useWorkspaceUpdateTab();
  const activeEnvironment = useActiveEnvironment();
  const collection = useCollectionsStore(
    (state) => state.collectionsById[tab.collectionId],
  );
  const templateValues = buildTemplateValues(
    activeEnvironment?.variables ?? [],
  );
  const effectiveAuth = resolveEffectiveAuth(tab.auth, collection?.auth);

  const updateKeyValueRows = (
    rows: KeyValuePair[],
    rowId: string,
    data: Partial<KeyValuePair>,
  ) =>
    rows.map((row) => (row.id === rowId ? { ...row, ...data } : row));

  const handleAddHeader = () => {
    updateTab(tab.id, {
      headers: [
        ...tab.headers,
        { id: crypto.randomUUID(), key: "", value: "", enabled: true },
      ],
      isDirty: true,
    });
  };

  const handleUpdateHeader = (rowId: string, data: Partial<KeyValuePair>) => {
    updateTab(tab.id, {
      headers: updateKeyValueRows(tab.headers, rowId, data),
      isDirty: true,
    });
  };

  const handleRemoveHeader = (rowId: string) => {
    updateTab(tab.id, {
      headers: tab.headers.filter((row) => row.id !== rowId),
      isDirty: true,
    });
  };

  const handleAddParam = () => {
    updateTab(tab.id, {
      queryParams: [
        ...tab.queryParams,
        { id: crypto.randomUUID(), key: "", value: "", enabled: true },
      ],
      isDirty: true,
    });
  };

  const handleUpdateParam = (rowId: string, data: Partial<KeyValuePair>) => {
    updateTab(tab.id, {
      queryParams: updateKeyValueRows(tab.queryParams, rowId, data),
      isDirty: true,
    });
  };

  const handleRemoveParam = (rowId: string) => {
    updateTab(tab.id, {
      queryParams: tab.queryParams.filter((row) => row.id !== rowId),
      isDirty: true,
    });
  };

  const handleAddPathParam = () => {
    updateTab(tab.id, {
      pathParams: [
        ...(tab.pathParams ?? []),
        { id: crypto.randomUUID(), key: "", value: "", enabled: true },
      ],
      isDirty: true,
    });
  };

  const handleUpdatePathParam = (rowId: string, data: Partial<KeyValuePair>) => {
    updateTab(tab.id, {
      pathParams: updateKeyValueRows(tab.pathParams ?? [], rowId, data),
      isDirty: true,
    });
  };

  const handleRemovePathParam = (rowId: string) => {
    updateTab(tab.id, {
      pathParams: (tab.pathParams ?? []).filter((row) => row.id !== rowId),
      isDirty: true,
    });
  };

  const pathParamRows = tab.pathParams ?? [];
  const urlPathParamNames = new Set(extractPathParamNames(tab.url));
  const orphanCount = pathParamRows.filter((row) => {
    const key = row.key.trim();
    return key !== "" && !urlPathParamNames.has(key);
  }).length;

  const handleAuthTypeChange = (type: RequestAuthType) => {
    updateTab(tab.id, {
      auth: { ...tab.auth, type },
      isDirty: true,
    });
  };

  const handleBearerTokenChange = (bearerToken: string) => {
    updateTab(tab.id, {
      auth: { ...tab.auth, bearerToken },
      isDirty: true,
    });
  };

  return (
    <section className="flex min-h-0 h-full flex-1 flex-col bg-[hsl(var(--editor))]">
      <Tabs defaultValue="headers" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border bg-background px-4 py-2">
          <TabsList className="h-8 bg-transparent p-0">
            <TabsTrigger
              value="headers"
              className="h-8 rounded-md px-3 data-[state=active]:bg-accent data-[state=active]:shadow-none"
            >
              Headers
            </TabsTrigger>
            <TabsTrigger
              value="params"
              className="h-8 rounded-md px-3 data-[state=active]:bg-accent data-[state=active]:shadow-none"
            >
              Params
            </TabsTrigger>
            <TabsTrigger
              value="auth"
              className="h-8 rounded-md px-3 data-[state=active]:bg-accent data-[state=active]:shadow-none"
            >
              Auth
            </TabsTrigger>
            <TabsTrigger
              value="sse"
              className="h-8 rounded-md px-3 data-[state=active]:bg-accent data-[state=active]:shadow-none"
            >
              SSE
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="headers" className="mt-0 min-h-0 flex-1">
          <KeyValueRowsEditor
            title="Headers"
            rows={tab.headers}
            onAddRow={handleAddHeader}
            onUpdateRow={handleUpdateHeader}
            onRemoveRow={handleRemoveHeader}
            templateValues={templateValues}
          />
        </TabsContent>

        <TabsContent value="params" className="mt-0 min-h-0 flex-1 overflow-auto">
          <div className="flex flex-col">
            <PathParamsSection
              rows={pathParamRows}
              orphanCount={orphanCount}
              onAddRow={handleAddPathParam}
              onUpdateRow={handleUpdatePathParam}
              onRemoveRow={handleRemovePathParam}
              templateValues={templateValues}
            />

            <KeyValueRowsEditor
              title="Query Params"
              rows={tab.queryParams}
              onAddRow={handleAddParam}
              onUpdateRow={handleUpdateParam}
              onRemoveRow={handleRemoveParam}
              templateValues={templateValues}
            />
          </div>
        </TabsContent>

        <TabsContent value="auth" className="mt-0 min-h-0 flex-1">
          <div className="p-4 flex flex-col gap-4 max-w-xl">
            <div className="space-y-2">
              <div className="text-sm font-medium">Auth Type</div>
              <Select value={tab.auth.type} onValueChange={handleAuthTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select auth type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherited">Inherited</SelectItem>
                  <SelectItem value="none">No Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tab.auth.type === "inherited" ? (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Uses collection auth:{" "}
                <span className="font-medium text-foreground">
                  {effectiveAuth.type === "bearer" ? "Bearer Token" : "No Auth"}
                </span>
              </div>
            ) : null}

            {tab.auth.type === "bearer" ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">Bearer Token</div>
                <TemplateHighlightInput
                  value={tab.auth.bearerToken}
                  onChange={handleBearerTokenChange}
                  placeholder="Enter token or {{token_var}}"
                  previewLabel="Detected templates"
                  templateValues={templateValues}
                />
              </div>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="sse" className="mt-0 min-h-0 flex-1 overflow-auto">
          <SseOptionsEditor tab={tab} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
