"use client";

import { useStore } from "@/lib/store";
import { DifficultyTag, PageHeader } from "@/components/ui";

export default function TemplatesPage() {
  const { templates, hydrated } = useStore();
  if (!hydrated) {
    return <div className="py-20 text-center text-ink/40">読み込み中…</div>;
  }

  return (
    <div>
      <PageHeader
        no={5}
        emoji="🛟"
        title="安全構図テンプレート"
        desc="鏡・顔剃り・シャンプーなど失敗しやすい高難度シーンのための“安全な構図の型”です。画像設計で自動的に適用され、失敗画像を減らします。"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-center justify-between">
              <h3 className="section-title">
                <span className="text-2xl">{t.emoji}</span>
                {t.scene}
              </h3>
              <DifficultyTag level={t.difficulty} />
            </div>

            <div className="mt-3">
              <div className="text-[11px] font-bold text-ink/50">
                安全構図のルール
              </div>
              <ul className="mt-1 space-y-1">
                {t.rules.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-ink/75"
                  >
                    <span className="mt-0.5 text-sage">✓</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 rounded-xl bg-amber-50/70 p-3">
              <div className="text-[11px] font-bold text-ink/50">推奨構図</div>
              <p className="mt-1 text-sm text-ink/80">
                {t.recommendedComposition}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
