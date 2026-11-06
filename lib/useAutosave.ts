"use client";

import { useEffect, useRef, useCallback } from "react";
import { JSONContent } from "@tiptap/react";
import { Page, SaveStatus } from "./types";

interface UseAutosaveProps {
  pageId: string;
  title: string;
  icon: string | null;
  content: JSONContent | null;
  initialUpdatedAt: string | null;
  onSaveStatusChange: (status: SaveStatus) => void;
  onQuietReload: (newPage: Page) => void;
  onRefreshPagesList: () => void;
}

export function useAutosave({
  pageId,
  title,
  icon,
  content,
  initialUpdatedAt,
  onSaveStatusChange,
  onQuietReload,
  onRefreshPagesList,
}: UseAutosaveProps) {
  // References to keep latest values across async intervals
  const pageIdRef = useRef(pageId);
  const titleRef = useRef(title);
  const iconRef = useRef(icon);
  const contentRef = useRef(content);
  const lastSavedRef = useRef<{
    title: string;
    icon: string | null;
    contentJson: string;
    updatedAt: string | null;
  }>({
    title,
    icon,
    contentJson: JSON.stringify(content || {}),
    updatedAt: initialUpdatedAt,
  });

  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync ref values on change
  useEffect(() => {
    pageIdRef.current = pageId;
  }, [pageId]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    iconRef.current = icon;
  }, [icon]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Flush save function
  const flushSave = useCallback(async () => {
    if (!isDirtyRef.current || isSavingRef.current) return;

    const currentTitle = titleRef.current;
    const currentIcon = iconRef.current;
    const currentContent = contentRef.current;
    const targetPageId = pageIdRef.current;

    isSavingRef.current = true;
    onSaveStatusChange("saving");

    try {
      const res = await fetch(`/api/pages/${targetPageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentTitle,
          icon: currentIcon,
          content: currentContent || {},
        }),
      });

      if (!res.ok) throw new Error("Autosave PATCH failed");

      const data = await res.json();
      lastSavedRef.current = {
        title: currentTitle,
        icon: currentIcon,
        contentJson: JSON.stringify(currentContent || {}),
        updatedAt: data.updated_at,
      };

      isDirtyRef.current = false;
      onSaveStatusChange("saved");
      onRefreshPagesList();
    } catch (err) {
      console.error("Autosave error:", err);
      onSaveStatusChange("unsaved");
    } finally {
      isSavingRef.current = false;
    }
  }, [onSaveStatusChange, onRefreshPagesList]);

  // Track edits and trigger 800ms debounced autosave
  useEffect(() => {
    const currentContentJson = JSON.stringify(content || {});
    const hasChanges =
      title !== lastSavedRef.current.title ||
      icon !== lastSavedRef.current.icon ||
      currentContentJson !== lastSavedRef.current.contentJson;

    if (hasChanges) {
      isDirtyRef.current = true;
      onSaveStatusChange("unsaved");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        flushSave();
      }, 800);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [title, icon, content, flushSave, onSaveStatusChange]);

  // Flush on tab close (beforeunload) using fetch with keepalive
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        fetch(`/api/pages/${pageIdRef.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: titleRef.current,
            icon: iconRef.current,
            content: contentRef.current || {},
          }),
          keepalive: true,
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Background Sync Check: every 15 seconds and on window focus / visibility change
  const checkVersionAndSync = useCallback(async () => {
    const targetId = pageIdRef.current;
    if (!targetId) return;

    try {
      // Refresh pages list in sidebar
      onRefreshPagesList();

      // Check current page version (lightweight HEAD)
      const res = await fetch(`/api/pages/${targetId}/version`);
      if (!res.ok) return;

      const data = await res.json();
      const serverUpdatedAt = data.updated_at;

      const lastSavedTime = lastSavedRef.current.updatedAt
        ? new Date(lastSavedRef.current.updatedAt).getTime()
        : 0;
      const serverTime = serverUpdatedAt ? new Date(serverUpdatedAt).getTime() : 0;

      // If server has newer updates
      if (serverTime > lastSavedTime) {
        // If this editor has NO unsaved edits, reload new content quietly
        if (!isDirtyRef.current && !isSavingRef.current) {
          const pageRes = await fetch(`/api/pages/${targetId}`);
          if (pageRes.ok) {
            const freshPage: Page = await pageRes.json();
            lastSavedRef.current = {
              title: freshPage.title,
              icon: freshPage.icon,
              contentJson: JSON.stringify(freshPage.content || {}),
              updatedAt: freshPage.updated_at,
            };
            onQuietReload(freshPage);
          }
        }
        // If isDirty is true: last write wins, local typing continues and will autosave
      }
    } catch (err) {
      console.error("Background sync error:", err);
    }
  }, [onRefreshPagesList, onQuietReload]);

  // Periodic 15-second sync timer and focus listener
  useEffect(() => {
    const interval = setInterval(() => {
      checkVersionAndSync();
    }, 15000);

    const handleFocus = () => {
      checkVersionAndSync();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkVersionAndSync();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkVersionAndSync]);

  return {
    flushSave,
  };
}
