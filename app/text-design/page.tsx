"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader, Toggle } from "@/components/ui";
import { TEXT_MODE_LABEL, TextDesign, TextMode } from "@/lib/types";
import { TEXT_MODE_PRESETS } from "@/lib/seed";

const MODE_HINTS: Record<TextMode, string> = {
  omakase: "標準的なバランスでおまかせ",
  short: "さっと読める最小構成",
  standard: "バランス重視の基本形",
  deep: "じっくり読ませる長め",
  sns: "SNS投稿に合う短文中心",
  postcard: "ハガキの一文を活かす構成",
  instore: "店内に飾る前提・文字あり",
  imageheavy: "画像多め・文章は少なめ",
};

const NUM_FIELDS: { key: keyof TextDesign; label: string; unit: string }[] = [
  { key: "totalChars", label: "全体文字数", unit: "字" },
  { key: "pages", label: "ページ数", unit: "ページ" },
  { key: "charsPerPage", label: "1ページあたりの文字数", unit: "字" },
  { key: "inImageTextChars", label: "画像内テキスト文字数", unit: "字" },
  { key: "postcardLineChars", label: "ハガキ用一文", unit: "字" },
  { key: "snsShortChars", label: "SNS用短文", unit: "字" },
  { key: "blogIntroChars", label: "ブログ用導入文", unit: "字" },
];

export default function TextDesignPage() {
  const { textDesign, setTextDesign, hydrated } = useStore();
  const [draft, setDraft] = useState<TextDesign>(textDesign);
  const [saved, setSaved] = useState(false);

  useEffect(() => setDraft(textDesign), [textDesign, hydrated]);

  if (!hydrated) {
    return <div className="py-20 text-center text-ink/40">読み込み中…</div>;
  }

  const applyMode = (mode: TextMode) =>
    setDraft({ mode, ...TEXT_MODE_PRESETS[mode] });

  const onSave = () => {
    setTextDesign(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div>
      <PageHeader
        no={3}
        emoji="📏"
        title="文字数・余白設計"
        desc="画像を入れる前提で、文字数や余白を先に決めます。ここの「ページ数」「1ページ文字数」が、物語生成の長さに反映されます。"
      />

      {/* モード */}
      <section className="card mb-4">
        <h2 className="section-title mb-3">🎚️ モードを選ぶ</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(TEXT_MODE_LABEL) as TextMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => applyMode(m)}
              className={`rounded-xl border p-3 text-left transition ${
                draft.mode === m
                  ? "border-terracotta bg-terracotta/10 shadow-soft"
                  : "border-amber-200 bg-white/70 hover:bg-amber-50"
              }`}
            >
              <div className="text-sm font-bold text-ink">
                {TEXT_MODE_LABEL[m]}
              </div>
              <div className="mt-0.5 text-[11px] leading-snug text-ink/55">
                {MODE_HINTS[m]}
              </div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink/50">
          ※ モードを選ぶと下の数値が自動セットされます。そのあと個別に微調整もできます。
        </p>
      </section>

      {/* 数値 */}
      <section className="card mb-4">
        <h2 className="section-title mb-3">🔢 文字数の設定</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NUM_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={draft[f.key] as number}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      [f.key]: Number(e.target.value),
                    })
                  }
                />
                <span className="shrink-0 text-xs text-ink/50">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 余白・表示オプション */}
      <section className="card mb-4">
        <h2 className="section-title mb-3">🧩 余白・出力オプション</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-ink">店内アートは文字あり？</div>
              <div className="text-xs text-ink/55">
                {draft.instoreArtHasText ? "文字あり" : "文字なし（絵のみ）"}
              </div>
            </div>
            <Toggle
              checked={draft.instoreArtHasText}
              onChange={(v) => setDraft({ ...draft, instoreArtHasText: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-ink">QRコード余白を作る？</div>
              <div className="text-xs text-ink/55">
                {draft.qrMargin ? "余白あり" : "余白なし"}
              </div>
            </div>
            <Toggle
              checked={draft.qrMargin}
              onChange={(v) => setDraft({ ...draft, qrMargin: v })}
            />
          </div>
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-2xl border border-amber-100 bg-white/90 p-3 shadow-soft backdrop-blur">
        {saved && <span className="text-sm text-green-700">✅ 保存しました</span>}
        <button type="button" className="btn btn-primary" onClick={onSave}>
          💾 設計を保存
        </button>
      </div>
    </div>
  );
}
