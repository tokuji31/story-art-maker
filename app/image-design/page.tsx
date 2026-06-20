"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  CopyButton,
  DifficultyTag,
  EmptyState,
  PageHeader,
  Pill,
  UploadableImage,
} from "@/components/ui";
import {
  BackgroundPlate,
  ImageDesignItem,
  IMAGE_KIND_LABEL,
  SafeTemplate,
} from "@/lib/types";

function DesignCard({
  storyId,
  design,
  bg,
  tpl,
}: {
  storyId: string;
  design: ImageDesignItem;
  bg?: BackgroundPlate;
  tpl?: SafeTemplate;
}) {
  const { updateDesign } = useStore();

  const aspect =
    design.kind === "cover" ||
    design.kind === "instore" ||
    design.kind === "postcard-v"
      ? "aspect-[3/4]"
      : "aspect-video";

  const border =
    design.verdict === "adopted"
      ? "border-sage ring-2 ring-sage/40"
      : design.verdict === "rejected"
        ? "opacity-60"
        : "";

  return (
    <div className={`card ${border}`}>
      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        {/* 左：画像枠 */}
        <div>
          <UploadableImage
            imageUrl={design.imageUrl}
            hue={bg?.hue ?? "30"}
            label={design.label}
            caption="ここに生成画像を貼れます"
            aspect={aspect}
            onChange={(url) =>
              updateDesign(storyId, design.id, { imageUrl: url })
            }
          />
        </div>

        {/* 右：設計情報 */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-ink">
              {design.label}
              {design.label !== IMAGE_KIND_LABEL[design.kind] && (
                <span className="ml-1 text-xs text-ink/45">
                  （{IMAGE_KIND_LABEL[design.kind]}）
                </span>
              )}
            </h3>
            <DifficultyTag level={design.difficulty} />
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <Pill>📐 {design.size}</Pill>
            {bg && <Pill>🪟 背景：{bg.name}</Pill>}
            {tpl && <Pill tone="ok">🛟 安全構図：{tpl.scene}</Pill>}
          </div>

          <div className="mt-2 rounded-xl bg-amber-50/60 p-2 text-sm">
            <span className="font-bold text-ink/60">推奨構図：</span>
            <span className="text-ink/80">{design.composition}</span>
          </div>

          {/* 生成前リスクチェック */}
          {design.risks.length > 0 && (
            <div className="mt-2 rounded-xl border border-terracotta/30 bg-terracotta/5 p-2">
              <div className="text-[11px] font-bold text-terracotta">
                ⚠️ 生成前リスクチェック
              </div>
              <ul className="mt-1 space-y-0.5 text-[12px] text-ink/75">
                {design.risks.map((r, i) => (
                  <li key={i} className="flex gap-1">
                    <span>•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* プロンプト */}
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-semibold text-ink/70">
              🧾 画像生成用プロンプトを見る
            </summary>
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-ink/5 p-3 text-[12px] leading-relaxed text-ink/85">
              {design.prompt}
            </pre>
            <div className="mt-2">
              <CopyButton text={design.prompt} />
            </div>
          </details>

          {/* 採用管理 */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              className={`btn ${design.verdict === "adopted" ? "btn-primary" : "btn-soft"}`}
              onClick={() =>
                updateDesign(storyId, design.id, {
                  verdict: design.verdict === "adopted" ? null : "adopted",
                })
              }
            >
              ⭕ 採用
            </button>
            <button
              className={`btn ${design.verdict === "rejected" ? "btn-primary" : "btn-soft"}`}
              onClick={() =>
                updateDesign(storyId, design.id, {
                  verdict: design.verdict === "rejected" ? null : "rejected",
                })
              }
            >
              ✖️ 不採用
            </button>
            <Link
              href="/image-fix"
              className="btn btn-ghost text-sm"
            >
              🔧 修正ボタンへ
            </Link>
            {design.fixNotes.length > 0 && (
              <Pill>🔧 修正 {design.fixNotes.length} 件</Pill>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImageDesignPage() {
  const {
    stories,
    currentStoryId,
    getStory,
    setCurrentStory,
    buildDesigns,
    backgrounds,
    templates,
    hydrated,
  } = useStore();

  if (!hydrated) {
    return <div className="py-20 text-center text-ink/40">読み込み中…</div>;
  }

  const story = getStory(currentStoryId) ?? stories[0];

  if (!story) {
    return (
      <div>
        <PageHeader no={8} emoji="🎨" title="画像設計" />
        <EmptyState
          emoji="🎨"
          title="先にストーリーを作りましょう"
          hint="物語ができると、その内容から画像案とプロンプトを設計できます。"
        />
        <div className="mt-4 text-center">
          <Link href="/create" className="btn btn-primary">
            ✍️ 1話をつくる
          </Link>
        </div>
      </div>
    );
  }

  const bgOf = (id?: string) => backgrounds.find((b) => b.id === id);
  const tplOf = (id?: string) => templates.find((t) => t.id === id);

  return (
    <div>
      <PageHeader
        no={8}
        emoji="🎨"
        title="画像設計"
        desc="画像生成の“前”に、プロンプト・背景プレート・安全構図・難易度・リスクを設計します。失敗画像を減らすための土台です。"
      />

      {/* 作品バー */}
      <div className="card mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink/60">作品：</span>
          <select
            className="select max-w-xs"
            value={story.id}
            onChange={(e) => setCurrentStory(e.target.value)}
          >
            {stories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn btn-soft"
          onClick={() => buildDesigns(story.id)}
        >
          🔁 画像案を生成 / 作り直す
        </button>
        <Link href="/output" className="btn btn-ghost ml-auto">
          🖼️ 出力（店内アート・ハガキ）へ →
        </Link>
      </div>

      {story.imageDesigns.length === 0 ? (
        <EmptyState
          emoji="🪄"
          title="まだ画像案がありません"
          hint="「画像案を生成」を押すと、キービジュアル・表紙・店内アート・ハガキ・各ページ挿絵の設計を一括で作ります。"
        />
      ) : (
        <div className="space-y-4">
          {story.imageDesigns.map((d) => (
            <DesignCard
              key={d.id}
              storyId={story.id}
              design={d}
              bg={bgOf(d.backgroundPlateId)}
              tpl={tplOf(d.safeTemplateId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
