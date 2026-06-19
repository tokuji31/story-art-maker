// =========================================================================
// 物語生成エンジン（第一弾：テンプレート生成）
//
// ★ 差し替えポイント ★
//   generateStory() は「入力 → StoryResult」の純粋関数。
//   将来 AI API をつなぐときは、この関数の中身だけを
//   「プロンプト組み立て → fetch('/api/generate-story') → 整形」に
//   置き換えれば、画面側は一切変更不要。
// =========================================================================

import { charLen, genId } from "./id";
import {
  BrandLedger,
  StoryInput,
  StoryPage,
  StoryResult,
} from "./types";

interface BeatTemplate {
  stepId: string; // メニュー工程ID（arrive / pause は擬似）
  bgId: string; // 背景プレートID
  emotion: string; // 感情
  imageScene: string; // 画像シーン案
  full: (c: Ctx) => string;
  droppable: boolean; // 文字数モードで省略してよいか
}

interface Ctx {
  input: StoryInput;
  brand: BrandLedger;
  name: string;
  tsuru: string;
  run: string;
  rona: string;
}

const PSEUDO_STEP_NAME: Record<string, string> = {
  arrive: "来店",
  pause: "余韻",
};

function stepName(brand: BrandLedger, stepId: string): string {
  return (
    brand.menu.steps.find((s) => s.id === stepId)?.name ??
    PSEUDO_STEP_NAME[stepId] ??
    "—"
  );
}

// ---- 物語のビート（つるるんとんの工程に沿った王道アーク） ---------------

