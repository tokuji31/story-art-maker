// =========================================================================
// 画像プロンプト設計 ＋ 生成前リスクチェック ＋ 画像生成API差し替え口
//
// ★ 差し替えポイント ★
//   generateImage() が画像生成APIの唯一の窓口。
//   第一弾は IMAGE_API_ENABLED=false で必ず null（プレースホルダー表示）。
//   将来 Nano Banana Pro 等をつなぐときは、この関数の中身だけ実装すればよい。
// =========================================================================

import { genId } from "./id";
import {
  BackgroundPlate,
  BrandLedger,
  Difficulty,
  ImageDesignItem,
  ImageKind,
  SafeTemplate,
  StoryResult,
} from "./types";

export const IMAGE_API_ENABLED = false;

// 背景プレート → 安全構図テンプレートの対応
export const SCENE_TO_TEMPLATE: Record<string, string> = {
  "bg-shave": "tpl-shave",
  "bg-shampoo": "tpl-shampoo",
  "bg-mirror": "tpl-mirror",
  "bg-spa": "tpl-spa",
  "bg-rona": "tpl-rona",
};

// 画像種別ごとの出力サイズ
export const SIZE_BY_KIND: Record<ImageKind, string> = {
  keyvisual: "1920 × 1080 px（横・キービジュアル）",
  cover: "1200 × 1600 px（縦・表紙）",
  instore: "A4縦 2480 × 3508 px（300dpi）",
  "postcard-v": "100 × 148mm 縦 ＝ 1181 × 1748 px",
  "postcard-h": "148 × 100mm 横 ＝ 1748 × 1181 px",
  page: "1456 × 816 px（横・挿絵）",
};

const STYLE_TAG =
  "やさしい絵本タッチ、あたたかい水彩、メンズ理容室、落ち着いた個室、ぬくもりのある光";

// ---- 生成前リスクチェック ---------------------------------------------

export function riskCheck(
  bg: BackgroundPlate | undefined,
  tpl: SafeTemplate | undefined,
): string[] {
  const risks: string[] = [];
  if (!bg) {
    risks.push("背景プレートが未設定です。背景は固定プレートから選んでください。");
    return risks;
  }
  if (bg.hasMirror) {
    risks.push(
      "このシーンは鏡の反射があるため、人物の不一致（鏡像と本人の顔ちがい）が起きやすいです。",
    );
  }
  if (bg.scene.includes("顔剃り") || bg.id === "bg-shave") {
    risks.push(
      "顔剃りの手元アップは、手やカミソリの角度が崩れやすいです。手元は控えめ・抽象的に。",
    );
  }
  if (bg.id === "bg-shampoo") {
    risks.push(
      "シャンプー椅子は、椅子の向きと体の角度がずれやすいです。首は無理のない角度に。",
    );
  }
  risks.push("背景にない家具・小物を追加しないよう注意してください。");
  if (bg.difficulty === "high") {
    risks.push("高難度シーンです。安全構図テンプレートの適用を強くおすすめします。");
  }
  if (!tpl && bg.difficulty !== "low") {
    risks.push("安全構図テンプレートが未適用です。失敗を減らすため適用を検討してください。");
  }
  if (bg.forbiddenProps.length > 0) {
    risks.push(`追加禁止物：${bg.forbiddenProps.join("、")}`);
  }
  return risks;
}

// ---- 画像プロンプト本文の組み立て -------------------------------------

interface BuildArgs {
  kind: ImageKind;
  label: string;
  brand: BrandLedger;
  bg?: BackgroundPlate;
  tpl?: SafeTemplate;
  sceneNote?: string; // ストーリーのページ画像シーン案など
  charactersNote?: string; // 登場キャラ
  textNote?: string; // 画像内テキスト（タイトル等）
}

