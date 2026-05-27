import type { RequestAuth } from "../types";

const DEFAULT_AUTH: RequestAuth = {
  type: "none",
  bearerToken: "",
};

/**
 * Resolves request auth when the tab uses {@link RequestAuthType} `"inherited"`.
 * Falls back to no auth when the collection has no auth configured.
 */
export function resolveEffectiveAuth(
  requestAuth: RequestAuth,
  collectionAuth: RequestAuth | undefined,
): RequestAuth {
  if (requestAuth.type !== "inherited") {
    return requestAuth;
  }

  const parent = collectionAuth ?? DEFAULT_AUTH;
  if (parent.type === "inherited") {
    return DEFAULT_AUTH;
  }

  return parent;
}
