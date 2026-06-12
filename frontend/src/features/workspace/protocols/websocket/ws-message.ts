export function parseWsTextData(rawData: string): string {
  const raw = rawData ?? "";
  const trimmed = raw.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw;
  }
}

export function formatBinaryPreview(base64Data: string, maxBytes = 32): string {
  if (!base64Data) {
    return "";
  }

  try {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    const slice = bytes.slice(0, maxBytes);
    const hex = Array.from(slice)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" ");
    return bytes.length > maxBytes ? `${hex} …` : hex;
  } catch {
    return "(invalid base64)";
  }
}

export function formatRawMessageLog(
  direction: "sent" | "received",
  messageType: "text" | "binary",
  data: string,
  byteLength: number,
): string {
  const prefix = `[${direction.toUpperCase()}] [${messageType}] (${byteLength} bytes)`;
  if (messageType === "binary") {
    return `${prefix}\n${data}\nhex: ${formatBinaryPreview(data)}`;
  }
  return `${prefix}\n${data}`;
}
