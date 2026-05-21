import { nanoid } from "nanoid";

export function normalizeHeaders(headers: Record<string, string>) {
  return Object.entries(headers).map(([key, value]) => ({
    id: nanoid(),

    key,

    value,
  }));
}
