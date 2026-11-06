import { JSONContent } from "@tiptap/react";

export interface PageSummary {
  id: string;
  title: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  title: string;
  icon: string | null;
  content: JSONContent;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface IndexData {
  pages: PageSummary[];
}

export type SaveStatus = "saved" | "saving" | "unsaved";
