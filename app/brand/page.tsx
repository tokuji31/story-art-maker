"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import { BrandLedger } from "@/lib/types";

export default function BrandPage() {
  const { brand, setBrand, hydrated } = useStore();
  const [draft, setDraft] = useState<BrandLedger>(brand);
  const [saved, setSaved] = useState(false);

  // ストアがハイドレートされたら下書きを同期
  useEffect(() => {
    setDraft(brand);
  }, [brand, hydrated]);

  if (!hydrated) {
    return <div className="py-20 text-center text-ink/40">読み込み中…</div>;
  }

  const onSave = () => {
    setBrand(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const store = draft.store;
  const set = (patch: Partial<BrandLedger>) => setDraft({ ...draft, ...patch });

  return (
    <div>
      <PageHeader
        no={2}
        emoji="📖"
        title="ブランド台帳"
        desc="お店の世界観・固定キャラ・看板メニュー・物語ルールを確認／編集します。物語と画像はここを土台に生成されます。"
      />

      {/* 店舗情報 */}
      <section className="card mb-4">
        <h2 className="section-title mb-3">🏠 店舗情報</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["name", "店名"],
              ["industry", "業種"],
              ["storeType", "店舗タイプ"],
              ["tagline", "お店の一言"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                className="input"
                value={store[key]}
                onChange={(e) =>
                  set({ store: { ...store, [key]: e.target.value } })
                }
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="label">主なお客様</label>
            <input
              className="input"
              value={store.customers}
              onChange={(e) =>
                set({ store: { ...store, customers: e.target.value } })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">お店の雰囲気</label>
            <input
              className="input"
              value={store.atmosphere}
              onChange={(e) =>
                set({ store: { ...store, atmosphere: e.target.value } })
              }
            />
          </div>
        </div>
      </section>

      {/* ブランドの核 */}
      <section className="card mb-4">
        <h2 className="section-title mb-3">💗 ブランドの核</h2>
        <textarea
          className="textarea min-h-[120px]"
          value={draft.core}
          onChange={(e) => set({ core: e.target.value })}
        />
      </section>

      {/* 固定キャラ */}
      <section className="card mb-4">
        <h2 className="section-title mb-3">🧑‍🎨 固定キャラクター</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {draft.characters.map((c, i) => (
            <div key={c.id} className="rounded-xl border border-amber-100 p-3">
              <div className="mb-2 text-center text-3xl">{c.emoji}</div>
              {(
                [
                  ["name", "名前"],
                  ["role", "役割"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="mb-2">
                  <label className="label">{label}</label>
                  <input
                    className="input"
                    value={c[key]}
                    onChange={(e) => {
                      const next = [...draft.characters];
                      next[i] = { ...c, [key]: e.target.value };
                      set({ characters: next });
                    }}
                  />
                </div>
              ))}
              <div className="mb-2">
                <label className="label">性格</label>
                <textarea
                  className="textarea min-h-[60px]"
                  value={c.personality}
                  onChange={(e) => {
                    const next = [...draft.characters];
                    next[i] = { ...c, personality: e.target.value };
                    set({ characters: next });
                  }}
                />
              </div>
              <div>
                <label className="label">物語での役目</label>
                <textarea
                  className="textarea min-h-[60px]"
                  value={c.storyRole}
                  onChange={(e) => {
                    const next = [...draft.characters];
                    next[i] = { ...c, storyRole: e.target.value };
                    set({ characters: next });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 看板メニュー */}
      <section className="card mb-4">
        <h2 className="section-title mb-3">⭐ 看板メニュー</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">メニュー名</label>
            <input
              className="input"
              value={draft.menu.name}
              onChange={(e) =>
                set({ menu: { ...draft.menu, name: e.target.value } })
              }
            />
          </div>
          <div>
            <label className="label">内容</label>
            <input
              className="input"
              value={draft.menu.content}
              onChange={(e) =>
                set({ menu: { ...draft.menu, content: e.target.value } })
              }
            />
          </div>
        </div>
        <h3 className="mb-2 mt-4 text-sm font-bold text-ink/80">
          サービス工程と心の変化
        </h3>
        <div className="space-y-2">
          {draft.menu.steps.map((step, i) => (
            <div
              key={step.id}
              className="grid items-center gap-2 rounded-xl border border-amber-100 p-2 sm:grid-cols-[auto_140px_1fr]"
            >
              <div className="text-center text-xl">{step.emoji}</div>
              <input
                className="input"
                value={step.name}
                onChange={(e) => {
                  const next = [...draft.menu.steps];
                  next[i] = { ...step, name: e.target.value };
                  set({ menu: { ...draft.menu, steps: next } });
                }}
              />
              <input
                className="input"
                value={step.meaning}
                onChange={(e) => {
                  const next = [...draft.menu.steps];
                  next[i] = { ...step, meaning: e.target.value };
                  set({ menu: { ...draft.menu, steps: next } });
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 物語ルール */}
      <section className="card mb-4">
        <h2 className="section-title mb-3">📜 物語ルール</h2>
        <div className="space-y-2">
          {draft.rules.map((rule, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2 text-ink/40">{i + 1}.</span>
              <input
                className="input"
                value={rule}
                onChange={(e) => {
                  const next = [...draft.rules];
                  next[i] = e.target.value;
                  set({ rules: next });
                }}
              />
              <button
                type="button"
                className="btn btn-ghost px-2"
                onClick={() =>
                  set({ rules: draft.rules.filter((_, j) => j !== i) })
                }
              >
                🗑️
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-soft"
            onClick={() => set({ rules: [...draft.rules, ""] })}
          >
            ＋ ルールを追加
          </button>
        </div>
      </section>

      {/* 保存バー */}
      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-2xl border border-amber-100 bg-white/90 p-3 shadow-soft backdrop-blur">
        {saved && <span className="text-sm text-green-700">✅ 保存しました</span>}
        <button type="button" className="btn btn-primary" onClick={onSave}>
          💾 変更を保存
        </button>
      </div>
    </div>
  );
}
