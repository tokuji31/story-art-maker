"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { suggestGuest } from "@/lib/generate";
import { SAMPLE_STORY_INPUT } from "@/lib/seed";
import { PageHeader, Toggle } from "@/components/ui";
import { StoryInput, TEXT_MODE_LABEL, TextMode } from "@/lib/types";

const MOOD_OPTIONS = [
  "静かに前向き",
  "あたたかい",
  "少し笑える",
  "しっとり優しい",
  "元気が出る",
];

function emptyInput(mode: TextMode, firstStep: string): StoryInput {
  return {
    guestName: "",
    guestType: "",
    appearance: "",
    personality: "",
    outerAttitude: "",
    realWorry: "",
    complaint: "",
    complex: "",
    visitReason: "",
    finalRealization: "",
    useRona: true,
    emphasizedStepId: firstStep,
    mood: "静かに前向き",
    textMode: mode,
  };
}

export default function CreatePage() {
  const { brand, textDesign, createStory, hydrated } = useStore();
  const router = useRouter();
  const firstStep = brand.menu.steps[0]?.id ?? "cut";
  const [input, setInput] = useState<StoryInput>(
    emptyInput(textDesign.mode, firstStep),
  );
  const [worrySeed, setWorrySeed] = useState("");

  if (!hydrated) {
    return <div className="py-20 text-center text-ink/40">読み込み中…</div>;
  }

  const set = (patch: Partial<StoryInput>) => setInput({ ...input, ...patch });

  const onSuggest = () => {
    const seed = worrySeed || input.realWorry;
    const g = suggestGuest(seed);
    set({
      guestName: g.guestName,
      guestType: g.guestType,
      appearance: g.appearance,
      personality: g.personality,
      outerAttitude: g.outerAttitude,
      realWorry: input.realWorry || seed,
    });
  };

  const onGenerate = () => {
    createStory(input); // currentStory も自動でこの作品になる
    router.push("/story");
  };

  const text = (
    key: keyof StoryInput,
    label: string,
    placeholder = "",
    long = false,
  ) => (
    <div>
      <label className="label">{label}</label>
      {long ? (
        <textarea
          className="textarea min-h-[64px]"
          placeholder={placeholder}
          value={input[key] as string}
          onChange={(e) => set({ [key]: e.target.value } as Partial<StoryInput>)}
        />
      ) : (
        <input
          className="input"
          placeholder={placeholder}
          value={input[key] as string}
          onChange={(e) => set({ [key]: e.target.value } as Partial<StoryInput>)}
        />
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        no={6}
        emoji="✍️"
        title="1話を作成する"
        desc="今回のゲストと悩みを入力して、1話完結のストーリーを生成します。文字数は「文字数・余白設計」の設定に従います。"
      />

      {/* ゲスト提案 */}
      <section className="card mb-4 bg-amber-50/60">
        <h2 className="section-title mb-2">💡 ゲストを提案してもらう</h2>
        <p className="mb-2 text-sm text-ink/60">
          悩みを書いて押すと、メタファーのキャラを提案します。
          例：「家族にも職場にも弱音を吐けない男性」→「大きな荷物を背負ったくま君」
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="input"
            placeholder="例：家族にも職場にも弱音を吐けない"
            value={worrySeed}
            onChange={(e) => setWorrySeed(e.target.value)}
          />
          <button className="btn btn-primary shrink-0" onClick={onSuggest}>
            ✨ ゲストを提案
          </button>
        </div>
        <button
          className="btn btn-ghost mt-2 text-xs"
          onClick={() => {
            setInput({ ...SAMPLE_STORY_INPUT, textMode: textDesign.mode });
            setWorrySeed(SAMPLE_STORY_INPUT.realWorry);
          }}
        >
          🐻 くま君サンプルを入れる
        </button>
      </section>

      {/* ゲスト */}
      <section className="card mb-4">
        <h2 className="section-title mb-3">🎭 ゲスト</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {text("guestName", "ゲスト名", "例：大きな荷物を背負ったくま君")}
          {text("guestType", "ゲスト種別", "例：くま")}
          {text("appearance", "見た目", "例：大きな背中、少し疲れた目")}
          {text("personality", "性格", "例：がんばり屋、頼るのが苦手")}
          {text("outerAttitude", "表向きの態度", "例：「大丈夫」と笑ってしまう")}
        </div>
      </section>

      {/* 悩み */}
      <section className="card mb-4">
        <h2 className="section-title mb-3">💭 悩み・背景</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {text("realWorry", "本当の悩み", "例：弱音を吐けない", true)}
          {text("complaint", "愚痴", "例：鏡を見るのもおっくうで…", true)}
          {text("complex", "コンプレックス", "例：顔が疲れて見える")}
          {text("visitReason", "来店理由", "例：顔が疲れて見えるのが気になる")}
          {text(
            "finalRealization",
            "最後に気づいてほしいこと",
            "例：頼ることも優しさ",
          )}
        </div>
      </section>

      {/* 演出 */}
      <section className="card mb-4">
        <h2 className="section-title mb-3">🎬 演出</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">美肌極みのどの工程を強める？</label>
            <select
              className="select"
              value={input.emphasizedStepId}
              onChange={(e) => set({ emphasizedStepId: e.target.value })}
            >
              {brand.menu.steps.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">物語の雰囲気</label>
            <select
              className="select"
              value={input.mood}
              onChange={(e) => set({ mood: e.target.value })}
            >
              {MOOD_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">文字数モード</label>
            <select
              className="select"
              value={input.textMode}
              onChange={(e) => set({ textMode: e.target.value as TextMode })}
            >
              {(Object.keys(TEXT_MODE_LABEL) as TextMode[]).map((m) => (
                <option key={m} value={m}>
                  {TEXT_MODE_LABEL[m]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-ink/45">
              ※ 実際の長さは「文字数・余白設計」の保存値（{textDesign.pages}
              ページ / 1ページ{textDesign.charsPerPage}字）を使います。
            </p>
          </div>
          <div className="flex items-end">
            <div className="flex w-full items-center justify-between rounded-xl border border-amber-200 bg-white/70 px-3 py-2">
              <span className="text-sm font-semibold text-ink/80">
                🐶 ロナを出す
              </span>
              <Toggle
                checked={input.useRona}
                onChange={(v) => set({ useRona: v })}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-2xl border border-amber-100 bg-white/90 p-3 shadow-soft backdrop-blur">
        <span className="mr-auto text-xs text-ink/50">
          入力をもとにテンプレ生成します（AI API 未接続）
        </span>
        <button className="btn btn-primary" onClick={onGenerate}>
          📖 物語を生成する
        </button>
      </div>
    </div>
  );
}
