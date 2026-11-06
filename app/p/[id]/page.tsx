"use client";

import React, { useState, useEffect, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { PageTitle } from "@/components/PageTitle";
import { Editor } from "@/components/Editor";
import { Page, PageSummary, SaveStatus } from "@/lib/types";
import { useAutosave } from "@/lib/useAutosave";
import { JSONContent } from "@tiptap/react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PageView({ params }: PageProps) {
  const resolvedParams = use(params);
  const pageId = resolvedParams.id;
  const router = useRouter();

  const [pages, setPages] = useState<PageSummary[]>([]);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  // Editable local state
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [content, setContent] = useState<JSONContent | null>(null);

  const editorInstanceRef = useRef<any>(null);

  // Refresh sidebar pages list
  const refreshPagesList = useCallback(async () => {
    try {
      const res = await fetch("/api/pages");
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch {}
  }, []);

  // Handle quiet background reload from other co-founders
  const handleQuietReload = useCallback((freshPage: Page) => {
    setCurrentPage(freshPage);
    setTitle(freshPage.title || "");
    setIcon(freshPage.icon);
    setContent(freshPage.content);

    // Update TipTap editor without losing focus if possible
    if (editorInstanceRef.current && freshPage.content) {
      editorInstanceRef.current.commands.setContent(freshPage.content);
    }
  }, []);

  // Autosave engine
  const { flushSave } = useAutosave({
    pageId,
    title,
    icon,
    content,
    initialUpdatedAt: currentPage?.updated_at || null,
    onSaveStatusChange: setSaveStatus,
    onQuietReload: handleQuietReload,
    onRefreshPagesList: refreshPagesList,
  });

  // Load initial page data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setNotFound(false);

      try {
        // 1. Fetch pages list for sidebar
        await refreshPagesList();

        // 2. Fetch specific page
        const pageRes = await fetch(`/api/pages/${pageId}`);
        if (pageRes.status === 404) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        if (!pageRes.ok) throw new Error("Failed to load page");

        const pageData: Page = await pageRes.json();
        if (isMounted) {
          setCurrentPage(pageData);
          setTitle(pageData.title || "");
          setIcon(pageData.icon);
          setContent(pageData.content);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading page:", err);
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [pageId, refreshPagesList]);

  // Handle navigation: flush save before leaving
  const handleNavigatePage = async (targetId: string) => {
    if (targetId === pageId) return;
    await flushSave();
    router.push(`/p/${targetId}`);
  };

  // Handle Create Page
  const handleCreatePage = async () => {
    await flushSave();
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      });
      if (res.ok) {
        const newPage: Page = await res.json();
        setPages((prev) => [
          ...prev,
          {
            id: newPage.id,
            title: newPage.title,
            icon: newPage.icon,
            created_at: newPage.created_at,
            updated_at: newPage.updated_at,
          },
        ]);
        router.push(`/p/${newPage.id}`);
      }
    } catch (err) {
      console.error("Create page error:", err);
    }
  };

  // Handle Delete Page
  const handleDeletePage = async (idToDelete: string) => {
    try {
      const res = await fetch(`/api/pages/${idToDelete}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const remaining = pages.filter((p) => p.id !== idToDelete);
        setPages(remaining);

        if (pageId === idToDelete) {
          if (remaining.length > 0) {
            router.push(`/p/${remaining[0].id}`);
          } else {
            router.push("/");
          }
        }
      }
    } catch (err) {
      console.error("Delete page error:", err);
    }
  };

  // Focus editor when Enter is pressed in title
  const handleTitleEnter = () => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.commands.focus("start");
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-bg-page text-text-placeholder text-[14px]">
        Loading...
      </div>
    );
  }

  // Section 3: "A missing or archived page id shows 'This page doesn't exist' with a link back to the first page"
  if (notFound) {
    const firstPageId = pages.length > 0 ? pages[0].id : null;
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-bg-page text-center p-4">
        <h2 className="text-[20px] font-semibold text-text-primary mb-2">
          This page doesn&apos;t exist
        </h2>
        {firstPageId ? (
          <Link
            href={`/p/${firstPageId}`}
            className="text-[14px] text-link-focus hover:underline"
          >
            Go back to the first page
          </Link>
        ) : (
          <Link href="/" className="text-[14px] text-link-focus hover:underline">
            Go to workspace home
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-bg-page text-text-primary">
      {/* Sidebar */}
      <Sidebar
        pages={pages}
        activePageId={pageId}
        onSelectPage={handleNavigatePage}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        workspaceName={process.env.NEXT_PUBLIC_WORKSPACE_NAME || "Tradopad"}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <Topbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          pageIcon={icon}
          pageTitle={title}
          saveStatus={saveStatus}
        />

        {/* Scrollable Document Area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-24 py-8 md:py-12 flex justify-center">
          <div className="w-full max-w-content">
            {/* Page Title & Icon */}
            <PageTitle
              title={title}
              icon={icon}
              onChangeTitle={setTitle}
              onChangeIcon={setIcon}
              onEnterPress={handleTitleEnter}
            />

            {/* Block Editor */}
            <Editor
              initialContent={currentPage?.content}
              onChange={setContent}
              onFocus={() => {}}
              onBlur={flushSave}
              editorRef={editorInstanceRef}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
