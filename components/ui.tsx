"use client";

import React, { useState } from "react";
import { Difficulty, DIFFICULTY_LABEL } from "@/lib/types";

// ---- プレースホルダー画像カード（APIキー無しでも“画像枠”を見せる） ------
export function PlaceholderImage({
  hue = "30",
  label,
  caption = "画像プレースホルダー（生成API未接続）",
  aspect = "aspect-video",
}: {
  hue?: string;
  label: string;
  caption?: string;
  aspect?: string;
}) {
  const bg = `linear-gradient(135deg, hsl(${hue} 70% 88%), hsl(${
    (Number(hue) + 40) % 360
  } 60% 80%))`;
  return (
    <div
      className={`relative flex ${aspect} w-full items-center justify-center overflow-hidden rounded-xl border border-amber-100`}
      style={{ background: bg }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.4) 10px, rgba(255,255,255,.4) 12px)",
        }}
      />
      <div className="relative px-3 text-center">
        <div className="text-3xl">🖼️</div>
        <div className="mt-1 text-sm font-bold text-ink/80">{label}</div>
        <div className="mt-0.5 text-[11px] text-ink/50">{caption}</div>
      </div>
    </div>
  );
}

// ---- 難易度タグ -------------------------------------------------------
export function DifficultyTag({ level }: { level: Difficulty }) {
  const styles: Record<Difficulty, string> = {
    low: "bg-sage/20 text-green-800 border-sage/40",
    mid: "bg-sun/20 text-yellow-800 border-sun/50",
    high: "bg-terracotta/15 text-terracotta border-terracotta/40",
  };
  return (
    <span className={`chip border ${styles[level]}`}>
      難易度：{DIFFICULTY_LABEL[level]}
    </span>
  );
}

// ---- コピーボタン -----------------------------------------------------
export function CopyButton({
  text,
  label = "プロンプトをコピー",
}: {
  text: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);
  const onCopy = async () => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      setDone(false);
    }
  };
  return (
    <button type="button" onClick={onCopy} className="btn btn-soft">
      {done ? "✅ コピーしました" : `📋 ${label}`}
    </button>
  );
}

// ---- トグルスイッチ ---------------------------------------------------
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
    >
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "bg-terracotta" : "bg-amber-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
      {label && <span className="text-sm text-ink/80">{label}</span>}
    </button>
  );
}

// ---- 空状態 -----------------------------------------------------------
export function EmptyState({
  emoji = "🌱",
  title,
  hint,
}: {
  emoji?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 py-10 text-center">
      <div className="text-4xl">{emoji}</div>
      <div className="font-bold text-ink/80">{title}</div>
      {hint && <div className="max-w-md text-sm text-ink/60">{hint}</div>}
    </div>
  );
}

// ---- 見出し -----------------------------------------------------------
export function PageHeader({
  no,
  emoji,
  title,
  desc,
}: {
  no?: number;
  emoji: string;
  title: string;
  desc?: string;
}) {
  return (
    <header className="mb-5">
      <div className="flex items-center gap-2">
        {no !== undefined && (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-terracotta text-sm font-bold text-white">
            {no}
          </span>
        )}
        <h1 className="text-xl font-extrabold text-ink sm:text-2xl">
          <span className="mr-1">{emoji}</span>
          {title}
        </h1>
      </div>
      {desc && <p className="mt-1 text-sm text-ink/60">{desc}</p>}
    </header>
  );
}

// ---- 小さなラベル付きピル --------------------------------------------
export function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "warn" | "ok";
}) {
  const tones = {
    default: "bg-white/70 border-amber-200 text-ink/80",
    warn: "bg-terracotta/10 border-terracotta/40 text-terracotta",
    ok: "bg-sage/20 border-sage/50 text-green-800",
  };
  return <span className={`chip border ${tones[tone]}`}>{children}</span>;
}
