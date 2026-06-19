"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  INSTORE_SIZES,
  makeOutput,
  OutputOptions,
  POSTCARD_SIZES,
} from "@/lib/outputs";
import {
  EmptyState,
  PageHeader,
  PlaceholderImage,
  Pill,
  Toggle,
} from "@/components/ui";
import { OutputPlan } from "@/lib/types";

const aspectFor = (o: OutputPlan["orientation"]) =>
  o === "portrait" ? "aspect-[3/4]" : o === "landscape" ? "aspect-[4/3]" : "aspect-square";

function OptionRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white/70 px-3 py-2">
      <span className="text-sm text-ink/80">{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function OutputPage() {
  const {
    stories,
    currentStoryId,
    getStory,
    setCurrentStory,
    addOutput,
    removeOutput,
    textDesign,
    hydrated,
  } = useStore();

  const [category, setCategory] = useState<"instore" | "postcard">("instore");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [opts, setOpts] = useState<OutputOptions>({
    hasText: textDesign.instoreArtHasText,
    hasTitle: true,
    hasQrMargin: textDesign.qrMargin,
    shortTextIncluded: true,
  });

  if (!hydrated) {
    return <div className="py-20 text-center text-ink/40">読み込み中…</div>;
  }

  const story = getStory(currentStoryId) ?? stories[0];
  const sizes = category === "instore" ? INSTORE_SIZES : POSTCARD_SIZES;
  const preset = sizes[Math.min(sizeIdx, sizes.length - 1)];

  if (!story) {
    return (
      <div>
        <PageHeader no={11} emoji="🖼️" title="店内アート・ハガキ出力" />
        <EmptyState
          emoji="🖼️"
          title="先にストーリーと画像設計を"
          hint="作品があると、その世界観で店内アートやハガキの出力案を作れます。"
        />
        <div className="mt-4 text-center">
          <Link href="/create" className="btn btn-primary">
            ✍️ 1話をつくる
          </Link>
        </div>
      </div>
    );
  }

  const setCat = (c: "instore" | "postcard") => {
    setCategory(c);
    setSizeIdx(0);
  };

  const onAdd = () => addOutput(story.id, makeOutput(category, preset, opts));

  const instoreOutputs = story.outputs.filter((o) => o.category === "instore");
  const postcardOutputs = story.outputs.filter((o) => o.category === "postcard");

  return (
    <div>
      <PageHeader
        no={11}
        emoji="🖼️"
        title="店内アート・ハガキ出力"
        desc="作品を、店内に飾るアートや、お客様に渡すハガキの“出力案”に展開します。印刷の目安サイズ（px）つき。"
      />

      {/* 作品 */}
      <div className="card mb-4 flex flex-wrap items-center gap-2">
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
        <span className="ml-auto text-xs text-ink/45">
          🖌️ ハガキは 100mm × 148mm（縦 1181×1748px / 横 1748×1181px）
        </span>
      </div>

      {/* ビルダー */}
      <section className="card mb-6">
        <div className="mb-3 inline-flex rounded-full bg-amber-100 p-1">
          {(
            [
              ["instore", "🖼️ 店内アート"],
              ["postcard", "💌 ハガキ"],
            ] as const
          ).map(([c, label]) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                category === c ? "bg-terracotta text-white" : "text-ink/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_300px]">
          <div>
            <label className="label">サイズ</label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s, i) => (
                <button
                  key={s.sizeLabel}
                  onClick={() => setSizeIdx(i)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    i === sizeIdx
                      ? "border-terracotta bg-terracotta/10"
                      : "border-amber-200 bg-white/70 hover:bg-amber-50"
                  }`}
                >
                  <div className="font-bold text-ink">{s.sizeLabel}</div>
                  <div className="text-[11px] text-ink/50">{s.pixelLabel}</div>
                </button>
              ))}
            </div>

            <label className="label mt-4">オプション</label>
            <div className="grid gap-2 sm:grid-cols-2">
              <OptionRow
                label="文字あり"
                checked={opts.hasText}
                onChange={(v) => setOpts({ ...opts, hasText: v })}
              />
              <OptionRow
                label="タイトルあり"
                checked={opts.hasTitle}
                onChange={(v) => setOpts({ ...opts, hasTitle: v })}
              />
              <OptionRow
                label="QR余白あり"
                checked={opts.hasQrMargin}
                onChange={(v) => setOpts({ ...opts, hasQrMargin: v })}
              />
              {category === "postcard" && (
                <OptionRow
                  label="短文あり"
                  checked={opts.shortTextIncluded}
                  onChange={(v) => setOpts({ ...opts, shortTextIncluded: v })}
                />
              )}
            </div>
          </div>

          {/* プレビュー */}
          <div>
            <label className="label">プレビュー</label>
            <PlaceholderImage
              hue={category === "postcard" ? "45" : "200"}
              label={`${preset.sizeLabel}`}
              caption={preset.pixelLabel}
              aspect={aspectFor(preset.orientation)}
            />
            <button className="btn btn-primary mt-3 w-full" onClick={onAdd}>
              ＋ この設定で追加
            </button>
          </div>
        </div>
      </section>

      {/* 出力一覧 */}
      {(
        [
          ["店内アート案", instoreOutputs] as const,
          ["ハガキ案", postcardOutputs] as const,
        ]
      ).map(([title, list]) => (
        <section key={title} className="mb-6">
          <h2 className="section-title mb-3">
            {title.includes("ハガキ") ? "💌" : "🖼️"} {title}（{list.length}）
          </h2>
          {list.length === 0 ? (
            <p className="text-sm text-ink/50">まだありません。上で追加できます。</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((o) => (
                <div key={o.id} className="card">
                  <PlaceholderImage
                    hue={o.category === "postcard" ? "45" : "200"}
                    label={o.sizeLabel}
                    caption={o.pixelLabel}
                    aspect={aspectFor(o.orientation)}
                  />
                  <div className="mt-2 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-ink">{o.sizeLabel}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {o.note.split(" / ").map((t, i) => (
                          <Pill key={i}>{t}</Pill>
                        ))}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost px-2 py-1 text-xs"
                      onClick={() => removeOutput(story.id, o.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
