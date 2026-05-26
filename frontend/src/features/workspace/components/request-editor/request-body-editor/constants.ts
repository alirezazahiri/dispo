import type {
  BodyContentType,
  FileBodyContentType,
  FormBodyContentType,
  TextBodyContentType,
} from "@/types";
import type { RequestBodyMode } from "../../../types";
import {
  Ban,
  FileText,
  File as FileIcon,
  Hexagon,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

/**
 * Monaco language id for every textual content type. Used to pick the
 * right syntax highlighter when the user is in `text` body mode.
 */
export const TEXT_CONTENT_TYPE_TO_LANGUAGE: Record<TextBodyContentType, string> = {
  "application/json": "json",
  "application/xml; charset=utf-8": "xml",
  "text/plain; charset=utf-8": "plaintext",
  "text/yaml; charset=utf-8": "yaml",
};

export const TEXT_CONTENT_TYPE_LABELS: Record<TextBodyContentType, string> = {
  "application/json": "JSON",
  "application/xml; charset=utf-8": "XML",
  "text/yaml; charset=utf-8": "YAML",
  "text/plain; charset=utf-8": "Plain Text",
};

export const TEXT_CONTENT_TYPES: TextBodyContentType[] = [
  "application/json",
  "application/xml; charset=utf-8",
  "text/yaml; charset=utf-8",
  "text/plain; charset=utf-8",
];

export const FORM_CONTENT_TYPE_LABELS: Record<FormBodyContentType, string> = {
  "application/x-www-form-urlencoded": "URL Encoded",
  "multipart/form-data": "Multipart",
};

export const FORM_CONTENT_TYPES: FormBodyContentType[] = [
  "application/x-www-form-urlencoded",
  "multipart/form-data",
];

export const DEFAULT_FILE_CONTENT_TYPE: FileBodyContentType = "application/octet-stream";

/**
 * Every content type label, used by surfaces that need to display a
 * human-readable name for an arbitrary `Content-Type` value.
 */
export const CONTENT_TYPE_LABELS: Record<BodyContentType, string> = {
  ...TEXT_CONTENT_TYPE_LABELS,
  ...FORM_CONTENT_TYPE_LABELS,
  "application/octet-stream": "Binary File",
};

export type BodyModeDescriptor = {
  mode: RequestBodyMode;
  label: string;
  description: string;
  icon: LucideIcon;
  disabled?: boolean;
};

/**
 * Body modes shown in the body-mode selector, in display order.
 *
 * Disabled entries (e.g. GraphQL) still render so users know the
 * capability is on the roadmap.
 */
export const BODY_MODE_DESCRIPTORS: BodyModeDescriptor[] = [
  {
    mode: "none",
    label: "None",
    description: "Send the request without a body.",
    icon: Ban,
  },
  {
    mode: "form",
    label: "Form",
    description: "URL-encoded or multipart form fields.",
    icon: ListChecks,
  },
  {
    mode: "text",
    label: "Text",
    description: "JSON, XML, YAML, or plain text payload.",
    icon: FileText,
  },
  {
    mode: "file",
    label: "File",
    description: "Send a single binary file as the body.",
    icon: FileIcon,
  },
  {
    mode: "graphql",
    label: "GraphQL",
    description: "GraphQL queries and variables — coming soon.",
    icon: Hexagon,
    disabled: true,
  },
];
