// =========================================================================
// BYOK AIライター（自分のAPIキーで“本格生成”）
//
// 運営にAI課金を発生させないため、ユーザー自身のAnthropic APIキーを使い、
// ブラウザから直接 Anthropic API を呼ぶ（鍵はこの端末のlocalStorageのみ）。
//
// ★ generateStory() と同じ StoryResult を返すので、画面側はそのまま使える。
// =========================================================================

import { charLen, genId } from "./id";
import { BrandLedger, StoryInput, StoryPage, StoryResult, TextDesign } from "./types";

export interface AiConfig {
  apiKey: string;
  model: string;
}

// 既定は最も高品質なモデル。コスト優先なら下位も選べる。
export const AI_MODELS: { id: string; label: string }[] = [
  { id: "claude-opus-4-8", label: "Opus 4.8（最高品質・おすすめ）" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6（バランス）" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5（低コスト・速い）" },
];

export const DEFAULT_AI_MODEL = "claude-opus-4-8";

// serviceStep（工程名）→ 背景プレートID
const STEP_TO_BG: Record<string, string> = {
  来店: "bg-iriguchi",
  カット: "bg-cut-angle",
  お顔剃り: "bg-shave",
  お顔の毛穴洗浄: "bg-pore",
  極みヘッドスパ: "bg-spa",
  鏡を見る: "bg-mirror",
  帰り際: "bg-rona",
  余韻: "bg-spa",
};

const WARNING_WORDS_INLINE =
  "治る・完治・必ず改善・絶対・若返る・シミが消える・小顔になる・一回で劇的改善・日本一・地域No.1・永久保証";

function buildPrompt(
  input: StoryInput,
  brand: BrandLedger,
  td: TextDesign,
): { system: string; user: string } {
  const emphasized =
    brand.menu.steps.find((s) => s.id === input.emphasizedStepId)?.name ??
    "極みヘッドスパ";

  const system = [
    "あなたは、つるるんとん（美肌理容室）の世界観で『1話完結の絵本』を書く、プロの絵本作家です。",
    "次のルールを必ず守ってください。",
    "【作り】会話を主役に（語りは最小限）。施術が進むほど本音が少しずつ出る“段階的な告白”。終盤で第三者や本人の一言で価値が裏返る“反転”を必ず作る。比喩のタイトルと、最後に締めの比喩一文を入れる。",
    "【技法】静寂（例：ハサミの音だけが響く）、五感（ふわふわの泡・蒸しタオル）、反復（チョキ、チョキ）、ロナの仕草で空気をやわらげる、を自然に織り込む。",
    "【工程】美肌極みの工程（カット→お顔剃り→お顔の毛穴洗浄→極みヘッドスパ→鏡を見る→帰り際）に沿って心が変化する。",
    `【長さ】各ページ本文は会話を含めしっかりした長さに（目安：1ページ ${td.charsPerPage} 字前後、全 ${td.pages} ページ）。短くしすぎない。`,
    "【言葉】専門用語を使わず、やさしい日本語で。小学生にも伝わるように。",
    `【禁止表現】次の誇大・断定表現は使わない：${WARNING_WORDS_INLINE}。`,
    "【出力】次のJSONだけを返してください。前置き・説明・マークダウンの```囲みは一切不要です。",
    "JSONの形：",
    "{",
    '  "title": "比喩のタイトル",',
    '  "synopsis": "あらすじ（2〜3文）",',
    '  "pages": [ { "text": "本文（改行は\\nで表す）", "emotion": "そのページの感情", "serviceStep": "来店/カット/お顔剃り/お顔の毛穴洗浄/極みヘッドスパ/鏡を見る/帰り際/余韻 のいずれか", "imageScene": "画像にする場面の短い説明" } ],',
    '  "finalRealization": "最後の気づき",',
    '  "postcardLine": "ハガキ用の一文",',
    '  "snsShort": "SNS用の短文",',
    '  "blogIntro": "ブログ用の導入文"',
    "}",
  ].join("\n");

  const steps = brand.menu.steps
    .map((s) => `${s.name}（${s.meaning}）`)
    .join("、");

  const user = [
    `【お店】${brand.store.name}（${brand.store.atmosphere}／${brand.store.tagline}）`,
    "【キャラ】つる君＝技術で整える人（落ち着いた職人） / るんちゃん＝心をほどく人（やさしく本音を引き出す） / ロナ＝言葉なしで癒す犬",
    `【看板メニュー】${brand.menu.name}：工程と心の変化＝${steps}`,
    "",
    "【今回のお客様】",
    `ゲスト：${input.guestName}（${input.guestType}）`,
    `見た目：${input.appearance}`,
    `性格：${input.personality}`,
    `表向きの態度：${input.outerAttitude}`,
    `本当の悩み：${input.realWorry}`,
    `愚痴：${input.complaint}`,
    `コンプレックス：${input.complex}`,
    `来店理由：${input.visitReason}`,
    `最後に気づいてほしいこと：${input.finalRealization}`,
    `ロナを出す：${input.useRona ? "はい（最後にそっと登場）" : "いいえ"}`,
    `特に強める工程：${emphasized}`,
    `物語の雰囲気：${input.mood}`,
    "",
    `この設定で、上のルールに従って1話（全 ${td.pages} ページ）を書いてください。JSONだけを返してください。`,
  ].join("\n");

  return { system, user };
}

