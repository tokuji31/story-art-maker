"use client";

// =========================================================================
// アプリ状態ストア（localStorage 永続化）
// 第一弾はログイン不要・単一店舗。販売版では店舗ごとに名前空間を分ければよい。
// =========================================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { generateStory } from "./generate";
import { compressDataUrl } from "./image-upload";
import { buildDesignsForStory } from "./imagePrompt";
import {
  SAMPLE_STORY,
  SEED_BACKGROUNDS,
  SEED_BRAND,
  SEED_TEMPLATES,
  SEED_TEXT_DESIGN,
  TEXT_MODE_PRESETS,
} from "./seed";
import {
  BackgroundPlate,
  BrandLedger,
  Character,
  CharacterReferenceImages,
  ImageDesignItem,
  OutputPlan,
  SafeTemplate,
  StoryInput,
  StoryResult,
  TextDesign,
  TextMode,
} from "./types";

const STORAGE_KEY = "story-art-maker:v1";

interface AppSettings {
  anthropicApiKey: string;
  aiModel: string;
}

interface AppState {
  brand: BrandLedger;
  textDesign: TextDesign;
  backgrounds: BackgroundPlate[];
  templates: SafeTemplate[];
  stories: StoryResult[];
  currentStoryId: string | null;
  settings: AppSettings;
}

function seedState(): AppState {
  return {
    brand: SEED_BRAND,
    textDesign: SEED_TEXT_DESIGN,
    backgrounds: SEED_BACKGROUNDS,
    templates: SEED_TEMPLATES,
    stories: [],
    currentStoryId: null,
    settings: { anthropicApiKey: "", aiModel: "claude-opus-4-8" },
  };
}

interface StoreValue extends AppState {
  hydrated: boolean;
  // ブランド台帳
  setBrand: (b: BrandLedger) => void;
  // 文字数設計
  setTextDesign: (t: TextDesign) => void;
  applyTextMode: (mode: TextMode) => void;
  // 背景プレート
  updateBackground: (id: string, patch: Partial<BackgroundPlate>) => void;
  // 設定（BYOK）
  setSettings: (patch: Partial<AppSettings>) => void;
  // ストーリー
  createStory: (input: StoryInput) => StoryResult;
  addStory: (story: StoryResult) => void;
  updateStory: (id: string, patch: Partial<StoryResult>) => void;
  saveStory: (id: string) => void;
  removeStory: (id: string) => void;
  setCurrentStory: (id: string | null) => void;
  getStory: (id: string | null | undefined) => StoryResult | undefined;
  // 画像設計
  buildDesigns: (storyId: string) => void;
  updateDesign: (
    storyId: string,
    designId: string,
    patch: Partial<ImageDesignItem>,
  ) => void;
  // 出力
  addOutput: (storyId: string, output: OutputPlan) => void;
  removeOutput: (storyId: string, outputId: string) => void;
  // 画像の一括再圧縮（localStorage 逼迫時の救済）
  recompressAllImages: () => Promise<{
    before: number; // 圧縮前の JSON サイズ（バイト概算）
    after: number; // 圧縮後の JSON サイズ
    count: number; // 再圧縮した画像枚数
  }>;
  // 全消去・初期化
  resetAll: () => void;
}

// 参照画像（4方向）の圧縮プリセット — 50〜80KB/枚を目安
const REF_MAX_DIM = 512;
const REF_QUALITY = 0.65;
// 完成画像（imageDesigns / backgrounds）の圧縮プリセット — 200〜300KB/枚
const ART_MAX_DIM = 1100;
const ART_QUALITY = 0.8;

