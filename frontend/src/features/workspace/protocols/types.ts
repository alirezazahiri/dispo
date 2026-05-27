import type { ComponentType } from "react";
import type { RequestTab, WorkspaceProtocol } from "../types";

export type { WorkspaceProtocol };

export type ProtocolAvailability = "available" | "coming_soon";

export type ProtocolMeta = {
  id: WorkspaceProtocol;
  label: string;
  shortLabel: string;
  description: string;
  availability: ProtocolAvailability;
};

export type ProtocolToolbarProps = {
  tab: RequestTab;
  onProtocolChange: (protocol: WorkspaceProtocol) => void;
};

export type ProtocolEditorProps = {
  tab: RequestTab;
};

export type ProtocolResponsePanelProps = {
  tab: RequestTab;
};

export type ProtocolDefinition = {
  meta: ProtocolMeta;
  createTabDefaults: () => Partial<RequestTab>;
  Toolbar: ComponentType<ProtocolToolbarProps>;
  Editor: ComponentType<ProtocolEditorProps>;
  ResponsePanel: ComponentType<ProtocolResponsePanelProps>;
  TabBadge: ComponentType<{ tab: RequestTab }>;
};
