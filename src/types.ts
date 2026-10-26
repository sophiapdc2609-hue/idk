import type { Node, Edge } from "@xyflow/react";
export type Kind =
  | "note"
  | "keyword"
  | "image"
  | "sketch"
  | "drawing"
  | "reference"
  | "document"
  | "material"
  | "link"
  | "zone";
export type CardData = {
  kind: Kind;
  title: string;
  text: string;
  universes: string[];
  createdAt: string;
  modifiedAt: string;
  origin: "personal" | "local" | "ai" | "external";
  notes: string;
  source?: string;
  author?: string;
  location?: string;
  fileId?: string;
  image?: string;
  mime?: string;
  color?: string;
  archived?: boolean;
  originId?: string;
  groupId?: string;
  [key: string]: unknown;
};
export type CanvasNode = Node<CardData, "card">;
export type Universe = { id: string; name: string; color: string };
export type JournalEvent = {
  id: string;
  at: string;
  title: string;
  text?: string;
  type: "automatic" | "reflection" | "version" | "discard";
  milestone: boolean;
  selected?: boolean;
  nodeId?: string;
  image?: string;
};
export type Version = {
  id: string;
  at: string;
  name: string;
  nodes: CanvasNode[];
  edges: Edge[];
};
export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  modifiedAt: string;
  demo: boolean;
  nodes: CanvasNode[];
  edges: Edge[];
  universes: Universe[];
  events: JournalEvent[];
  versions: Version[];
  viewport?: { x: number; y: number; zoom: number };
};
export type StoredFile = { id: string; name: string; mime: string; blob: Blob };
export type Suggestion = {
  id: string;
  category:
    "concept" | "strategy" | "reference" | "theory" | "question" | "connection";
  title: string;
  text: string;
  tags: string[];
  source?: string;
  author?: string;
  mode: "local" | "ai";
  limitation: string;
};
