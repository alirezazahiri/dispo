export type HotkeyDefinition = {
  id: string;

  /**
   * Example:
   * - "meta+b"
   * - "ctrl+k"
   * - "shift+alt+p"
   */
  combo: string;

  description?: string;

  handler: (event: KeyboardEvent) => void;

  preventDefault?: boolean;

  enabled?: boolean;
};
