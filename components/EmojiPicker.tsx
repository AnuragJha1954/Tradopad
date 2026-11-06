"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Search } from "lucide-react";

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onRemoveEmoji: () => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: "Frequently Used",
    emojis: ["👋", "🚀", "💡", "🎯", "⚡", "📝", "✅", "🔥", "✨", "📌"],
  },
  {
    name: "Work & Tech",
    emojis: [
      "💻", "📊", "📈", "⚙️", "🛠️", "🏗️", "📦", "🔒", "🔑", "🛡️",
      "📱", "🖥️", "📁", "📂", "📄", "📑", "📅", "📆", "⏰", "🏷️",
    ],
  },
  {
    name: "Ideas & Planning",
    emojis: [
      "🧠", "🎨", "🧩", "🔬", "🔭", "🎯", "🏆", "🌟", "⭐", "🎉",
      "📣", "🔔", "💬", "💭", "✉️", "📫", "🤝", "👥", "💼", "💰",
    ],
  },
  {
    name: "Symbols & Status",
    emojis: [
      "🟢", "🟡", "🔴", "⚪", "⚫", "🟦", "🟧", "🟪", "❗", "❓",
      "✔️", "❌", "➕", "➖", "➡️", "⬅️", "⬆️", "⬇️", "🔗", "🚩",
    ],
  },
];

export function EmojiPicker({
  onSelectEmoji,
  onRemoveEmoji,
  onClose,
}: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="absolute top-full left-0 mt-1 z-50 w-[280px] bg-bg-page border border-divider rounded-[6px] shadow-popup p-2 select-none text-[14px]"
    >
      {/* Header with Remove button */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-divider">
        <span className="text-[12px] font-medium text-text-secondary">Icons</span>
        <button
          onClick={() => {
            onRemoveEmoji();
            onClose();
          }}
          className="text-[12px] text-text-secondary hover:text-[#EB5757] hover:bg-hover-fill px-1.5 py-0.5 rounded-[4px] notion-hover-transition"
        >
          Remove
        </button>
      </div>

      {/* Emoji List */}
      <div className="max-h-[220px] overflow-y-auto pr-1 space-y-3">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.name}>
            <div className="text-[11px] font-medium text-text-placeholder mb-1">
              {cat.name}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cat.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSelectEmoji(emoji);
                    onClose();
                  }}
                  className="w-8 h-8 flex items-center justify-center text-[18px] rounded-[4px] hover:bg-hover-fill notion-hover-transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
