import { randomUUID } from "crypto";
import {
  b2GetObject,
  b2PutObject,
  b2HeadObject,
  b2ListObjects,
} from "./b2";
import { IndexSchema, PageSchema } from "./schema";
import { Page, PageSummary, IndexData } from "./types";
import { JSONContent } from "@tiptap/react";

const INDEX_FILE = "index.json";
const PAGES_DIR = "pages/";

// Sample Welcome page content
export const WELCOME_CONTENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Welcome to your co-founder workspace. Track tasks, notes, and milestones together.",
        },
      ],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Set up workspace and invite co-founders" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Review product roadmap and priority blocks" }],
            },
          ],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Try creating your first page and adding to-dos" }],
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Rebuild index.json by listing all objects under pages/
 */
export async function rebuildIndex(): Promise<IndexData> {
  const pageFiles = await b2ListObjects(PAGES_DIR);
  const pages: PageSummary[] = [];

  for (const file of pageFiles) {
    if (!file.endsWith(".json")) continue;
    const res = await b2GetObject(file);
    if (!res) continue;

    try {
      const text = Buffer.from(res.body).toString("utf-8");
      const parsed = JSON.parse(text);
      const validated = PageSchema.safeParse(parsed);
      if (validated.success && !validated.data.archived_at) {
        pages.push({
          id: validated.data.id,
          title: validated.data.title,
          icon: validated.data.icon,
          created_at: validated.data.created_at,
          updated_at: validated.data.updated_at,
        });
      }
    } catch {
      // Ignore unparseable files
    }
  }

  // Sort oldest first
  pages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const indexData: IndexData = { pages };
  await b2PutObject(INDEX_FILE, JSON.stringify(indexData, null, 2));
  return indexData;
}

/**
 * Get or bootstrap index.json. If missing, attempts rebuild; if empty, bootstraps Welcome page.
 */
export async function getIndex(): Promise<IndexData> {
  const res = await b2GetObject(INDEX_FILE);

  if (res) {
    try {
      const text = Buffer.from(res.body).toString("utf-8");
      const parsed = JSON.parse(text);
      const validated = IndexSchema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
    } catch {
      // Corrupt index, fall through to rebuild
    }
  }

  // If index is missing or invalid, try to rebuild from pages/
  const rebuilt = await rebuildIndex();
  if (rebuilt.pages.length > 0) {
    return rebuilt;
  }

  // If pages/ was also empty, bootstrap the first Welcome page
  return await bootstrapWelcomePage();
}

/**
 * Bootstrap the Welcome page and initial index
 */
async function bootstrapWelcomePage(): Promise<IndexData> {
  const id = randomUUID();
  const now = new Date().toISOString();

  const welcomePage: Page = {
    id,
    title: "Welcome",
    icon: "👋",
    content: WELCOME_CONTENT,
    created_at: now,
    updated_at: now,
    archived_at: null,
  };

  // Write page object
  await b2PutObject(
    `${PAGES_DIR}${id}.json`,
    JSON.stringify(welcomePage, null, 2),
    "application/json",
    { updated_at: now }
  );

  const indexData: IndexData = {
    pages: [
      {
        id,
        title: welcomePage.title,
        icon: welcomePage.icon,
        created_at: now,
        updated_at: now,
      },
    ],
  };

  await b2PutObject(INDEX_FILE, JSON.stringify(indexData, null, 2));
  return indexData;
}

/**
 * Helper to update index with up to 3 retries
 */
async function updateIndexWithRetry(
  updater: (current: IndexData) => IndexData
): Promise<IndexData> {
  let attempts = 0;
  let lastError: unknown;

  while (attempts < 3) {
    try {
      const currentIndex = await getIndex();
      const updatedIndex = updater(currentIndex);
      await b2PutObject(INDEX_FILE, JSON.stringify(updatedIndex, null, 2));
      return updatedIndex;
    } catch (err) {
      lastError = err;
      attempts++;
      if (attempts < 3) {
        await new Promise((r) => setTimeout(r, 100 * attempts));
      }
    }
  }

  throw lastError;
}

