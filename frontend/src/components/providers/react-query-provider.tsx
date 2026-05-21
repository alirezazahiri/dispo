import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { PropsWithChildren, useState } from "react";

import { toast } from "sonner";

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => {
    return new QueryClient({
      queryCache: new QueryCache({
        onError: (error) => {
          toast.error(getErrorMessage(error));
        },
      }),

      defaultOptions: {
        queries: {
          retry: false,

          refetchOnWindowFocus: false,
        },

        mutations: {
          retry: false,

          onError: (error) => {
            toast.error(getErrorMessage(error));
          },
        },
      },
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}