const BEATS: BeatTemplate[] = [
  {
    stepId: "arrive",
    bgId: "bg-iriguchi",
    emotion: "緊張と、ほんの少しの期待",
    imageScene: "入口でお出迎え。あたたかい光、ロナは出さずに2人で迎える構図。",
    droppable: false,
    full: (c) => {
      const parts = [`${c.name}は、お店のドアをそっと開けました。`];
      if (c.input.outerAttitude) parts.push(`${c.input.outerAttitude}。`);
      if (c.input.visitReason)
        parts.push(`でも、心の奥では——${c.input.visitReason}。`);
      parts.push(`${c.tsuru}と${c.run}は、あたたかく迎えます。`);
      return parts.join("");
    },
  },
  {
    stepId: "cut",
    bgId: "bg-cut-angle",
    emotion: "輪郭が整いはじめる安心感",
    imageScene: "カット椅子斜め。背後から、肩より上。安心した表情中心。",
    droppable: true,
    full: (c) =>
      `${c.tsuru}は、ていねいにハサミを動かします。チョキ、チョキ。少しずつ、${c.name}の輪郭が整っていきます。` +
      `鏡の中の自分が、さっきより少しだけ、すっきりして見えました。`,
  },
  {
    stepId: "shave",
    bgId: "bg-shave",
    emotion: "張りつめたものが、ほどける",
    imageScene: "顔剃り。安心した表情を中心に。手元・カミソリは控えめ・抽象的に。",
    droppable: true,
    full: (c) =>
      `あたたかい蒸しタオルが、ふわりと顔をつつみます。お顔剃りがすすむと、張りつめていた表情が、すこしずつほどけていきます。` +
      `「…最近、ちょっと疲れていて」。${c.name}の口から、小さな本音がこぼれました。${c.run}は、ただやさしくうなずきます。`,
  },
  {
    stepId: "pore",
    bgId: "bg-pore",
    emotion: "モヤモヤが流れていく",
    imageScene: "毛穴洗浄。流れる水のやわらかい表現。ほどけていく表情。",
    droppable: true,
    full: (c) =>
      `お顔の毛穴を、やさしく洗い流していきます。顔の汚れといっしょに、心の奥にたまっていたモヤモヤも、すっと流れていくようでした。` +
      (c.input.complaint
        ? `「${c.input.complaint}」。言えなかった愚痴が、ぽつりとこぼれます。`
        : `言えずにいた思いが、すこしずつほどけていきます。`),
  },
  {
    stepId: "spa",
    bgId: "bg-spa",
    emotion: "重さがほどけ、本音が出る",
    imageScene: "ヘッドスパ。頭がふわっと軽くなる抽象表現。やすらいだ表情。",
    droppable: false,
    full: (c) =>
      `極みヘッドスパが始まります。頭のおくにあった重さが、ふわっと軽くなっていきます。` +
      `${c.run}は、そっと声をかけます。「${c.input.realWorry || "ひとりで抱えてきたこと"}——ひとりで全部、背負わなくてもいいんですよ」。` +
      `${c.name}は、しずかに目を閉じました。`,
  },
  {
    stepId: "pause",
    bgId: "bg-spa",
    emotion: "気づきの余韻",
    imageScene: "静かな間。光の粒。肩の力がぬける抽象表現。",
    droppable: true,
    full: (c) =>
      `しばらく、ただ静かな時間が流れます。何も言わなくていい時間。` +
      `${c.name}は、はりつめていた肩の力が、すっと抜けていくのを感じました。`,
  },
  {
    stepId: "mirror",
    bgId: "bg-mirror",
    emotion: "整った自分を、まっすぐ見る",
    imageScene: "鏡前。本人の表情が主役。鏡はやわらかいボケで添える。",
    droppable: true,
    full: (c) =>
      `施術が終わり、鏡の前にすわります。映っているのは、さっきより少しやわらかい表情の自分。` +
      (c.input.complex
        ? `${c.input.complex}。そのことがずっと気がかりだったけれど、いまは不思議と、まっすぐ見られました。`
        : `気がかりだったことも、いまは不思議と、まっすぐ見られました。`),
  },
  {
    stepId: "leave",
    bgId: "bg-rona",
    emotion: "また明日も、少し頑張れそう",
    imageScene: "帰り際。ロナが足元にそっと寄りそう。やわらかい夕方の光。",
    droppable: false,
    full: (c) =>
      (c.input.useRona
        ? `帰りぎわ、${c.rona}がとことことやってきて、足元にちょこんと寄りそいました。${c.name}は、ふっと笑います。`
        : `帰りぎわ、${c.name}は、ふっと笑いました。`) +
      `『${c.input.finalRealization || "頼ってもいい"}』——そう気づけた気がしました。` +
      `「また明日も、少し頑張れそうだ」。${c.input.mood || "おだやか"}な気持ちで、ドアを開けて帰っていきました。`,
  },
];

// 文字数を目標に近づける（簡易）。文単位でトリム、短すぎれば一文だけ補う。
function fitText(text: string, target: number): string {
  const len = charLen(text);
  if (len <= Math.round(target * 1.5)) {
    if (len < Math.round(target * 0.5)) {
      return text + "やわらかい時間が、ゆっくりと流れていきました。";
    }
    return text;
  }
  const sentences = text.split("。").filter((s) => s.length > 0);
  let out = "";
  for (const s of sentences) {
    const cand = out + s + "。";
    if (charLen(cand) > Math.round(target * 1.3) && out) break;
    out = cand;
  }
  return out || text;
}

function pickByHash(seed: string, options: string[]): string {
  let sum = 0;
  for (const ch of seed) sum += ch.charCodeAt(0);
  return options[sum % options.length];
}

