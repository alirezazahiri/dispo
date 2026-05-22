import type { RequestTab } from "../../types";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components";

import { ResponseMetaBar } from "./response-meta-bar";
import { ResponseEmptyState } from "./response-empty-state";
import { ResponseJsonView } from "./response-json-view";
import { ResponseHeadersView } from "./response-headers-view";
import { ResponseCookiesView } from "./response-cookies-view";
import { ResponseRawView } from "./response-raw-view";
import { ResponseLoading } from "./response-loading";
import { ResponseData } from "../../types/response";
import { ResponseRequestDetailsView } from "./response-request-details-view";

type Props = {
  tab: RequestTab;
};

export function ResponsePanel({ tab }: Props) {
  return (
    <section
      className="
        flex h-full min-h-0 flex-col
        bg-[hsl(var(--editor))]
      "
    >
      <Tabs
        defaultValue="response"
        className="
          flex min-h-0 flex-1 flex-col
        "
      >
        <div
          className="
            flex items-center justify-between
            border-b border-border
            bg-background px-4 py-2
          "
        >
          <TabsList
            className="
              h-8 bg-transparent p-0
            "
          >
            {!!tab.response?.requestSnapshot && (
              <TabsTrigger
                value="request"
                className="
                h-8 rounded-md px-3
                data-[state=active]:bg-accent
                data-[state=active]:shadow-none
              "
              >
                Request
              </TabsTrigger>
            )}

            <TabsTrigger
              value="response"
              className="
                h-8 rounded-md px-3
                data-[state=active]:bg-accent
                data-[state=active]:shadow-none
              "
            >
              Response
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
              value="cookies"
              className="
                h-8 rounded-md px-3
                data-[state=active]:bg-accent
                data-[state=active]:shadow-none
              "
            >
              Cookies
            </TabsTrigger>

            <TabsTrigger
              value="raw"
              className="
                h-8 rounded-md px-3
                data-[state=active]:bg-accent
                data-[state=active]:shadow-none
              "
            >
              Raw
            </TabsTrigger>
          </TabsList>

          {tab.layout == "vertical" && tab.response?.status !== "loading" && (
            <ResponseMetaBar tab={tab} />
          )}
        </div>

        {tab.layout == "horizontal" && tab.response?.status !== "loading" && (
          <div className="backdrop-blur-sm flex items-center justify-center py-2">
            <ResponseMetaBar tab={tab} />
          </div>
        )}

        <TabsContent value="response" className="mt-0 min-h-0 flex-1">
          <ResponseContent tab={tab} />
        </TabsContent>

        <TabsContent value="headers" className="mt-0 min-h-0 flex-1">
          <ResponseHeadersView tab={tab} />
        </TabsContent>

        <TabsContent value="cookies" className="mt-0 min-h-0 flex-1">
          <ResponseCookiesView tab={tab} />
        </TabsContent>

        <TabsContent value="raw" className="mt-0 min-h-0 flex-1">
          <ResponseRawView tab={tab} />
        </TabsContent>

        {!!tab.response?.requestSnapshot && (
          <TabsContent value="request" className="mt-0 min-h-0 flex-1">
            <ResponseRequestDetailsView tab={tab} />
          </TabsContent>
        )}
      </Tabs>
    </section>
  );
}

function ResponseContent({ tab }: Props) {
  const response = tab.response || ({} as ResponseData);

  if (response.status === "idle") {
    return <ResponseEmptyState tab={tab} />;
  }

  if (response.status === "loading") {
    return <ResponseLoading />;
  }

  if (response.status === "error") {
    return (
      <div
        className="
          flex h-full items-center justify-center
          text-sm text-destructive text-center px-2
        "
      >
        {response.error}
      </div>
    );
  }

  return <ResponseJsonView tab={tab} />;
}
