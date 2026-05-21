export const isInputLikeElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName.toLowerCase();

  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
};

export const normalizeHotkey = (combo: string) => {
  return combo.toLowerCase().replace(/\s+/g, "");
};

export const keyboardEventToHotkey = (event: KeyboardEvent) => {
  const keys: string[] = [];

  if (event.metaKey) keys.push("meta");

  if (event.ctrlKey) keys.push("ctrl");

  if (event.shiftKey) keys.push("shift");

  if (event.altKey) keys.push("alt");

  const ignoredKeys = ["meta", "control", "shift", "alt"];

  const key = event.key.toLowerCase();

  if (!ignoredKeys.includes(key)) {
    keys.push(key);
  }

  return normalizeHotkey(keys.join("+"));
};
