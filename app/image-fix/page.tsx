"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { FIX_GROUPS } from "@/lib/fixButtons";
import { CopyButton, EmptyState, PageHeader, Pill } from "@/components/ui";

export default function ImageFixPage() {
  const {
    stories,
    currentStoryId,
    getStory,
    setCurrentStory,
    updateDesign,
    hydrated,
  } = useStore();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetId, setTargetId] = useState<string>("");
  const [savedMsg, setSavedMsg] = useState(false);

  const story = getStory(currentStoryId) ?? stories[0];

  const allButtons = useMemo(
    () => FIX_GROUPS.flatMap((g) => g.buttons),
    [],
  );

  const instructions = useMemo(
    () =>
      allButtons
        .filter((b) => selected.has(b.id))
        .map((b) => `・${b.instruction}`),
    [allButtons, selected],
  );

  if (!hydrated) {
    return <div className="py-20 text-center text-ink/40">読み込み中…</div>;
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const target = story?.imageDesigns.find((d) => d.id === targetId);

  const applyToDesign = () => {
    if (!story || !target) return;
    updateDesign(story.id, target.id, {
      fixNotes: instructions.map((s) => s.replace(/^・/, "")),
    });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1800);
  };

  return (
    <div>
      <PageHeader
        no={10}
        emoji="🔧"
        title="画像修正ボタン"
        desc="修正をプロンプトで書く必要はありません。ボタンを押すだけで、修正指示文が自動でできあがります。"
      />

      {/* 対象選択 */}
      {story && story.imageDesigns.length > 0 && (
        <div className="card mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink/60">修正する画像案：</span>
          <select
            className="select max-w-xs"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">（選ばない・指示文だけ作る）</option>
            {story.imageDesigns.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            className="select ml-auto max-w-xs"
            value={story.id}
            onChange={(e) => {
              setCurrentStory(e.target.value);
              setTargetId("");
            }}
          >
            {stories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* ボタン群 */}
        <div className="space-y-4">
          {FIX_GROUPS.map((g) => (
            <section key={g.id} className="card">
              <h2 className="section-title mb-3">
                {g.emoji} {g.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {g.buttons.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggle(b.id)}
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      selected.has(b.id)
                        ? "border-terracotta bg-terracotta text-white shadow-soft"
                        : "border-amber-200 bg-white/70 text-ink hover:bg-amber-50"
                    }`}
                  >
                    {selected.has(b.id) ? "✓ " : "＋ "}
                    {b.label}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* 指示文パネル */}
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <div className="card">
            <h2 className="section-title mb-2">📝 修正指示文</h2>
            {instructions.length === 0 ? (
              <p className="text-sm text-ink/55">
                左のボタンを押すと、ここに修正指示文が自動で表示されます。
              </p>
            ) : (
              <>
                <ul className="space-y-1 text-sm text-ink/80">
                  {instructions.map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-col gap-2">
                  <CopyButton
                    text={instructions.map((s) => s.replace(/^・/, "")).join("\n")}
                    label="指示文をコピー"
                  />
                  {target && (
                    <button className="btn btn-primary" onClick={applyToDesign}>
                      💾「{target.label}」に保存
                    </button>
                  )}
                  <button
                    className="btn btn-ghost"
                    onClick={() => setSelected(new Set())}
                  >
                    クリア
                  </button>
                </div>
                {savedMsg && (
                  <p className="mt-2 text-sm text-green-700">
                    ✅ 画像案に保存しました
                  </p>
                )}
              </>
            )}

            {target && target.fixNotes.length > 0 && (
              <div className="mt-3 border-t border-amber-100 pt-2">
                <div className="text-[11px] font-bold text-ink/50">
                  この案に保存済みの修正
                </div>
                <ul className="mt-1 space-y-0.5 text-[12px] text-ink/70">
                  {target.fixNotes.map((n, i) => (
                    <li key={i}>・{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      {!story && (
        <div className="mt-4">
          <EmptyState
            emoji="🎨"
            title="先に画像設計をしましょう"
            hint="画像案があると、その案に修正指示を保存できます。"
          />
        </div>
      )}
    </div>
  );
}
