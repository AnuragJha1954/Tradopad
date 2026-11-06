"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageSummary } from "@/lib/types";

export default function HomeRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadPages() {
      try {
        const res = await fetch("/api/pages");
        if (!res.ok) throw new Error("Failed to load pages");
        const data = await res.json();
        const pages: PageSummary[] = data.pages || [];

        if (pages.length === 0) {
          setEmpty(true);
          setLoading(false);
          return;
        }

        // Redirect to most recently edited page
        const sorted = [...pages].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        router.replace(`/p/${sorted[0].id}`);
      } catch (err) {
        console.error("Home load error:", err);
        setEmpty(true);
        setLoading(false);
      }
    }

    loadPages();
  }, [router]);

  const handleCreatePage = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      });
      if (!res.ok) throw new Error("Failed to create page");
      const newPage = await res.json();
      router.push(`/p/${newPage.id}`);
    } catch (err) {
      console.error("Create page error:", err);
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-bg-page text-text-placeholder text-[14px]">
        Loading...
      </div>
    );
  }

  // Section 3: "If there are none, show a centred 'New page' button and nothing else"
  if (empty) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-bg-page select-none">
        <button
          onClick={handleCreatePage}
          disabled={creating}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-divider hover:bg-hover-fill notion-hover-transition text-text-primary text-[14px] font-medium"
        >
          <Plus size={16} strokeWidth={1.75} />
          <span>{creating ? "Creating..." : "New page"}</span>
        </button>
      </div>
    );
  }

  return null;
}
