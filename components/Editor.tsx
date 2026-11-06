"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  useEditor,
  EditorContent,
  BubbleMenu,
  JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { wrappingInputRule } from "@tiptap/core";
import { SelectionToolbar } from "./SelectionToolbar";
import { SlashMenu, SlashMenuItem } from "./SlashMenu";
import { MobileToolbar } from "./MobileToolbar";
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
  Loader2,
  AlertCircle,
} from "lucide-react";

interface EditorProps {
  initialContent?: JSONContent;
  onChange?: (content: JSONContent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  editorRef?: React.MutableRefObject<any>;
}

// Custom TaskItem extension that adds markdown shortcuts `[] ` and `[ ] `
const CustomTaskItem = TaskItem.extend({
  addInputRules() {
    return [
      wrappingInputRule({
        find: /^\s*(\[ \]|\[\])\s$/,
        type: this.type,
      }),
    ];
  },
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Tab: () => this.editor.commands.sinkListItem(this.name),
      "Shift-Tab": () => this.editor.commands.liftListItem(this.name),
      Enter: () => {
        const { state, commands } = this.editor;
        const { $from } = state.selection;
        const currentLineText = $from.parent.textContent;
        // If current task item is empty, lift it into a text paragraph
        if (currentLineText.trim() === "") {
          return commands.liftListItem(this.name);
        }
        return commands.splitListItem(this.name);
      },
    };
  },
});

