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
  // 全消去・初期化
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(seedState);
  const [hydrated, setHydrated] = useState(false);
  const didInit = useRef(false);
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
    } catch {
      /* 容量超過などは無視 */
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
    resetAll,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore は StoreProvider の中で使ってください");
  return ctx;
}
