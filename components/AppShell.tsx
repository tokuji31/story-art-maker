"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { useStore } from "@/lib/store";

type NavItem =
  | { group: string }
  | { no: number; href: string; label: string; emoji: string };

const NAV: NavItem[] = [
  { no: 1, href: "/", label: "ダッシュボード", emoji: "🏠" },
  { group: "ブランド・設計" },
  { no: 2, href: "/brand", label: "ブランド台帳", emoji: "📖" },
  { no: 3, href: "/text-design", label: "文字数・余白設計", emoji: "📏" },
  { no: 4, href: "/backgrounds", label: "背景プレート", emoji: "🪟" },
  { no: 5, href: "/templates", label: "安全構図テンプレ", emoji: "🛟" },
  { group: "つくる" },
  { no: 6, href: "/create", label: "1話作成", emoji: "✍️" },
  { no: 7, href: "/story", label: "ストーリー結果", emoji: "📚" },
  { no: 8, href: "/image-design", label: "画像設計", emoji: "🎨" },
  { no: 9, href: "/risk-check", label: "生成前リスクチェック", emoji: "⚠️" },
  { no: 10, href: "/image-fix", label: "画像修正ボタン", emoji: "🔧" },
  { no: 11, href: "/output", label: "店内アート・ハガキ", emoji: "🖼️" },
  { no: 12, href: "/works", label: "保存作品一覧", emoji: "🗂️" },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item, i) =>
        "group" in item ? (
          <div
            key={`g-${i}`}
            className="mt-3 px-3 text-[11px] font-bold uppercase tracking-wider text-ink/40"
          >
            {item.group}
          </div>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
              isActive(item.href)
                ? "bg-terracotta text-white shadow-soft"
                : "text-ink/80 hover:bg-amber-100/70"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                isActive(item.href)
                  ? "bg-white/25 text-white"
                  : "bg-amber-100 text-ink/60"
              }`}
            >
              {item.no}
            </span>
            <span className="text-base leading-none">{item.emoji}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ),
      )}
    </nav>
  );
}

function Brandmark() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="text-2xl">🎨</span>
      <span className="leading-tight">
        <span className="block text-sm font-extrabold text-ink">
          お店の物語アートメーカー
        </span>
        <span className="block text-[11px] text-ink/50">
          つるるんとん デモ版
        </span>
      </span>
    </Link>
  );
}

function ResetButton() {
  const { resetAll } = useStore();
  return (
    <button
      type="button"
      onClick={() => {
        if (
          confirm(
            "保存データを消して、初期状態（くま君サンプル）に戻します。よろしいですか？",
          )
        ) {
          resetAll();
        }
      }}
      className="btn btn-ghost w-full justify-start text-xs"
    >
      🔄 初期状態に戻す
    </button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      {/* デスクトップ：固定サイドバー */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-amber-100 bg-paper/70 p-4 backdrop-blur-sm lg:flex">
        <div className="px-2 pb-3">
          <Brandmark />
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          <NavList />
        </div>
        <div className="border-t border-amber-100 pt-2">
          <ResetButton />
          <p className="px-3 pt-1 text-[10px] leading-relaxed text-ink/40">
            データはこの端末に保存（localStorage）。画像生成APIは未接続のデモです。
          </p>
        </div>
      </aside>

      {/* モバイル：上部バー */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-amber-100 bg-paper/80 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Brandmark />
        <button
          type="button"
          aria-label="メニュー"
          onClick={() => setOpen(true)}
          className="btn btn-soft px-3 py-2"
        >
          ☰
        </button>
      </header>

      {/* モバイル：ドロワー */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-paper p-4 shadow-xl">
            <div className="flex items-center justify-between px-2 pb-3">
              <Brandmark />
              <button
                type="button"
                aria-label="閉じる"
                onClick={() => setOpen(false)}
                className="btn btn-ghost px-2"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-amber-100 pt-2">
              <ResetButton />
            </div>
          </div>
        </div>
      )}

      {/* 本文 */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-10">
        {children}
      </main>
    </div>
  );
}