export function generateStory(
  input: StoryInput,
  brand: BrandLedger,
  pagesTarget: number,
  charsPerPage: number,
  extraLengths: {
    postcardLineChars: number;
    snsShortChars: number;
    blogIntroChars: number;
  },
): StoryResult {
  const ctx: Ctx = {
    input,
    brand,
    name: input.guestName.trim() || "ある男性",
    tsuru: brand.characters.find((c) => c.id === "tsuru")?.name ?? "つる君",
    run: brand.characters.find((c) => c.id === "run")?.name ?? "るんちゃん",
    rona: brand.characters.find((c) => c.id === "rona")?.name ?? "ロナ",
  };

  // --- ページ数に合わせてビートを選ぶ ---
  let beats = [...BEATS];
  // 強調工程は必ず残す
  const keepStep = input.emphasizedStepId;

  // 多すぎる場合：droppable を後ろの優先度から外す
  const dropOrder = ["pause", "mirror", "pore", "shave", "cut"];
  if (pagesTarget < beats.length) {
    for (const id of dropOrder) {
      if (beats.length <= pagesTarget) break;
      if (id === keepStep) continue;
      beats = beats.filter((b) => b.stepId !== id);
    }
  }
  // 少なすぎる場合：pause を ヘッドスパの後ろに足す
  if (pagesTarget > beats.length) {
    const pauseTpl = BEATS.find((b) => b.stepId === "pause")!;
    while (beats.length < pagesTarget) {
      const spaIdx = beats.findIndex((b) => b.stepId === "spa");
      beats.splice(spaIdx + 1, 0, { ...pauseTpl });
    }
  }

  // --- ページ生成 ---
  const pages: StoryPage[] = beats.map((b, i) => {
    const raw = b.full(ctx);
    const text = fitText(raw, charsPerPage);
    return {
      index: i + 1,
      text,
      charCount: charLen(text),
      emotion: b.emotion,
      serviceStep: stepName(brand, b.stepId),
      imageScene: b.imageScene,
      backgroundPlateId: b.bgId,
    };
  });

  const emphasizedName = stepName(brand, keepStep);

  // --- タイトル・あらすじ ---
  const title = `${ctx.name}と「${input.finalRealization || "小さな気づき"}」`;

  const synopsis =
    (input.visitReason
      ? `「${input.visitReason}」。そんな思いを抱えて、`
      : `ふとした思いを抱えて、`) +
    `${brand.store.name}を訪れた${ctx.name}。` +
    `${brand.menu.name}を受けるうちに、張りつめていた心が少しずつほどけていきます。` +
    (input.useRona ? `${ctx.rona}のぬくもりにもふれ、` : ``) +
    `最後に「${input.finalRealization || "小さな気づき"}」という気づきにたどり着く、${input.mood || "静かに前向き"}な1話。`;

  // --- 派生テキスト（ハガキ・SNS・ブログ） ---
  const postcardLine = fitText(
    pickByHash(ctx.name, [
      `整える時間は、心がふっと軽くなる時間。`,
      `「${input.finalRealization || "また明日も少し頑張れそう"}」。そんな帰り道を、${brand.store.name}で。`,
      `今日のあなたを、少しだけ軽くする場所。`,
    ]),
    extraLengths.postcardLineChars,
  );

  const snsShort = fitText(
    `${brand.store.tagline}、${brand.store.name}。` +
      `今日のお話は『${title}』。施術のあと、ふっと心が軽くなる——そんな時間をどうぞ。` +
      `#理容室 #メンズ美容 #つるるんとん`,
    extraLengths.snsShortChars,
  );

  const blogIntro = fitText(
    `「${input.complaint || "なんだか最近、疲れて見える"}」——そんなふうに感じる日は、ありませんか。` +
      `${brand.store.name}を訪れたある日の${ctx.name}も、同じでした。` +
      `今日は${brand.menu.name}を通して、心が少し軽くなる小さな物語をお届けします。`,
    extraLengths.blogIntroChars,
  );

  const usedSteps = Array.from(
    new Set(pages.map((p) => p.serviceStep).filter((s) => s !== "—")),
  );

  return {
    id: genId("story"),
    createdAt: new Date().toISOString(),
    status: "draft",
    input,
    title,
    synopsis,
    pages,
    emotionFlow: pages.map((p) => p.emotion),
    usedSteps,
    finalRealization: input.finalRealization || "小さな気づき",
    postcardLine,
    snsShort,
    blogIntro,
    imageDesigns: [],
    outputs: [],
    adoptedCompositions: [],
    rejectedNotes: [],
  };
}

