import { useMutation } from "@tanstack/react-query";
import { backendClient } from "@/lib/backend/client";
import type { HttpRequestPayload } from "@/lib/backend/types";

export function useSendHttpRequest() {
  return useMutation({
    mutationKey: ["send-http-request"],
    mutationFn: (payload: HttpRequestPayload) =>
      backendClient.sendHttpRequest(payload),
  });
}
