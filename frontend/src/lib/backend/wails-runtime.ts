/**
 * Wails injects `window.go` (the generated bindings) and `window.runtime`
 * (logging, events, window APIs) asynchronously during dev mode — there is an
 * IPC roundtrip to fetch the binding list after the page loads. There is no
 * official "ready" event we can subscribe to, so callers must wait for the
 * bindings to appear before invoking any generated method.
 *
 * This helper exists so that the wait happens in exactly one well-named place
 * (app startup), instead of being smeared across every backend call site.
 */

const POLL_INTERVAL_MS = 16;
const DEFAULT_TIMEOUT_MS = 10_000;

type WailsWindow = Window & {
  go?: {
    collections?: { Service?: Record<string, unknown> };
    httpservice?: { HTTPService?: Record<string, unknown> };
    scripting?: { Service?: Record<string, unknown> };
  };
  runtime?: Record<string, unknown>;
};

function bindingsAreInjected(): boolean {
  const w = window as WailsWindow;
  return Boolean(
    w.runtime &&
      w.go?.collections?.Service &&
      w.go?.httpservice?.HTTPService &&
      w.go?.scripting?.Service,
  );
}

export async function waitForWailsRuntime(
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  if (bindingsAreInjected()) {
    return;
  }
  const deadline = Date.now() + timeoutMs;
  while (!bindingsAreInjected()) {
    if (Date.now() > deadline) {
      throw new Error(
        "Wails runtime did not initialize within " + timeoutMs + "ms",
      );
    }
    await new Promise((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
  }
}
