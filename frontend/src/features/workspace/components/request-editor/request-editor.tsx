import { Info, Plus, Trash2 } from "lucide-react";
import type { RequestTab } from "../../types";
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
  Button,
  Checkbox,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components";
import {
  KeyValueRowsEditor,
  TemplateHighlightInput,
} from "@/components/shared";
import { useActiveEnvironment, useWorkspaceUpdateTab } from "../../stores";
import type { KeyValuePair, RequestAuthType } from "../../types";
import { ScriptsTab } from "./scripts-tab";
import { RequestBodyEditor } from "./request-body-editor";
import { extractPathParamNames } from "../request-toolbar/utils";
import { useCollectionsStore } from "@/features/collections/stores/collections.store";
import { resolveEffectiveAuth } from "../../utils/resolve-effective-auth";
import { buildTemplateValues } from "@/lib/utils";

type Props = {
  tab: RequestTab;
};

export function RequestEditor({ tab }: Props) {
  const updateTab = useWorkspaceUpdateTab();
  const activeEnvironment = useActiveEnvironment();
  const collection = useCollectionsStore(
    (state) => state.collectionsById[tab.collectionId],
  );
  const templateValues = buildTemplateValues(
    activeEnvironment?.variables ?? [],
  );
  const effectiveAuth = resolveEffectiveAuth(
    tab.auth,
    collection?.auth,
  );

  const updateKeyValueRows = (
    rows: KeyValuePair[],
    rowId: string,
    data: Partial<KeyValuePair>,
  ) => {
    return rows.map((row) =>
      row.id === rowId
        ? {
            ...row,
            ...data,
          }
        : row,
    );
  };

  const handleAddHeader = () => {
    updateTab(tab.id, {
      headers: [
        ...tab.headers,
        {
          id: crypto.randomUUID(),
          key: "",
          value: "",
          enabled: true,
        },
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
        {
          id: crypto.randomUUID(),
          key: "",
          value: "",
          enabled: true,
        },
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
        {
          id: crypto.randomUUID(),
          key: "",
          value: "",
          enabled: true,
        },
      ],
      isDirty: true,
    });
  };

  const handleUpdatePathParam = (
    rowId: string,
    data: Partial<KeyValuePair>,
  ) => {
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

  // Names currently referenced as `:name` placeholders in the URL. Used
  // to distinguish "active" rows (referenced from the URL) from "orphan"
  // rows (defined but no longer referenced) so the user has a hint about
  // which rows actually affect the next request.
  const urlPathParamNames = new Set(extractPathParamNames(tab.url));
  const orphanCount = pathParamRows.filter((row) => {
    const key = row.key.trim();
    return key !== "" && !urlPathParamNames.has(key);
  }).length;

  const handleAuthTypeChange = (type: RequestAuthType) => {
    updateTab(tab.id, {
      auth: {
        ...tab.auth,
        type,
      },
      isDirty: true,
    });
  };

  const handleBearerTokenChange = (bearerToken: string) => {
    updateTab(tab.id, {
      auth: {
        ...tab.auth,
        bearerToken,
      },
      isDirty: true,
    });
  };

  const handlePreRequestScriptChange = (preRequestScript: string) => {
    updateTab(tab.id, {
      preRequestScript,
      isDirty: true,
    });
  };

  const handlePostResponseScriptChange = (postResponseScript: string) => {
    updateTab(tab.id, {
      postResponseScript,
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

            <TabsTrigger
              value="scripts"
              className="
                h-8 rounded-md px-3
                data-[state=active]:bg-accent
                data-[state=active]:shadow-none
              "
            >
              Scripts
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
            <RequestBodyEditor tab={tab} />
          </div>
        </TabsContent>

        <TabsContent
          value="headers"
          className="
            mt-0 min-h-0 flex-1
          "
        >
          <KeyValueRowsEditor
            title="Headers"
            rows={tab.headers}
            onAddRow={handleAddHeader}
            onUpdateRow={handleUpdateHeader}
            onRemoveRow={handleRemoveHeader}
            templateValues={templateValues}
          />
        </TabsContent>

        <TabsContent
          value="params"
          className="
            mt-0 min-h-0 flex-1 overflow-auto
          "
        >
          <div className="flex flex-col">
            <PathParamsSection
              rows={pathParamRows}
              urlNames={urlPathParamNames}
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

        <TabsContent
          value="auth"
          className="
            mt-0 min-h-0 flex-1
          "
        >
          <div className="p-4 flex flex-col gap-4 max-w-xl">
            <div className="space-y-2">
              <div className="text-sm font-medium">Auth Type</div>
              <Select
                value={tab.auth.type}
                onValueChange={handleAuthTypeChange}
              >
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
                  {effectiveAuth.type === "bearer"
                    ? "Bearer Token"
                    : "No Auth"}
                </span>
                {effectiveAuth.type === "bearer" && effectiveAuth.bearerToken ? (
                  <div className="mt-2 font-mono text-xs break-all">
                    {effectiveAuth.bearerToken}
                  </div>
                ) : null}
              </div>
            ) : null}

            {tab.auth.type === "bearer" && (
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
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="scripts"
          className="
            mt-0 min-h-0 flex-1
          "
        >
          <ScriptsTab
            preRequestScript={tab.preRequestScript}
            postResponseScript={tab.postResponseScript}
            onPreRequestScriptChange={handlePreRequestScriptChange}
            onPostResponseScriptChange={handlePostResponseScriptChange}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}

type PathParamsSectionProps = {
  rows: KeyValuePair[];
  urlNames: Set<string>;
  orphanCount: number;
  onAddRow: () => void;
  onUpdateRow: (rowId: string, data: Partial<KeyValuePair>) => void;
  onRemoveRow: (rowId: string) => void;
};

function PathParamsSection({
  rows,
  urlNames,
  orphanCount,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  templateValues,
}: PathParamsSectionProps & {
  templateValues: Record<string, string>;
}) {
  return (
    <div className="border-b border-border">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-sm text-muted-foreground">Path Params</div>

          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="About path params"
                  className="
                    inline-flex h-5 w-5 items-center justify-center
                    rounded text-muted-foreground/70
                    hover:bg-accent/60 hover:text-foreground
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-ring
                  "
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-xs">
                <p className="text-xs leading-relaxed">
                  Type <code className="font-mono">:name</code> in the URL to
                  auto-add a row, or define rows here first and reference them
                  by name.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {orphanCount > 0 ? (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 truncate">
              {orphanCount} row{orphanCount === 1 ? "" : "s"} not referenced
              from the URL
            </span>
          ) : null}
        </div>
        <Button
          onClick={onAddRow}
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
      </div>

      <div className="p-4">
        <div className="min-w-[640px] space-y-2">
          <div className="grid grid-cols-[80px_1fr_1fr_48px] gap-2 text-xs text-muted-foreground px-2">
            <div>Enabled</div>
            <div>Key</div>
            <div>Value</div>
            <div />
          </div>

          {rows.map((row) => {
            return (
              <div
                key={row.id}
                className="grid grid-cols-[80px_1fr_1fr_48px] gap-2 items-center"
              >
                <div className="flex items-center pl-1">
                  <Checkbox
                    checked={row.enabled}
                    onCheckedChange={(checked) =>
                      onUpdateRow(row.id, { enabled: checked })
                    }
                    aria-label="Toggle path param row"
                  />
                </div>

                <Input
                  value={row.key}
                  onChange={(event) =>
                    onUpdateRow(row.id, { key: event.target.value })
                  }
                  placeholder="Key"
                />

                <TemplateHighlightInput
                  value={row.value}
                  onChange={(value) => onUpdateRow(row.id, { value })}
                  placeholder={
                    row.key
                      ? `:${row.key} param value...`
                      : "Path param value..."
                  }
                  previewLabel="Template variable"
                  templateValues={templateValues}
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveRow(row.id)}
                  className="text-muted-foreground"
                  aria-label="Remove path param row"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}

          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No path params yet. Add one here, or type{" "}
              <code className="font-mono">:name</code> in the URL.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