function extractJson(text: string): any | null {
  if (!text) return null;
  let t = text.trim();
  // ```json ... ``` の囲みを除去
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return null;
  }
}

function toStoryResult(
  p: any,
  input: StoryInput,
  _brand: BrandLedger,
): StoryResult {
  const rawPages: any[] = Array.isArray(p.pages) ? p.pages : [];
  const pages: StoryPage[] = rawPages.map((pg, i) => {
    const text = String(pg?.text ?? "");
    const step = String(pg?.serviceStep ?? "—");
    return {
      index: i + 1,
      text,
      charCount: charLen(text),
      emotion: String(pg?.emotion ?? ""),
      serviceStep: step,
      imageScene: String(pg?.imageScene ?? ""),
      backgroundPlateId: STEP_TO_BG[step] ?? "bg-cut-front",
    };
  });
  const usedSteps = Array.from(
    new Set(pages.map((pg) => pg.serviceStep).filter((s) => s && s !== "—")),
  );

  return {
    id: genId("story"),
    createdAt: new Date().toISOString(),
    status: "draft",
    source: "ai",
    input,
    title: String(p.title ?? "無題"),
    synopsis: String(p.synopsis ?? ""),
    pages,
    emotionFlow: pages.map((pg) => pg.emotion),
    usedSteps,
    finalRealization: String(p.finalRealization ?? input.finalRealization ?? ""),
    postcardLine: String(p.postcardLine ?? ""),
    snsShort: String(p.snsShort ?? ""),
    blogIntro: String(p.blogIntro ?? ""),
    imageDesigns: [],
    outputs: [],
    adoptedCompositions: [],
    rejectedNotes: [],
  };
}

export async function aiGenerateStory(
  input: StoryInput,
  brand: BrandLedger,
  td: TextDesign,
  config: AiConfig,
): Promise<StoryResult> {
  if (!config.apiKey?.trim()) {
    throw new Error("APIキーが未入力です。設定からキーを入れてください。");
  }
  const { system, user } = buildPrompt(input, brand, td);

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.apiKey.trim(),
        "anthropic-version": "2023-06-01",
        // ブラウザから直接呼ぶための許可ヘッダー（BYOK用途）
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: config.model || DEFAULT_AI_MODEL,
        max_tokens: 8000,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
  } catch {
    throw new Error(
      "AIに接続できませんでした。通信環境をご確認のうえ、もう一度お試しください。",
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message ? `：${body.error.message}` : "";
    } catch {
      /* ignore */
    }
    if (res.status === 401)
      throw new Error("APIキーが正しくないようです。キーをもう一度ご確認ください。");
    if (res.status === 400)
      throw new Error(`リクエストに問題がありました（モデル名やキーをご確認ください）${detail}`);
    if (res.status === 429)
      throw new Error("リクエストが立て込んでいます。少し待ってから再度お試しください。");
    throw new Error(`AIエラー（${res.status}）${detail}`);
  }

  const data = await res.json();
  if (data?.stop_reason === "refusal") {
    throw new Error(
      "AIがこの内容の生成を見送りました。入力の表現をやわらげて、もう一度お試しください。",
    );
  }
  const text: string = Array.isArray(data?.content)
    ? data.content
        .filter((b: any) => b?.type === "text")
        .map((b: any) => b.text)
        .join("")
    : "";

  const parsed = extractJson(text);
  if (!parsed || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
    throw new Error(
      "AIの回答をうまく読み取れませんでした。もう一度お試しください（長すぎる場合は『文字数・余白設計』でページ数を少し減らすと安定します）。",
    );
  }
  return toStoryResult(parsed, input, brand);
}
