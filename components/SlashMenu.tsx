"use client";

import React, { useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";

export interface SlashMenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  keywords: string[];
  action: () => void;
}

interface SlashMenuProps {
  query: string;
  onSelect: (item: SlashMenuItem) => void;
  onClose: () => void;
  items: SlashMenuItem[];
  position: { top: number; left: number };
  isFromPlusButton?: boolean;
}

export function SlashMenu({
  query,
  onSelect,
  onClose,
  items,
  position,
  isFromPlusButton = false,
}: SlashMenuProps) {
  const [internalQuery, setInternalQuery] = useState(query);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internalQuery if parent query changes
  useEffect(() => {
    setInternalQuery(query);
  }, [query]);

  // Filter items by query
  const effectiveQuery = isFromPlusButton ? internalQuery : query;
  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
      item.keywords.some((k) => k.toLowerCase().includes(effectiveQuery.toLowerCase()))
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [effectiveQuery]);

  // Click outside listener to close menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelect(filtered[selectedIndex]);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, onSelect, onClose]);

  // Focus search input on mount if opened via plus button
  useEffect(() => {
    if (isFromPlusButton) {
      inputRef.current?.focus();
    }
  }, [isFromPlusButton]);

  // Adjust position to stay fully on screen
  const adjustedLeft = Math.min(
    Math.max(16, position.left),
    typeof window !== "undefined" ? window.innerWidth - 340 : position.left
  );
  const adjustedTop = position.top + 8;

  return (
    <div
      ref={menuRef}
      style={{ top: adjustedTop, left: adjustedLeft }}
      className="fixed z-50 w-[324px] max-w-[calc(100vw-32px)] max-h-[380px] bg-bg-page border border-divider rounded-[6px] shadow-popup flex flex-col select-none text-[14px]"
    >
      {/* Search Input for Plus Button trigger */}
      {isFromPlusButton && (
        <div className="p-2 border-b border-divider">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-2.5 text-text-placeholder pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={internalQuery}
              onChange={(e) => setInternalQuery(e.target.value)}
              placeholder="Search blocks..."
              className="w-full pl-8 pr-2 py-1 text-[13px] bg-hover-fill/50 border border-transparent focus:border-link-focus rounded-[4px] focus:outline-none text-text-primary placeholder:text-text-placeholder"
            />
          </div>
        </div>
      )}

      {/* Menu Header */}
      <div className="px-3 pt-2 pb-1 text-[12px] font-medium text-text-secondary">
        Basic blocks
      </div>

      {/* Block List */}
      <div className="overflow-y-auto py-1 px-1 flex-1 space-y-0.5">
        {filtered.length === 0 ? (
          <div className="p-3 text-[13px] text-text-placeholder text-center">
            No matching blocks
          </div>
        ) : (
          filtered.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full px-2 py-1.5 rounded-[4px] flex items-center gap-2.5 text-left notion-hover-transition cursor-pointer ${
                  isSelected ? "bg-hover-fill text-text-primary" : "text-text-primary"
                }`}
              >
                {/* 32px icon tile */}
                <div className="w-8 h-8 rounded-[4px] border border-divider bg-bg-page flex items-center justify-center flex-shrink-0 text-text-secondary">
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[14px] leading-snug truncate">
                    {item.title}
                  </div>
                  <div className="text-[12px] text-text-secondary leading-snug truncate">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
