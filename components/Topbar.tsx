"use client";

import React from "react";
import { PanelLeft, FileText } from "lucide-react";
import { SaveStatus } from "@/lib/types";

interface TopbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  pageIcon?: string | null;
  pageTitle?: string;
  saveStatus?: SaveStatus;
}

export function Topbar({
  sidebarOpen,
  onToggleSidebar,
  pageIcon,
  pageTitle = "Untitled",
  saveStatus = "saved",
}: TopbarProps) {
  const displayTitle = pageTitle.trim() === "" ? "Untitled" : pageTitle;

  return (
    <header className="h-[45px] min-h-[45px] w-full px-3 sm:px-4 flex items-center justify-between border-b border-divider bg-bg-page select-none z-10">
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-4">
        <button
          onClick={onToggleSidebar}
          className="p-1 rounded-[6px] text-text-secondary hover:bg-hover-fill hover:text-text-primary notion-hover-transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-link-focus"
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <PanelLeft size={18} strokeWidth={1.75} />
        </button>

        <div className="flex items-center gap-1.5 text-[14px] text-text-secondary min-w-0 truncate">
          <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 text-[15px]">
            {pageIcon ? (
              pageIcon
            ) : (
              <FileText size={16} strokeWidth={1.75} className="text-text-secondary" />
            )}
          </span>
          <span className="truncate text-text-primary font-medium">{displayTitle}</span>
        </div>
      </div>

      <div className="flex items-center flex-shrink-0 text-[12px] text-text-secondary font-normal">
        {saveStatus === "saving" && <span>Saving...</span>}
        {saveStatus === "saved" && <span>Saved</span>}
        {saveStatus === "unsaved" && <span className="text-text-placeholder">Unsaved</span>}
      </div>
    </header>
  );
}