// 4方向画像をまとめて再圧縮するヘルパ
async function recompressRefImages(
  ri: CharacterReferenceImages | undefined,
): Promise<{ next: CharacterReferenceImages; count: number }> {
  if (!ri) return { next: {}, count: 0 };
  const next: CharacterReferenceImages = {};
  let count = 0;
  for (const dir of ["front", "right", "left", "back"] as const) {
    const url = ri[dir];
    if (url) {
      next[dir] = await compressDataUrl(url, REF_MAX_DIM, REF_QUALITY);
      count++;
    }
  }
  return { next, count };
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(seedState);
  const [hydrated, setHydrated] = useState(false);
  const didInit = useRef(false);
  const quotaWarned = useRef(false);
  // 最新 state を同期的に参照するための ref（createStory が結果を返すため）
  const stateRef = useRef(state);
  stateRef.current = state;

  // 起動時：localStorage から復元。無ければサンプルを生成して投入。
  // StrictMode の二重実行を ref で防ぐ。
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppState>;
        const base = seedState();
        setState({
          brand: parsed.brand ?? base.brand,
          textDesign: parsed.textDesign ?? base.textDesign,
          backgrounds: parsed.backgrounds ?? base.backgrounds,
          templates: parsed.templates ?? base.templates,
          stories: parsed.stories ?? base.stories,
          currentStoryId: parsed.currentStoryId ?? null,
          settings: { ...base.settings, ...(parsed.settings ?? {}) },
        });
      } else {
        // 初回：完成見本「荷物の、半分こ」（全文）を保存済みとして投入
        const base = seedState();
        const sample: StoryResult = {
          ...SAMPLE_STORY,
          imageDesigns: buildDesignsForStory(
            SAMPLE_STORY,
            base.brand,
            base.backgrounds,
            base.templates,
          ),
        };
        setState({ ...base, stories: [sample], currentStoryId: sample.id });
      }
    } catch {
      // 壊れていたらシードに戻す
      setState(seedState());
    } finally {
      setHydrated(true);
    }
  }, []);

  // 変更を永続化（ハイドレート完了後のみ）
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      quotaWarned.current = false;
    } catch {
      // 多くは画像の貼りすぎによる容量超過。一度だけ知らせる。
      if (!quotaWarned.current && typeof window !== "undefined") {
        quotaWarned.current = true;
        window.alert(
          "保存容量がいっぱいです。貼り付けた画像を減らす／削除すると保存できます（このデモは画像数枚向けです）。",
        );
      }
    }
  }, [state, hydrated]);

  // ---- アクション ----
  const setBrand = useCallback(
    (brand: BrandLedger) => setState((s) => ({ ...s, brand })),
    [],
  );

  const setTextDesign = useCallback(
    (textDesign: TextDesign) => setState((s) => ({ ...s, textDesign })),
    [],
  );

  const applyTextMode = useCallback((mode: TextMode) => {
    setState((s) => ({
      ...s,
      textDesign: { mode, ...TEXT_MODE_PRESETS[mode] },
    }));
  }, []);

  const updateBackground = useCallback(
    (id: string, patch: Partial<BackgroundPlate>) =>
      setState((s) => ({
        ...s,
        backgrounds: s.backgrounds.map((b) =>
          b.id === id ? { ...b, ...patch } : b,
        ),
      })),
    [],
  );

  const setSettings = useCallback(
    (patch: Partial<AppSettings>) =>
      setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    [],
  );

  const addStory = useCallback((story: StoryResult) => {
    setState((prev) => ({
      ...prev,
      stories: [story, ...prev.stories],
      currentStoryId: story.id,
    }));
  }, []);

  const createStory = useCallback((input: StoryInput): StoryResult => {
    const s = stateRef.current;
    const td = s.textDesign;
    const story = generateStory(input, s.brand, td.pages, td.charsPerPage, {
      postcardLineChars: td.postcardLineChars,
      snsShortChars: td.snsShortChars,
      blogIntroChars: td.blogIntroChars,
    });
    setState((prev) => ({
      ...prev,
      stories: [story, ...prev.stories],
      currentStoryId: story.id,
    }));
    return story;
  }, []);

  const updateStory = useCallback(
    (id: string, patch: Partial<StoryResult>) =>
      setState((s) => ({
        ...s,
        stories: s.stories.map((st) => (st.id === id ? { ...st, ...patch } : st)),
      })),
    [],
  );

  const saveStory = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        stories: s.stories.map((st) =>
          st.id === id ? { ...st, status: "saved" } : st,
        ),
      })),
    [],
  );

  const removeStory = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        stories: s.stories.filter((st) => st.id !== id),
        currentStoryId: s.currentStoryId === id ? null : s.currentStoryId,
      })),
    [],
  );

  const setCurrentStory = useCallback(
    (id: string | null) => setState((s) => ({ ...s, currentStoryId: id })),
    [],
  );

  const getStory = useCallback(
    (id: string | null | undefined) =>
      id ? state.stories.find((s) => s.id === id) : undefined,
    [state.stories],
  );

  const buildDesigns = useCallback((storyId: string) => {
    setState((s) => {
      const story = s.stories.find((st) => st.id === storyId);
      if (!story) return s;
      const designs = buildDesignsForStory(
        story,
        s.brand,
        s.backgrounds,
        s.templates,
      );
      return {
        ...s,
        stories: s.stories.map((st) =>
          st.id === storyId ? { ...st, imageDesigns: designs } : st,
        ),
      };
    });
  }, []);

  const updateDesign = useCallback(
    (storyId: string, designId: string, patch: Partial<ImageDesignItem>) =>
      setState((s) => ({
        ...s,
        stories: s.stories.map((st) =>
          st.id === storyId
            ? {
                ...st,
                imageDesigns: st.imageDesigns.map((d) =>
                  d.id === designId ? { ...d, ...patch } : d,
                ),
              }
            : st,
        ),
      })),
    [],
  );

  const addOutput = useCallback(
    (storyId: string, output: OutputPlan) =>
      setState((s) => ({
        ...s,
        stories: s.stories.map((st) =>
          st.id === storyId
            ? { ...st, outputs: [...st.outputs, output] }
            : st,
        ),
      })),
    [],
  );

  const removeOutput = useCallback(
    (storyId: string, outputId: string) =>
      setState((s) => ({
        ...s,
        stories: s.stories.map((st) =>
          st.id === storyId
            ? { ...st, outputs: st.outputs.filter((o) => o.id !== outputId) }
            : st,
        ),
      })),
    [],
  );

  // すべての保存済み画像を再圧縮して localStorage を軽くする
  const recompressAllImages = useCallback(async () => {
    const s = stateRef.current;
    const beforeSize = JSON.stringify(s).length;

    let count = 0;

    // 固定キャラの参照画像
    const newCharacters: Character[] = [];
    for (const c of s.brand.characters) {
      const r = await recompressRefImages(c.referenceImages);
      count += r.count;
      newCharacters.push({ ...c, referenceImages: r.next });
    }

    // ストーリーごとの guestReferenceImages + 完成画像
    const newStories: StoryResult[] = [];
    for (const st of s.stories) {
      const gri = st.guestReferenceImages;
      const beforePhase = await recompressRefImages(gri?.before);
      const afterPhase = await recompressRefImages(gri?.after);
      count += beforePhase.count + afterPhase.count;

      const newDesigns: ImageDesignItem[] = [];
      for (const d of st.imageDesigns) {
        if (d.imageUrl) {
          const compressed = await compressDataUrl(
            d.imageUrl,
            ART_MAX_DIM,
            ART_QUALITY,
          );
          count++;
          newDesigns.push({ ...d, imageUrl: compressed });
        } else {
          newDesigns.push(d);
        }
      }

      newStories.push({
        ...st,
        guestReferenceImages: {
          before: beforePhase.next,
          after: afterPhase.next,
        },
        imageDesigns: newDesigns,
      });
    }

    // 背景プレートの完成画像
    const newBackgrounds: BackgroundPlate[] = [];
    for (const b of s.backgrounds) {
      if (b.imageUrl) {
        const compressed = await compressDataUrl(
          b.imageUrl,
          ART_MAX_DIM,
          ART_QUALITY,
        );
        count++;
        newBackgrounds.push({ ...b, imageUrl: compressed });
      } else {
        newBackgrounds.push(b);
      }
    }

    const nextState: AppState = {
      ...s,
      brand: { ...s.brand, characters: newCharacters },
      stories: newStories,
      backgrounds: newBackgrounds,
    };
    setState(nextState);

    const afterSize = JSON.stringify(nextState).length;
    // base64 1文字 ≒ 0.75 バイト想定で概算
    return {
      before: Math.floor(beforeSize * 0.75),
      after: Math.floor(afterSize * 0.75),
      count,
    };
  }, []);

  const resetAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    const base = seedState();
    const sample: StoryResult = {
      ...SAMPLE_STORY,
      imageDesigns: buildDesignsForStory(
        SAMPLE_STORY,
        base.brand,
        base.backgrounds,
        base.templates,
      ),
    };
    setState({ ...base, stories: [sample], currentStoryId: sample.id });
  }, []);

  const value: StoreValue = {
    ...state,
    hydrated,
    setBrand,
    setTextDesign,
    applyTextMode,
    updateBackground,
    setSettings,
    createStory,
    addStory,
    updateStory,
    saveStory,
    removeStory,
    setCurrentStory,
    getStory,
    buildDesigns,
    updateDesign,
    addOutput,
    removeOutput,
    recompressAllImages,
    resetAll,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore は StoreProvider の中で使ってください");
  return ctx;
}