export function buildImagePrompt(args: BuildArgs): ImageDesignItem {
  const { kind, label, brand, bg, tpl, sceneNote, charactersNote, textNote } =
    args;

  const lines: string[] = [];
  lines.push(`【スタイル】${STYLE_TAG}`);
  lines.push(`【お店】${brand.store.name}（${brand.store.atmosphere}）`);
  if (sceneNote) lines.push(`【シーン】${sceneNote}`);
  if (charactersNote) lines.push(`【登場】${charactersNote}`);

  if (bg) {
    lines.push(
      `【背景：固定プレート】「${bg.name}」/ 使用シーン:${bg.scene} / 椅子:${bg.chairDirection} / 鏡:${bg.hasMirror ? "あり" : "なし"}`,
    );
    lines.push(`　→ 背景はこのプレートに固定し、自由生成しない。`);
    if (bg.allowedProps.length)
      lines.push(`【追加してよい小物】${bg.allowedProps.join("、")}`);
  }

  const composition =
    tpl?.recommendedComposition ??
    bg?.allowedCompositions[0] ??
    "人物の安心した表情を中心に、やわらかい構図で。";
  lines.push(`【推奨構図】${composition}`);

  if (tpl) {
    lines.push(`【安全構図ルール】${tpl.rules.join(" / ")}`);
  }
  if (textNote) {
    lines.push(`【画像内テキスト】${textNote}`);
  }

  // ネガティブ（やってはいけない）
  const neg: string[] = [];
  if (bg) {
    neg.push(...bg.forbiddenCompositions, ...bg.forbiddenProps);
  }
  neg.push("背景にない家具", "刃物の強調", "誇張した表情", "実在ロゴ");
  lines.push(`【Negative（描かない）】${Array.from(new Set(neg)).join("、")}`);

  const difficulty: Difficulty = bg?.difficulty ?? "low";

  return {
    id: genId("img"),
    kind,
    label,
    backgroundPlateId: bg?.id,
    safeTemplateId: tpl?.id,
    difficulty,
    prompt: lines.join("\n"),
    composition,
    size: SIZE_BY_KIND[kind],
    risks: riskCheck(bg, tpl),
    imageUrl: null,
    verdict: null,
    fixNotes: [],
  };
}

// ---- ストーリーから画像設計一式を生成 ---------------------------------

export function buildDesignsForStory(
  story: StoryResult,
  brand: BrandLedger,
  backgrounds: BackgroundPlate[],
  templates: SafeTemplate[],
): ImageDesignItem[] {
  const bgById = (id?: string) => backgrounds.find((b) => b.id === id);
  const tplFor = (bgId?: string) =>
    templates.find((t) => t.id === (bgId ? SCENE_TO_TEMPLATE[bgId] : ""));

  const charNames = brand.characters.map((c) => c.name).join("・");
  const designs: ImageDesignItem[] = [];

  // キービジュアル（お店の世界観・ヘッドスパの安らぎ）
  designs.push(
    buildImagePrompt({
      kind: "keyvisual",
      label: "キービジュアル案",
      brand,
      bg: bgById("bg-spa"),
      tpl: tplFor("bg-spa"),
      sceneNote: `『${story.title}』の世界観。${story.input.mood}な空気。`,
      charactersNote: charNames,
    }),
  );

  // 表紙
  designs.push(
    buildImagePrompt({
      kind: "cover",
      label: "表紙画像案",
      brand,
      bg: bgById("bg-iriguchi"),
      sceneNote: `表紙。${story.input.guestName}が主役。`,
      charactersNote: `${story.input.guestName}・つる君・るんちゃん`,
      textNote: `タイトル「${story.title}」`,
    }),
  );

  // 店内アート
  designs.push(
    buildImagePrompt({
      kind: "instore",
      label: "店内アート案",
      brand,
      bg: bgById("bg-mirror"),
      tpl: tplFor("bg-mirror"),
      sceneNote: "店内に飾る、落ち着いた1枚。",
      charactersNote: charNames,
    }),
  );

  // ハガキ縦・横
  designs.push(
    buildImagePrompt({
      kind: "postcard-v",
      label: "ハガキ縦案",
      brand,
      bg: bgById("bg-rona"),
      tpl: tplFor("bg-rona"),
      sceneNote: "ハガキ縦。帰り際の余韻。",
      charactersNote: story.input.useRona ? "ロナ" : "—",
      textNote: story.postcardLine,
    }),
  );
  designs.push(
    buildImagePrompt({
      kind: "postcard-h",
      label: "ハガキ横案",
      brand,
      bg: bgById("bg-gaikan"),
      sceneNote: "ハガキ横。お店の外観とやわらかい光。",
      textNote: story.postcardLine,
    }),
  );

  // ページ挿絵（各ページ）
  story.pages.forEach((p) => {
    designs.push(
      buildImagePrompt({
        kind: "page",
        label: `ページ${p.index} 挿絵案`,
        brand,
        bg: bgById(p.backgroundPlateId),
        tpl: tplFor(p.backgroundPlateId),
        sceneNote: p.imageScene,
        charactersNote: charNames,
      }),
    );
  });

  return designs;
}

// ---- 画像生成API（差し替え口・第一弾は必ず null） ----------------------

export async function generateImage(_prompt: string): Promise<string | null> {
  if (!IMAGE_API_ENABLED) {
    // 第一弾：APIキー未接続。プレースホルダー運用。
    return null;
  }
  // 将来ここに Nano Banana Pro などの呼び出しを実装：
  //   const res = await fetch("/api/generate-image", {
  //     method: "POST",
  //     body: JSON.stringify({ prompt: _prompt }),
  //   });
  //   const { url } = await res.json();
  //   return url;
  return null;
}
