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
} from "@/components";
import {
  KeyValueRowsEditor,
  MonacoBaseEditor,
  TemplateHighlightInput,
} from "@/components/shared";
import { useActiveEnvironment, useWorkspaceUpdateTab } from "../../stores";
import type { KeyValuePair, RequestAuthType } from "../../types";
import { ScriptsTab } from "./scripts-tab";

type Props = {
  tab: RequestTab;
};

export function RequestEditor({ tab }: Props) {
  const updateTab = useWorkspaceUpdateTab();
  const activeEnvironment = useActiveEnvironment();
  const templateValues = buildTemplateValues(activeEnvironment?.variables ?? []);

  const handleBodyChange = (value: string) => {
    updateTab(tab.id, {
      body: value,

      isDirty: true,
    });
  };

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
          <KeyValueRowsEditor
            title="Headers"
            rows={tab.headers}
            onAddRow={handleAddHeader}
            onUpdateRow={handleUpdateHeader}
            onRemoveRow={handleRemoveHeader}
          />
        </TabsContent>

        <TabsContent
          value="params"
          className="
            mt-0 min-h-0 flex-1
          "
        >
          <KeyValueRowsEditor
            title="Query Params"
            rows={tab.queryParams}
            onAddRow={handleAddParam}
            onUpdateRow={handleUpdateParam}
            onRemoveRow={handleRemoveParam}
          />
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
              <Select value={tab.auth.type} onValueChange={handleAuthTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select auth type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

function buildTemplateValues(variables: KeyValuePair[]) {
  return variables.reduce<Record<string, string>>((acc, variable) => {
    const key = variable.key.trim();
    if (variable.enabled && key) {
      acc[key] = variable.value;
    }
    return acc;
  }, {});
}
