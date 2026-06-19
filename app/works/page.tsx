"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { EmptyState, PageHeader, Pill } from "@/components/ui";
import { StoryResult } from "@/lib/types";

function NoteEditor({
  title,
  emoji,
  items,
  onChange,
}: {
  title: string;
  emoji: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="rounded-xl border border-amber-100 p-2">
      <div className="text-[11px] font-bold text-ink/50">
        {emoji} {title}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.length === 0 && (
          <span className="text-xs text-ink/40">（なし）</span>
        )}
        {items.map((it, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[12px] text-ink/80"
          >
            {it}
            <button
              className="text-ink/40 hover:text-terracotta"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        <input
          className="input py-1 text-sm"
          placeholder="メモを追加…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              onChange([...items, text.trim()]);
              setText("");
            }
          }}
        />
        <button
          className="btn btn-soft shrink-0 px-3 py-1 text-sm"
          onClick={() => {
            if (text.trim()) {
              onChange([...items, text.trim()]);
              setText("");
            }
          }}
        >
          ＋
        </button>
      </div>
    </div>
  );
}

function WorkCard({ story }: { story: StoryResult }) {
  const { setCurrentStory, saveStory, removeStory, updateStory } = useStore();

  const adopted = story.imageDesigns.filter((d) => d.verdict === "adopted");
  const rejected = story.imageDesigns.filter((d) => d.verdict === "rejected");
  const postcards = story.outputs.filter((o) => o.category === "postcard");
  const instore = story.outputs.filter((o) => o.category === "instore");

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-ink">{story.title}</h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-ink/60">
            {story.synopsis}
          </p>
        </div>
        <Pill tone={story.status === "saved" ? "ok" : "default"}>
          {story.status === "saved" ? "保存済み" : "作成中"}
        </Pill>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-[12px]">
        <Pill>📄 {story.pages.length}ページ</Pill>
        <Pill>🎨 画像設計 {story.imageDesigns.length}</Pill>
        <Pill tone="ok">⭕ 採用 {adopted.length}</Pill>
        <Pill>✖️ 不採用 {rejected.length}</Pill>
        <Pill>💌 ハガキ {postcards.length}</Pill>
        <Pill>🖼️ 店内 {instore.length}</Pill>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <NoteEditor
          title="採用構図メモ"
          emoji="⭕"
          items={story.adoptedCompositions}
          onChange={(next) =>
            updateStory(story.id, { adoptedCompositions: next })
          }
        />
        <NoteEditor
          title="不採用メモ"
          emoji="✖️"
          items={story.rejectedNotes}
          onChange={(next) => updateStory(story.id, { rejectedNotes: next })}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/story"
          onClick={() => setCurrentStory(story.id)}
          className="btn btn-primary"
        >
          📖 開く
        </Link>
        <Link
          href="/image-design"
          onClick={() => setCurrentStory(story.id)}
          className="btn btn-soft"
        >
          🎨 画像設計
        </Link>
        {story.status !== "saved" && (
          <button className="btn btn-soft" onClick={() => saveStory(story.id)}>
            💾 保存
          </button>
        )}
        <button
          className="btn btn-ghost ml-auto"
          onClick={() => {
            if (confirm(`「${story.title}」を削除します。よろしいですか？`)) {
              removeStory(story.id);
            }
          }}
        >
          🗑️ 削除
        </button>
      </div>
    </div>
  );
}

export default function WorksPage() {
  const { stories, hydrated } = useStore();
  if (!hydrated) {
    return <div className="py-20 text-center text-ink/40">読み込み中…</div>;
  }

  return (
    <div>
      <PageHeader
        no={12}
        emoji="🗂️"
        title="保存作品一覧"
        desc="作ったストーリー・画像設計・ハガキ・店内アート・採用/不採用メモをまとめて管理します。"
      />

      {stories.length === 0 ? (
        <div>
          <EmptyState emoji="🗂️" title="まだ作品がありません" />
          <div className="mt-4 text-center">
            <Link href="/create" className="btn btn-primary">
              ✍️ 最初の1話をつくる
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((s) => (
            <WorkCard key={s.id} story={s} />
          ))}
        </div>
      )}
    </div>
  );
}