/**
 * Get a single page by ID
 */
export async function getPage(id: string): Promise<Page | null> {
  const res = await b2GetObject(`${PAGES_DIR}${id}.json`);
  if (!res) return null;

  try {
    const text = Buffer.from(res.body).toString("utf-8");
    const parsed = JSON.parse(text);
    const validated = PageSchema.safeParse(parsed);
    if (!validated.success || validated.data.archived_at) {
      return null;
    }
    return validated.data as Page;
  } catch {
    return null;
  }
}

/**
 * Get page version (updated_at) using lightweight HEAD request
 */
export async function getPageVersion(id: string): Promise<string | null> {
  const head = await b2HeadObject(`${PAGES_DIR}${id}.json`);
  if (!head) return null;

  // Check object metadata first
  if (head.metadata?.updated_at) {
    return head.metadata.updated_at;
  }

  // Fallback to S3 LastModified ISO string
  if (head.lastModified) {
    return head.lastModified.toISOString();
  }

  return null;
}

/**
 * Create a new page
 */
export async function createPage(initialTitle = "", initialIcon: string | null = null): Promise<Page> {
  const id = randomUUID();
  const now = new Date().toISOString();

  const emptyDoc: JSONContent = {
    type: "doc",
    content: [{ type: "paragraph" }],
  };

  const newPage: Page = {
    id,
    title: initialTitle,
    icon: initialIcon,
    content: emptyDoc,
    created_at: now,
    updated_at: now,
    archived_at: null,
  };

  // 1. Write page object
  await b2PutObject(
    `${PAGES_DIR}${id}.json`,
    JSON.stringify(newPage, null, 2),
    "application/json",
    { updated_at: now }
  );

  // 2. Update index
  await updateIndexWithRetry((index) => {
    return {
      pages: [
        ...index.pages,
        {
          id,
          title: newPage.title,
          icon: newPage.icon,
          created_at: now,
          updated_at: now,
        },
      ],
    };
  });

  return newPage;
}

/**
 * Update page title, icon, or content
 */
export async function updatePage(
  id: string,
  updates: {
    title?: string;
    icon?: string | null;
    content?: JSONContent;
  }
): Promise<{ updated_at: string } | null> {
  const existing = await getPage(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updatedPage: Page = {
    ...existing,
    title: updates.title !== undefined ? updates.title : existing.title,
    icon: updates.icon !== undefined ? updates.icon : existing.icon,
    content: updates.content !== undefined ? updates.content : existing.content,
    updated_at: now,
  };

  // 1. Write updated page object
  await b2PutObject(
    `${PAGES_DIR}${id}.json`,
    JSON.stringify(updatedPage, null, 2),
    "application/json",
    { updated_at: now }
  );

  // 2. Update index entry if title or icon changed
  const titleChanged = updates.title !== undefined && updates.title !== existing.title;
  const iconChanged = updates.icon !== undefined && updates.icon !== existing.icon;

  await updateIndexWithRetry((index) => {
    return {
      pages: index.pages.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            title: titleChanged ? updatedPage.title : p.title,
            icon: iconChanged ? updatedPage.icon : p.icon,
            updated_at: now,
          };
        }
        return p;
      }),
    };
  });

  return { updated_at: now };
}

/**
 * Soft delete a page: mark archived_at and remove from index
 */
export async function deletePage(id: string): Promise<boolean> {
  const existing = await getPage(id);
  if (!existing) return false;

  const now = new Date().toISOString();
  const archivedPage: Page = {
    ...existing,
    archived_at: now,
    updated_at: now,
  };

  // 1. Update page object to mark as archived
  await b2PutObject(
    `${PAGES_DIR}${id}.json`,
    JSON.stringify(archivedPage, null, 2),
    "application/json",
    { updated_at: now }
  );

  // 2. Remove entry from index
  await updateIndexWithRetry((index) => {
    return {
      pages: index.pages.filter((p) => p.id !== id),
    };
  });

  return true;
}