export function Editor({
  initialContent,
  onChange,
  onFocus,
  onBlur,
  editorRef,
}: EditorProps) {
  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    query: string;
    position: { top: number; left: number };
    range: { from: number; to: number };
  }>({
    isOpen: false,
    query: "",
    position: { top: 0, left: 0 },
    range: { from: 0, to: 0 },
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorInstanceRef = useRef<any>(null);

  // Upload handler for File objects
  const uploadImageFile = useCallback(
    async (file: File) => {
      // 4 MB client check
      if (file.size > 4 * 1024 * 1024) {
        setUploadError("Image exceeds 4 MB limit");
        setTimeout(() => setUploadError(null), 4000);
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to upload image");
        }

        // Insert image at cursor
        if (editorInstanceRef.current) {
          editorInstanceRef.current
            .chain()
            .focus()
            .setImage({ src: data.url })
            .run();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setUploadError(message);
        setTimeout(() => setUploadError(null), 4000);
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        blockquote: {},
        horizontalRule: {},
      }),
      TaskList,
      CustomTaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return `Heading ${node.attrs.level}`;
          }
          return "Type '/' for commands...";
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "notion-link",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "notion-image",
        },
      }),
    ],
    content: initialContent || {
      type: "doc",
      content: [{ type: "paragraph" }],
    },
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[300px]",
      },
      // Handle image paste
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
              const file = items[i].getAsFile();
              if (file) {
                event.preventDefault();
                uploadImageFile(file);
                return true;
              }
            }
          }
        }
        return false;
      },
      // Handle image drop
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            uploadImageFile(file);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());

      // Check for slash menu trigger
      const { state, view } = editor;
      const { $from } = state.selection;
      const lineText = $from.parent.textContent;

      if (lineText.startsWith("/")) {
        const query = lineText.slice(1);
        const coords = view.coordsAtPos($from.pos);
        setSlashMenu({
          isOpen: true,
          query,
          position: { top: coords.bottom, left: coords.left },
          range: { from: $from.start(), to: $from.pos },
        });
      } else {
        setSlashMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
      }
    },
    onFocus: () => {
      setIsFocused(true);
      onFocus?.();
    },
    onBlur: () => {
      // Delay un-focusing so mobile toolbar tap events can complete
      setTimeout(() => {
        setIsFocused(false);
      }, 200);
      onBlur?.();
      setTimeout(() => {
        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
      }, 150);
    },
  });

  // Keep references synced
  useEffect(() => {
    editorInstanceRef.current = editor;
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Slash menu items
  const slashMenuItems: SlashMenuItem[] = [
    {
      id: "text",
      title: "Text",
      description: "Just start writing with plain text.",
      icon: <Type size={16} strokeWidth={1.75} />,
      keywords: ["paragraph", "plain", "normal"],
      action: () => {
        if (!editor) return;
        editor.chain().focus().deleteRange(slashMenu.range).setParagraph().run();
      },
    },
    {
      id: "h1",
      title: "Heading 1",
      description: "Big section heading.",
      icon: <Heading1 size={16} strokeWidth={1.75} />,
      keywords: ["h1", "title", "large"],
      action: () => {
        if (!editor) return;
        editor.chain().focus().deleteRange(slashMenu.range).setHeading({ level: 1 }).run();
      },
    },
    {
      id: "h2",
      title: "Heading 2",
      description: "Medium section heading.",
      icon: <Heading2 size={16} strokeWidth={1.75} />,
      keywords: ["h2", "subtitle", "medium"],
      action: () => {
        if (!editor) return;
        editor.chain().focus().deleteRange(slashMenu.range).setHeading({ level: 2 }).run();
      },
    },
    {
      id: "h3",
      title: "Heading 3",
      description: "Small section heading.",
      icon: <Heading3 size={16} strokeWidth={1.75} />,
      keywords: ["h3", "subheading", "small"],
      action: () => {
        if (!editor) return;
        editor.chain().focus().deleteRange(slashMenu.range).setHeading({ level: 3 }).run();
      },
    },
    {
      id: "todo",
      title: "To-do list",
      description: "Track tasks with a to-do list.",
      icon: <CheckSquare size={16} strokeWidth={1.75} />,
      keywords: ["todo", "task", "checkbox"],
      action: () => {
        if (!editor) return;
        editor.chain().focus().deleteRange(slashMenu.range).toggleTaskList().run();
      },
    },
    {
      id: "bulletList",
      title: "Bulleted list",
      description: "Create a simple bulleted list.",
      icon: <List size={16} strokeWidth={1.75} />,
      keywords: ["bullet", "unordered", "list"],
      action: () => {
        if (!editor) return;
        editor.chain().focus().deleteRange(slashMenu.range).toggleBulletList().run();
      },
    },
    {
      id: "orderedList",
      title: "Numbered list",
      description: "Create a list with numbering.",
      icon: <ListOrdered size={16} strokeWidth={1.75} />,
      keywords: ["number", "ordered", "list"],
      action: () => {
        if (!editor) return;
        editor.chain().focus().deleteRange(slashMenu.range).toggleOrderedList().run();
      },
    },
    {
      id: "quote",
      title: "Quote",
      description: "Capture a quote.",
      icon: <Quote size={16} strokeWidth={1.75} />,
      keywords: ["quote", "blockquote"],
      action: () => {
        if (!editor) return;
        editor.chain().focus().deleteRange(slashMenu.range).toggleBlockquote().run();
      },
    },
    {
      id: "divider",
      title: "Divider",
      description: "Visually divide blocks.",
      icon: <Minus size={16} strokeWidth={1.75} />,
      keywords: ["divider", "hr", "separator", "line"],
      action: () => {
        if (!editor) return;
        editor.chain().focus().deleteRange(slashMenu.range).setHorizontalRule().run();
      },
    },
    {
      id: "image",
      title: "Image",
      description: "Upload or embed an image.",
      icon: <ImageIcon size={16} strokeWidth={1.75} />,
      keywords: ["image", "picture", "photo", "upload"],
      action: () => {
        if (!editor) return;
        editor.chain().focus().deleteRange(slashMenu.range).run();
        fileInputRef.current?.click();
      },
    },
  ];

  const handleSelectMenuItem = (item: SlashMenuItem) => {
    item.action();
    setSlashMenu((prev) => ({ ...prev, isOpen: false }));
  };

  if (!editor) {
    return <div className="py-4 text-text-placeholder text-[14px]">Loading editor...</div>;
  }

  return (
    <div className="relative w-full">
      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            uploadImageFile(file);
            e.target.value = "";
          }
        }}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {/* Floating Selection Bubble Menu */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100 }}
        shouldShow={({ state, from, to }) => {
          return !state.selection.empty && from !== to;
        }}
      >
        <SelectionToolbar editor={editor} />
      </BubbleMenu>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Mobile Keyboard-Pinned Toolbar (<768px) */}
      <MobileToolbar
        editor={editor}
        onUploadImage={() => fileInputRef.current?.click()}
        isEditorFocused={isFocused}
      />

      {/* Grey Uploading Placeholder Block */}
      {isUploading && (
        <div className="w-full my-3 py-6 px-4 bg-hover-fill/60 rounded-[4px] border border-divider flex items-center justify-center gap-2 text-text-secondary text-[14px] select-none animate-pulse">
          <Loader2 size={16} className="animate-spin text-text-secondary" />
          <span>Uploading image...</span>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="w-full my-2 p-2.5 bg-[#EB5757]/10 border border-[#EB5757]/30 rounded-[4px] flex items-center gap-2 text-[#EB5757] text-[13px]">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Slash Command Menu */}
      {slashMenu.isOpen && (
        <SlashMenu
          query={slashMenu.query}
          onSelect={handleSelectMenuItem}
          onClose={() => setSlashMenu((prev) => ({ ...prev, isOpen: false }))}
          items={slashMenuItems}
          position={slashMenu.position}
        />
      )}
    </div>
  );
}
