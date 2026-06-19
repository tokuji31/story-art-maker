"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { EmptyState, Pill } from "@/components/ui";
import { IMAGE_KIND_LABEL, StoryResult } from "@/lib/types";

function StoryCard({ story }: { story: StoryResult }) {
  const { setCurrentStory } = useStore();
  return (
    <Link
      href="/story"
      onClick={() => setCurrentStory(story.id)}
      className="card block transition hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-ink">{story.title}</h3>
        <Pill tone={story.status === "saved" ? "ok" : "default"}>
          {story.status === "saved" ? "保存済み" : "作成中"}
        </Pill>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-ink/60">{story.synopsis}</p>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
        <Pill>📄 {story.pages.length}ページ</Pill>
        <Pill>🎨 画像設計 {story.imageDesigns.length}</Pill>
        <Pill>🖼️ 出力 {story.outputs.length}</Pill>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const { stories, hydrated } = useStore();

  if (!hydrated) {
    return <div className="py-20 text-center text-ink/40">読み込み中…</div>;
  }

  const drafts = stories.filter((s) => s.status === "draft");
  const saved = stories.filter((s) => s.status === "saved");
  const allDesigns = stories.flatMap((s) => s.imageDesigns);
  const postcards = allDesigns.filter((d) => d.kind.startsWith("postcard"));
  const instore = allDesigns.filter((d) => d.kind === "instore");

  const stats = [
    { label: "保存済み", value: saved.length, emoji: "📚" },
    { label: "作成中", value: drafts.length, emoji: "✍️" },
    { label: "画像設計", value: allDesigns.length, emoji: "🎨" },
    { label: "ハガキ案", value: postcards.length, emoji: "💌" },
    { label: "店内アート案", value: instore.length, emoji: "🖼️" },
  ];

  return (
    <div>
      {/* ヒーロー */}
      <section className="card mb-6 bg-gradient-to-br from-white/90 to-amber-50/80">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          🎨 お店の物語を、絵本とアートに。
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/70">
          美肌理容室つるるんとんの世界観をもとに、1話完結の絵本ストーリーをつくり、
          キービジュアル・店内アート・ハガキ用画像までを設計できるデモアプリです。
          画像生成は未接続でも、プロンプト・推奨構図・プレースホルダーで一通り体験できます。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/create" className="btn btn-primary">
            ✍️ 新しい1話をつくる
          </Link>
          <Link href="/brand" className="btn btn-soft">
            📖 ブランド台帳を見る
          </Link>
          <Link href="/text-design" className="btn btn-soft">
            📏 文字数・余白を設計
          </Link>
        </div>
      </section>

      {/* 統計 */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="card flex flex-col items-center py-4">
            <div className="text-2xl">{s.emoji}</div>
            <div className="mt-1 text-2xl font-extrabold text-terracotta">
              {s.value}
            </div>
            <div className="text-xs text-ink/60">{s.label}</div>
          </div>
        ))}
      </section>

      {/* 作成中 */}
      <section className="mb-6">
        <h2 className="section-title mb-3">✍️ 作成中のストーリー</h2>
        {drafts.length === 0 ? (
          <EmptyState
            emoji="🪺"
            title="作成中のストーリーはありません"
            hint="「新しい1話をつくる」から、ゲストと悩みを入力して物語を生成できます。"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {drafts.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        )}
      </section>

      {/* 保存済み */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">📚 保存済みストーリー</h2>
          <Link href="/works" className="text-sm text-terracotta hover:underline">
            すべて見る →
          </Link>
        </div>
        {saved.length === 0 ? (
          <EmptyState emoji="📚" title="保存済みストーリーはまだありません" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {saved.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        )}
      </section>

      {/* 画像設計・ハガキ案・店内アート案 一覧 */}
      <section className="grid gap-3 sm:grid-cols-3">
        {(
          [
            { title: "画像設計", emoji: "🎨", items: allDesigns, href: "/image-design" },
            { title: "ハガキ案", emoji: "💌", items: postcards, href: "/output" },
            { title: "店内アート案", emoji: "🖼️", items: instore, href: "/output" },
          ] as const
        ).map((col) => (
          <div key={col.title} className="card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold text-ink">
                {col.emoji} {col.title}
              </h3>
              <Link
                href={col.href}
                className="text-xs text-terracotta hover:underline"
              >
                開く →
              </Link>
            </div>
            {col.items.length === 0 ? (
              <p className="text-sm text-ink/50">まだありません</p>
            ) : (
              <ul className="space-y-1 text-sm text-ink/70">
                {col.items.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex items-center gap-1">
                    <span className="text-xs">•</span>
                    {IMAGE_KIND_LABEL[d.kind]}
                  </li>
                ))}
                {col.items.length > 5 && (
                  <li className="text-xs text-ink/40">
                    ほか {col.items.length - 5} 件
                  </li>
                )}
              </ul>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
