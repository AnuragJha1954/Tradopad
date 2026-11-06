"use client";

import React, { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";

interface PageTitleProps {
  title: string;
  icon: string | null;
  onChangeTitle: (title: string) => void;
  onChangeIcon: (icon: string | null) => void;
  onEnterPress: () => void;
}

export function PageTitle({
  title,
  icon,
  onChangeTitle,
  onChangeIcon,
  onEnterPress,
}: PageTitleProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height to content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [title]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnterPress();
    }
  };

  return (
    <div className="w-full mb-4">
      {/* Page Icon (78px button, 8px above title) */}
      <div className="relative mb-2 inline-block">
        {icon ? (
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-[78px] h-[78px] flex items-center justify-center text-[70px] leading-none rounded-[6px] hover:bg-hover-fill notion-hover-transition select-none"
            title="Change icon"
            aria-label="Change icon"
          >
            {icon}
          </button>
        ) : (
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="group flex items-center gap-1.5 text-text-placeholder hover:text-text-primary px-2 py-1 rounded-[6px] hover:bg-hover-fill notion-hover-transition text-[14px]"
            title="Add icon"
          >
            <Smile size={18} strokeWidth={1.75} className="text-text-placeholder group-hover:text-text-primary" />
            <span>Add icon</span>
          </button>
        )}

        {showEmojiPicker && (
          <EmojiPicker
            onSelectEmoji={(selected) => {
              onChangeIcon(selected);
              setShowEmojiPicker(false);
            }}
            onRemoveEmoji={() => {
              onChangeIcon(null);
              setShowEmojiPicker(false);
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </div>

      {/* Title Input (40px desktop, 32px phone, weight 700, line-height 1.2) */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={title}
        onChange={(e) => onChangeTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Untitled"
        className="w-full resize-none overflow-hidden bg-transparent text-[32px] md:text-[40px] font-bold leading-[1.2] text-text-primary placeholder:text-text-placeholder focus:outline-none tracking-tight block"
      />
    </div>
  );
}
