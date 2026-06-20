"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { checkAll } from "@/lib/expressionCheck";
import { EmptyState, PageHeader, Pill } from "@/components/ui";

export default function StoryPage() {
  const {
    stories,
    currentStoryId,
    getStory,
    setCurrentStory,
    saveStory,
    backgrounds,
    hydrated,
  } = useStore();

  if (!hydrated) {
    return <div className="py-20 text-center text-ink/40">読み込み中…</div>;
  }

  const story = getStory(currentStoryId) ?? stories[0];

  if (!story) {
    return (
      <div>
        <PageHeader no={7} emoji="📚" title="ストーリー結果" />
        <EmptyState
          emoji="📝"
          title="まだストーリーがありません"
          hint="「1話作成」から物語を生成すると、ここに結果が表示されます。"
        />
        <div className="mt-4 text-center">
          <Link href="/create" className="btn btn-primary">
            ✍️ 1話をつくる
          </Link>
        </div>
      </div>
    );
  }

  const bgName = (id?: string) =>
    backgrounds.find((b) => b.id === id)?.name ?? "—";

  const hits = checkAll([
    story.title,
    story.synopsis,
    ...story.pages.map((p) => p.text),
    story.postcardLine,
    story.snsShort,
    story.blogIntro,
  ]);

  return (
    <div>
      <PageHeader no={7} emoji="📚" title="ストーリー結果" />

      {/* 作品切替 */}
      {stories.length > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-ink/60">表示中の作品：</span>
          <select
            className="select max-w-xs"
            value={story.id}
            onChange={(e) => setCurrentStory(e.target.value)}
          >
            {stories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}（{s.status === "saved" ? "保存済み" : "作成中"}）
              </option>
            ))}
          </select>
        </div>
      )}

      {/* タイトル・あらすじ */}
      <section className="card mb-4 bg-gradient-to-br from-white/90 to-amber-50/70">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-extrabold text-ink">{story.title}</h1>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Pill tone={story.status === "saved" ? "ok" : "default"}>
              {story.status === "saved" ? "保存済み" : "作成中"}
            </Pill>
            <Pill tone={story.source === "ai" ? "warn" : "default"}>
              {story.source === "ai" ? "✨ AI生成" : "🆓 テンプレ"}
            </Pill>
          </div>
        </div>
        <p className="mt-2 leading-relaxed text-ink/75">{story.synopsis}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {story.usedSteps.map((s) => (
            <Pill key={s}>⭐ {s}</Pill>
          ))}
        </div>
      </section>

      {/* 表現チェック */}
      {hits.length > 0 && (
        <section className="card mb-4 border-terracotta/40 bg-terracotta/5">
          <h2 className="section-title mb-2 text-terracotta">
            ⚠️ 表現チェック（やわらかい言い換えの提案）
          </h2>
          <ul className="space-y-1 text-sm">
            {hits.map((h) => (
              <li key={h.word}>
                <span className="font-bold text-terracotta">「{h.word}」</span>
                <span className="text-ink/60"> → </span>
                {h.alternatives.map((a, i) => (
                  <span key={i} className="mr-1 text-ink/80">
                    「{a}」
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 感情の流れ */}
      <section className="card mb-4">
        <h2 className="section-title mb-3">💞 感情の流れ</h2>
        <div className="flex flex-wrap items-center gap-1.5">
          {story.emotionFlow.map((e, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="chip">{e}</span>
              {i < story.emotionFlow.length - 1 && (
                <span className="text-ink/30">→</span>
              )}
            </span>
          ))}
        </div>
      </section>

      {/* ページごとの本文 */}
      <section className="mb-4">
        <h2 className="section-title mb-3">📄 ページごとの本文</h2>
        <div className="space-y-3">
          {story.pages.map((p) => (
            <div key={p.index} className="card">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-terracotta text-sm font-bold text-white">
                  {p.index}
                </span>
                <Pill>⭐ {p.serviceStep}</Pill>
                <Pill>💞 {p.emotion}</Pill>
                <span className="ml-auto text-xs text-ink/45">
                  {p.charCount} 字
                </span>
              </div>
              <p className="whitespace-pre-line leading-relaxed text-ink/85">
                {p.text}
              </p>
              <div className="mt-3 rounded-xl bg-sky/10 p-3 text-sm">
                <span className="font-bold text-ink/60">🎨 画像シーン案：</span>
                <span className="text-ink/80">{p.imageScene}</span>
                <span className="mt-1 block text-[11px] text-ink/50">
                  背景プレート：{bgName(p.backgroundPlateId)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 気づき・展開テキスト */}
      <section className="grid gap-3 sm:grid-cols-2">
        <div className="card">
          <h3 className="font-bold text-ink">🌱 最後の気づき</h3>
          <p className="mt-1 text-ink/80">{story.finalRealization}</p>
        </div>
        <div className="card">
          <h3 className="font-bold text-ink">💌 ハガキ用一文</h3>
          <p className="mt-1 text-ink/80">{story.postcardLine}</p>
        </div>
        <div className="card">
          <h3 className="font-bold text-ink">📱 SNS用短文</h3>
          <p className="mt-1 whitespace-pre-wrap text-ink/80">{story.snsShort}</p>
        </div>
        <div className="card">
          <h3 className="font-bold text-ink">✏️ ブログ導入文</h3>
          <p className="mt-1 whitespace-pre-line text-ink/80">{story.blogIntro}</p>
        </div>
      </section>

      {/* アクション */}
      <div className="sticky bottom-4 z-10 mt-4 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-amber-100 bg-white/90 p-3 shadow-soft backdrop-blur">
        {story.status !== "saved" && (
          <button
            className="btn btn-soft"
            onClick={() => saveStory(story.id)}
          >
            💾 保存する
          </button>
        )}
        <Link href="/image-design" className="btn btn-primary">
          🎨 画像設計へ進む
        </Link>
      </div>
    </div>
  );
}
