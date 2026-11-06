"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  List,
  ListOrdered,
  Quote,
  Minus,
  Image as ImageIcon,
} from "lucide-react";

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
}

export function SlashMenu({
  query,
  onSelect,
  onClose,
  items,
  position,
}: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter items by query
  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtered, selectedIndex, onSelect, onClose]);

  // Adjust position to stay fully on screen (on mobile and small viewports)
  const adjustedLeft = Math.min(
    Math.max(16, position.left),
    typeof window !== "undefined" ? window.innerWidth - 340 : position.left
  );
  const adjustedTop = position.top + 28;

  if (filtered.length === 0) {
    return (
      <div
        ref={menuRef}
        style={{ top: adjustedTop, left: adjustedLeft }}
        className="fixed z-50 w-[324px] max-w-[calc(100vw-32px)] bg-bg-page border border-divider rounded-[6px] shadow-popup p-3 text-[14px] text-text-placeholder select-none"
      >
        No matching blocks
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      style={{ top: adjustedTop, left: adjustedLeft }}
      className="fixed z-50 w-[324px] max-w-[calc(100vw-32px)] max-h-[330px] bg-bg-page border border-divider rounded-[6px] shadow-popup overflow-y-auto py-1.5 select-none text-[14px]"
    >
      <div className="px-3 py-1 text-[12px] font-medium text-text-secondary">
        Basic blocks
      </div>

      <div className="space-y-0.5 px-1">
        {filtered.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full px-2 py-1.5 rounded-[4px] flex items-center gap-2.5 text-left notion-hover-transition ${
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
        })}
      </div>
    </div>
  );
}
