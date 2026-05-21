import { useMutation } from "@tanstack/react-query";
import { backendClient } from "@/lib/backend/client";
import type { HttpRequestPayload } from "@/lib/backend/types";

export function useSendHttpRequest() {
  return useMutation({
    mutationFn: (payload: HttpRequestPayload) =>
      backendClient.sendHttpRequest(payload),
  });
}