// ---- ゲスト提案（「悩み」→ メタファーキャラ） --------------------------
// 例：「家族にも職場にも弱音を吐けない男性」→「大きな荷物を背負ったくま君」

interface GuestSuggestion {
  guestName: string;
  guestType: string;
  appearance: string;
  personality: string;
  outerAttitude: string;
  hint: string;
}

const GUEST_PRESETS: { keys: string[]; s: GuestSuggestion }[] = [
  {
    keys: ["弱音", "頼れない", "我慢", "抱え", "背負"],
    s: {
      guestName: "大きな荷物を背負ったくま君",
      guestType: "くま",
      appearance: "大きな背中、少し疲れた目、丸い肩",
      personality: "がんばり屋、まじめ、人に頼るのが苦手",
      outerAttitude: "「大丈夫です」と笑ってしまう",
      hint: "背負った荷物＝言えない我慢のメタファー",
    },
  },
  {
    keys: ["人目", "緊張", "こわい", "不安", "おどおど"],
    s: {
      guestName: "からにこもりがちなカメくん",
      guestType: "かめ",
      appearance: "厚いこうら、伏し目がち、ゆっくりした動き",
      personality: "慎重、繊細、人の目が気になる",
      outerAttitude: "当たりさわりなく受け流す",
      hint: "こうら＝人目から身を守る殻のメタファー",
    },
  },
  {
    keys: ["完璧", "失敗", "プレッシャー", "責任", "上司", "リーダー"],
    s: {
      guestName: "とがった角のシカさん",
      guestType: "しか",
      appearance: "立派だが少し重そうな角、まっすぐな姿勢",
      personality: "責任感が強い、完璧主義、弱みを見せたくない",
      outerAttitude: "きっちりしていて隙を見せない",
      hint: "重い角＝背負った責任のメタファー",
    },
  },
  {
    keys: ["孤独", "さみしい", "ひとり", "話せない", "つながり"],
    s: {
      guestName: "夜に光るホタルくん",
      guestType: "ほたる",
      appearance: "小さな体、ぽつんと灯るやわらかい光",
      personality: "やさしい、遠慮がち、本音をしまいこむ",
      outerAttitude: "にこやかだけど一歩引いている",
      hint: "ひとりで灯る光＝静かな孤独のメタファー",
    },
  },
  {
    keys: ["疲れ", "つかれ", "休めない", "忙し", "働きすぎ"],
    s: {
      guestName: "走り続けるウサギさん",
      guestType: "うさぎ",
      appearance: "速そうな足、でも少し充血した目",
      personality: "勤勉、止まると不安、休むのが苦手",
      outerAttitude: "元気にふるまうが空回り気味",
      hint: "走り続ける＝休めない忙しさのメタファー",
    },
  },
];

const GUEST_FALLBACK: GuestSuggestion = {
  guestName: "そっと寄りそうイヌくん",
  guestType: "いぬ",
  appearance: "やわらかい毛、人なつこいけれど少し控えめ",
  personality: "やさしい、気をつかう、自分のことは後回し",
  outerAttitude: "まわりに合わせて笑う",
  hint: "人に気をつかいすぎる、やさしさのメタファー",
};

export function suggestGuest(worryText: string): GuestSuggestion {
  const text = worryText || "";
  for (const p of GUEST_PRESETS) {
    if (p.keys.some((k) => text.includes(k))) return p.s;
  }
  // キーワードに当たらなければ、文字でゆるく振り分け（決定的）
  if (text.trim()) {
    const idx =
      Array.from(text).reduce((a, c) => a + c.charCodeAt(0), 0) %
      GUEST_PRESETS.length;
    return GUEST_PRESETS[idx].s;
  }
  return GUEST_FALLBACK;
}
