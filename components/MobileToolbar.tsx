"use client";

import React, { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";
import {
  CheckSquare,
  Heading2,
  List,
  Image as ImageIcon,
  Undo,
} from "lucide-react";

interface MobileToolbarProps {
  editor: Editor | null;
  onUploadImage: () => void;
  isEditorFocused: boolean;
}

export function MobileToolbar({
  editor,
  onUploadImage,
  isEditorFocused,
}: MobileToolbarProps) {
  const [bottom, setBottom] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile width (< 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Track visualViewport for virtual keyboard on phones
  useEffect(() => {
    if (!isMobile || !window.visualViewport) return;

    const viewport = window.visualViewport;

    const updatePosition = () => {
      // Calculate distance between layout viewport bottom and visual viewport bottom
      const offsetBottom = window.innerHeight - (viewport.height + viewport.offsetTop);
      setBottom(Math.max(0, Math.round(offsetBottom)));
    };

    updatePosition();
    viewport.addEventListener("resize", updatePosition);
    viewport.addEventListener("scroll", updatePosition);

    return () => {
      viewport.removeEventListener("resize", updatePosition);
      viewport.removeEventListener("scroll", updatePosition);
    };
  }, [isMobile]);

  if (!isMobile || !editor || !isEditorFocused) {
    return null;
  }

  return (
    <div
      style={{ bottom: `${bottom}px` }}
      className="fixed left-0 right-0 z-40 bg-bg-page border-t border-divider flex items-center justify-around h-11 px-2 select-none md:hidden shadow-[0_-2px_6px_rgba(0,0,0,0.04)]"
    >
      {/* To-Do */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleTaskList().run();
        }}
        className="flex-1 h-full min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary active:bg-hover-fill notion-hover-transition"
        aria-label="Insert to-do list"
      >
        <CheckSquare size={19} strokeWidth={1.75} />
      </button>

      {/* Heading */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleHeading({ level: 2 }).run();
        }}
        className="flex-1 h-full min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary active:bg-hover-fill notion-hover-transition"
        aria-label="Insert heading"
      >
        <Heading2 size={19} strokeWidth={1.75} />
      </button>

      {/* Bulleted List */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBulletList().run();
        }}
        className="flex-1 h-full min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary active:bg-hover-fill notion-hover-transition"
        aria-label="Insert bulleted list"
      >
        <List size={19} strokeWidth={1.75} />
      </button>

      {/* Image */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onUploadImage();
        }}
        className="flex-1 h-full min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary active:bg-hover-fill notion-hover-transition"
        aria-label="Upload image"
      >
        <ImageIcon size={19} strokeWidth={1.75} />
      </button>

      {/* Undo */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          editor.chain().focus().undo().run();
        }}
        className="flex-1 h-full min-h-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary active:bg-hover-fill notion-hover-transition"
        aria-label="Undo"
      >
        <Undo size={19} strokeWidth={1.75} />
      </button>
    </div>
  );
}
