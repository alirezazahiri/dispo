export function parseSseEventData(
  rawData: string,
  sseEventType?: string,
): { data: string; eventType: string; rawBytes: number } {
  const raw = rawData ?? "";
  const trimmed = raw.trim();
  const baseType = sseEventType?.trim() || "message";

  if (!trimmed) {
    return { data: "", eventType: baseType, rawBytes: 0 };
  }

  try {
    const parsed = JSON.parse(trimmed);
    const inferredType = inferTypeFromJson(parsed);
    return {
      data: JSON.stringify(parsed, null, 2),
      eventType: inferredType ?? baseType,
      rawBytes: new TextEncoder().encode(raw).length,
    };
  } catch {
    return {
      data: raw,
      eventType: baseType,
      rawBytes: new TextEncoder().encode(raw).length,
    };
  }
}

function inferTypeFromJson(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.type === "string" && record.type.trim()) {
    return record.type.trim();
  }

  const nested = record.data;
  if (nested && typeof nested === "object") {
    const dataRecord = nested as Record<string, unknown>;
    if (typeof dataRecord.type === "string" && dataRecord.type.trim()) {
      return dataRecord.type.trim();
    }
  }

  return undefined;
}

export function matchesEventTypeFilter(
  filter: string,
  effectiveType: string,
  sseEventType: string,
): boolean {
  const normalizedFilter = filter.trim();
  if (!normalizedFilter) {
    return true;
  }
  return (
    effectiveType === normalizedFilter || sseEventType === normalizedFilter
  );
}
