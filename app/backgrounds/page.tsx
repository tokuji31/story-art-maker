"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { DifficultyTag, PageHeader, PlaceholderImage } from "@/components/ui";
import { BackgroundPlate, Difficulty } from "@/lib/types";

const toLines = (arr: string[]) => arr.join("\n");
const fromLines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

function AttrList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "ok" | "warn";
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2">
      <div className="text-[11px] font-bold text-ink/50">{title}</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.map((it, i) => (
          <span
            key={i}
            className={`rounded-md px-2 py-0.5 text-[11px] ${
              tone === "ok"
                ? "bg-sage/20 text-green-800"
                : "bg-terracotta/10 text-terracotta"
            }`}
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function BackgroundCard({ bg }: { bg: BackgroundPlate }) {
  const { updateBackground } = useStore();
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState<BackgroundPlate>(bg);

  const onSave = () => {
    updateBackground(bg.id, d);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="card">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="label">背景名</label>
            <input
              className="input"
              value={d.name}
              onChange={(e) => setD({ ...d, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">使用シーン</label>
            <input
              className="input"
              value={d.scene}
              onChange={(e) => setD({ ...d, scene: e.target.value })}
            />
          </div>
          <div>
            <label className="label">椅子の向き</label>
            <input
              className="input"
              value={d.chairDirection}
              onChange={(e) => setD({ ...d, chairDirection: e.target.value })}
            />
          </div>
          <div>
            <label className="label">難易度</label>
            <select
              className="select"
              value={d.difficulty}
              onChange={(e) =>
                setD({ ...d, difficulty: e.target.value as Difficulty })
              }
            >
              <option value="low">やさしい</option>
              <option value="mid">ふつう</option>
              <option value="high">高難度</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={d.hasMirror}
              onChange={(e) => setD({ ...d, hasMirror: e.target.checked })}
            />
            鏡あり
          </label>
          {(
            [
              ["allowedCompositions", "使える構図（改行区切り）"],
              ["forbiddenCompositions", "禁止構図（改行区切り）"],
              ["allowedProps", "追加してよい小物（改行区切り）"],
              ["forbiddenProps", "追加禁止物（改行区切り）"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <textarea
                className="textarea min-h-[70px]"
                value={toLines(d[key])}
                onChange={(e) => setD({ ...d, [key]: fromLines(e.target.value) })}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => {
              setD(bg);
              setEditing(false);
            }}
          >
            キャンセル
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            💾 保存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <PlaceholderImage hue={bg.hue} label={bg.name} aspect="aspect-[4/3]" />
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="font-bold text-ink">{bg.name}</h3>
        <button
          className="btn btn-ghost px-2 py-1 text-xs"
          onClick={() => {
            setD(bg);
            setEditing(true);
          }}
        >
          ✏️ 編集
        </button>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink/60">
        <DifficultyTag level={bg.difficulty} />
        <span className="chip">🪞 鏡：{bg.hasMirror ? "あり" : "なし"}</span>
      </div>
      <dl className="mt-2 space-y-1 text-sm text-ink/70">
        <div>
          <span className="text-ink/45">使用シーン：</span>
          {bg.scene}
        </div>
        <div>
          <span className="text-ink/45">椅子の向き：</span>
          {bg.chairDirection}
        </div>
      </dl>
      <AttrList title="使える構図" items={bg.allowedCompositions} tone="ok" />
      <AttrList title="禁止構図" items={bg.forbiddenCompositions} tone="warn" />
      <AttrList title="追加してよい小物" items={bg.allowedProps} tone="ok" />
      <AttrList title="追加禁止物" items={bg.forbiddenProps} tone="warn" />
    </div>
  );
}

export default function BackgroundsPage() {
  const { backgrounds, hydrated } = useStore();
  if (!hydrated) {
    return <div className="py-20 text-center text-ink/40">読み込み中…</div>;
  }
  return (
    <div>
      <PageHeader
        no={4}
        emoji="🪟"
        title="背景プレート管理"
        desc="店内の背景を“固定資産”として登録します。背景を自由生成させず、ここに固定することで画像のブレを防ぎます。第一弾は仮プレート（色カード）です。"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {backgrounds.map((bg) => (
          <BackgroundCard key={bg.id} bg={bg} />
        ))}
      </div>
    </div>
  );
}
