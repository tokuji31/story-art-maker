"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { EmptyState, PageHeader, Pill } from "@/components/ui";

const GENERAL_RISKS = [
  {
    emoji: "🪞",
    title: "鏡の反射",
    body: "鏡があるシーンは、鏡像と本人の顔が食い違いやすいです。反射は主役にせず、本人の表情を中心に。",
  },
  {
    emoji: "🪒",
    title: "顔剃りの手元",
    body: "手元アップは、手やカミソリの角度が崩れやすいです。手元・刃物は控えめ・抽象的に。",
  },
  {
    emoji: "🫧",
    title: "シャンプー椅子",
    body: "椅子の向きと体の角度がずれやすいです。首は無理のない自然な角度に、泡は控えめに。",
  },
  {
    emoji: "🪑",
    title: "背景にない家具",
    body: "背景プレートにない家具・小物を足すと破綻しやすいです。登録背景に固定してください。",
  },
];

export default function RiskCheckPage() {
  const { stories, currentStoryId, getStory, hydrated } = useStore();
  if (!hydrated) {
    return <div className="py-20 text-center text-ink/40">読み込み中…</div>;
  }

  const story = getStory(currentStoryId) ?? stories[0];
  const designsWithRisk =
    story?.imageDesigns.filter((d) => d.risks.length > 0) ?? [];

  return (
    <div>
      <PageHeader
        no={9}
        emoji="⚠️"
        title="生成前リスクチェック"
        desc="画像生成の前に、失敗しやすいポイントを確認します。ここを意識すると、何度も失敗画像を作らずに済みます。"
      />

      {/* 一般的なリスク */}
      <section className="mb-5 grid gap-3 sm:grid-cols-2">
        {GENERAL_RISKS.map((r) => (
          <div key={r.title} className="card">
            <h3 className="font-bold text-ink">
              {r.emoji} {r.title}
            </h3>
            <p className="mt-1 text-sm text-ink/70">{r.body}</p>
          </div>
        ))}
      </section>

      {/* 今の作品の個別リスク */}
      <h2 className="section-title mb-3">🔍 この作品の画像案ごとのチェック</h2>
      {!story ? (
        <EmptyState emoji="📝" title="先にストーリーを作りましょう" />
      ) : designsWithRisk.length === 0 ? (
        <EmptyState
          emoji="🎨"
          title="画像案がまだありません"
          hint="「画像設計」で画像案を生成すると、ここに案ごとのリスクが並びます。"
        />
      ) : (
        <div className="space-y-3">
          {designsWithRisk.map((d) => (
            <div key={d.id} className="card">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-ink">{d.label}</h3>
                <Pill tone="warn">⚠️ {d.risks.length} 件</Pill>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-ink/75">
                {d.risks.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-terracotta">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/image-design" className="btn btn-soft">
          🎨 画像設計に戻る
        </Link>
        <Link href="/image-fix" className="btn btn-primary">
          🔧 修正ボタンで直す →
        </Link>
      </div>
    </div>
  );
}
