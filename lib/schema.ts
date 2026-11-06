import { z } from "zod";

export const PageSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  icon: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const IndexSchema = z.object({
  pages: z.array(PageSummarySchema),
});

export const PageSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  icon: z.string().nullable(),
  content: z.record(z.unknown()), // TipTap JSON document
  created_at: z.string(),
  updated_at: z.string(),
  archived_at: z.string().nullable(),
});

export const CreatePageInputSchema = z.object({
  title: z.string().optional().default(""),
  icon: z.string().nullable().optional().default(null),
  content: z.record(z.unknown()).optional(),
});

export const UpdatePageInputSchema = z.object({
  title: z.string().optional(),
  icon: z.string().nullable().optional(),
  content: z.record(z.unknown()).optional(),
});

export const PageIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const ImageParamSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/i),
});
