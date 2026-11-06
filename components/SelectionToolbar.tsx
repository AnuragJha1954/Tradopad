"use client";

import React, { useState } from "react";
import { Editor } from "@tiptap/react";
import { Bold, Italic, Strikethrough, Code, Link as LinkIcon, Check } from "lucide-react";

interface SelectionToolbarProps {
  editor: Editor;
}

export function SelectionToolbar({ editor }: SelectionToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const isBold = editor.isActive("bold");
  const isItalic = editor.isActive("italic");
  const isStrike = editor.isActive("strike");
  const isCode = editor.isActive("code");
  const isLink = editor.isActive("link");

  const handleSetLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      let finalUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href: finalUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl("");
  };

  return (
    <div className="flex items-center bg-bg-page border border-divider rounded-[6px] shadow-popup p-0.5 select-none text-[14px]">
      {showLinkInput ? (
        <div className="flex items-center px-1.5 py-0.5 gap-1">
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSetLink();
              } else if (e.key === "Escape") {
                setShowLinkInput(false);
              }
            }}
            placeholder="Paste or type link..."
            className="w-44 text-[16px] md:text-[13px] bg-transparent focus:outline-none text-text-primary placeholder:text-text-placeholder"
            autoFocus
          />
          <button
            onClick={handleSetLink}
            className="p-1 rounded-[4px] hover:bg-hover-fill text-text-secondary hover:text-text-primary notion-hover-transition"
          >
            <Check size={14} strokeWidth={1.75} />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-[4px] notion-hover-transition ${
              isBold
                ? "bg-hover-fill text-link-focus font-bold"
                : "text-text-secondary hover:bg-hover-fill hover:text-text-primary"
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={15} strokeWidth={2} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-[4px] notion-hover-transition ${
              isItalic
                ? "bg-hover-fill text-link-focus italic"
                : "text-text-secondary hover:bg-hover-fill hover:text-text-primary"
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={15} strokeWidth={1.75} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-[4px] notion-hover-transition ${
              isStrike
                ? "bg-hover-fill text-link-focus"
                : "text-text-secondary hover:bg-hover-fill hover:text-text-primary"
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={15} strokeWidth={1.75} />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded-[4px] notion-hover-transition ${
              isCode
                ? "bg-hover-fill text-link-focus"
                : "text-text-secondary hover:bg-hover-fill hover:text-text-primary"
            }`}
            title="Inline code"
          >
            <Code size={15} strokeWidth={1.75} />
          </button>

          <button
            onClick={() => {
              if (isLink) {
                editor.chain().focus().unsetLink().run();
              } else {
                setLinkUrl(editor.getAttributes("link").href || "");
                setShowLinkInput(true);
              }
            }}
            className={`p-1.5 rounded-[4px] notion-hover-transition ${
              isLink
                ? "bg-hover-fill text-link-focus"
                : "text-text-secondary hover:bg-hover-fill hover:text-text-primary"
            }`}
            title="Link"
          >
            <LinkIcon size={15} strokeWidth={1.75} />
          </button>
        </>
      )}
    </div>
  );
}
