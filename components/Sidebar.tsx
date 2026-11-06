"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Search, MoreHorizontal, Trash2, FileText, X } from "lucide-react";
import { PageSummary } from "@/lib/types";

interface SidebarProps {
  pages: PageSummary[];
  activePageId: string | null;
  onSelectPage: (id: string) => void;
  onCreatePage: () => void;
  onDeletePage: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  workspaceName?: string;
}

export function Sidebar({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  isOpen,
  onClose,
  workspaceName = "Tradopad",
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuPageId, setMenuPageId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter pages by title
  const filteredPages = pages.filter((page) =>
    (page.title || "Untitled").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close popup menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPageId(null);
        setConfirmDeleteId(null);
      }
    }
    if (menuPageId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuPageId]);

  return (
    <>
      {/* Mobile scrim overlay */}
      <div
        className={`fixed inset-0 bg-[#0F0F0F]/40 z-40 md:hidden notion-drawer-transition ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col h-full bg-bg-sidebar border-r border-divider text-text-primary select-none notion-drawer-transition
          w-[85vw] max-w-[300px] md:w-[240px] md:min-w-[240px] md:max-w-[240px]
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${!isOpen ? "md:hidden" : "md:flex"}
        `}
      >
        {/* Workspace header */}
        <div className="h-[45px] min-h-[45px] px-3.5 flex items-center justify-between border-b border-divider">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 rounded-[4px] bg-hover-fill flex items-center justify-center text-[12px] font-semibold flex-shrink-0 text-text-primary">
              {workspaceName.charAt(0).toUpperCase()}
            </span>
            <span className="font-semibold text-[14px] truncate text-text-primary">
              {workspaceName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 text-text-secondary hover:text-text-primary hover:bg-hover-fill rounded-[6px] notion-hover-transition"
            aria-label="Close sidebar"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Quick actions & Search */}
        <div className="p-2 space-y-1">
          {/* New page button */}
          <button
            onClick={() => {
              onCreatePage();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full h-[28px] md:h-[28px] min-h-[44px] md:min-h-[28px] px-2 rounded-[6px] flex items-center gap-2 text-[14px] text-text-secondary hover:bg-hover-fill hover:text-text-primary notion-hover-transition group"
          >
            <Plus size={18} strokeWidth={1.75} className="text-text-secondary group-hover:text-text-primary flex-shrink-0" />
            <span className="font-medium text-text-primary">New page</span>
          </button>

          {/* Search box */}
          <div className="relative flex items-center">
            <Search
              size={14}
              strokeWidth={1.75}
              className="absolute left-2.5 text-text-placeholder pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-[28px] min-h-[36px] md:min-h-[28px] pl-7 pr-2 rounded-[6px] bg-transparent text-[16px] md:text-[14px] text-text-primary placeholder:text-text-placeholder hover:bg-hover-fill focus:bg-hover-fill focus:outline-none notion-hover-transition"
            />
          </div>
        </div>

        {/* Page list header */}
        <div className="px-3.5 pt-2 pb-1 text-[11px] font-medium text-text-placeholder uppercase tracking-wider">
          Pages
        </div>

        {/* Page list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {filteredPages.length === 0 ? (
            <div className="px-3 py-4 text-[13px] text-text-placeholder text-center">
              {searchQuery ? "No pages found" : "No pages yet"}
            </div>
          ) : (
            filteredPages.map((page) => {
              const isActive = activePageId === page.id;
              const displayTitle = page.title && page.title.trim() !== "" ? page.title : "Untitled";
              const isMenuOpen = menuPageId === page.id;

              return (
                <div key={page.id} className="relative group">
                  <button
                    onClick={() => {
                      onSelectPage(page.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                    className={`w-full h-[28px] md:h-[28px] min-h-[44px] md:min-h-[28px] px-2 rounded-[6px] flex items-center justify-between text-[14px] text-left notion-hover-transition ${
                      isActive
                        ? "bg-hover-fill text-text-primary font-medium"
                        : "text-text-secondary hover:bg-hover-fill hover:text-text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                      <span className="w-[18px] h-[18px] flex items-center justify-center text-[14px] flex-shrink-0">
                        {page.icon ? (
                          page.icon
                        ) : (
                          <FileText size={16} strokeWidth={1.75} className="text-text-secondary" />
                        )}
                      </span>
                      <span className="truncate flex-1">{displayTitle}</span>
                    </div>

                    {/* Action trigger button */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuPageId(isMenuOpen ? null : page.id);
                        setConfirmDeleteId(null);
                      }}
                      className={`p-1 rounded-[4px] hover:bg-hover-fill notion-hover-transition ${
                        isMenuOpen || isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                      title="More actions"
                      role="button"
                      aria-label="More actions"
                    >
                      <MoreHorizontal size={14} strokeWidth={1.75} className="text-text-secondary" />
                    </div>
                  </button>

                  {/* Menu / Delete confirmation popup */}
                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-2 top-8 z-50 w-44 py-1 bg-bg-page rounded-[6px] shadow-popup border border-divider text-[14px]"
                    >
                      {confirmDeleteId === page.id ? (
                        <div className="p-2 space-y-2">
                          <p className="text-[12px] text-text-secondary">Delete this page?</p>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setConfirmDeleteId(null);
                                setMenuPageId(null);
                              }}
                              className="px-2 py-1 text-[12px] rounded-[4px] hover:bg-hover-fill notion-hover-transition text-text-secondary"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                onDeletePage(page.id);
                                setMenuPageId(null);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 text-[12px] rounded-[4px] bg-[#EB5757] text-white hover:opacity-90 notion-hover-transition font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(page.id)}
                          className="w-full px-3 py-1.5 flex items-center gap-2 text-left text-text-secondary hover:bg-hover-fill hover:text-[#EB5757] notion-hover-transition"
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
