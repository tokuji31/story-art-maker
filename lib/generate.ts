// =========================================================================
// 物語生成エンジン（テンプレート版・強化）
//
// 既存の「つるるんとんの絵本」を分析して得た作りを再現：
//   ・会話が主役（語りは最小限）
//   ・段階的な告白（カット→お顔剃り→毛穴洗浄→ヘッドスパ と本音が深まる）
//   ・クライマックスの反転（隠していた気づきが終盤で開く）
//   ・比喩タイトル＋締めの比喩一文
//   ・静寂／五感／反復（ハサミの音だけ・ふわふわの泡・チョキチョキ）
//
// ★ 差し替えポイント ★
//   本物の“感動”は lib/ai.ts の aiGenerateStory()（BYOK）が担当。
//   この関数は API キー無しでも動く無料フォールバック。
// =========================================================================

import { charLen, genId } from "./id";
import { BrandLedger, StoryInput, StoryPage, StoryResult } from "./types";

interface Ctx {
  input: StoryInput;
  brand: BrandLedger;
  name: string;
  tsuru: string;
  run: string;
  rona: string;
  reason: string;
  outer: string;
  worry: string;
  complaint: string;
  complex: string;
  realize: string;
  mood: string;
  motif: string; // 比喩の核（荷物・殻・角…）
  inner: string; // しまいこんだ内なるもの（声・やさしさ…）
}

interface BeatTemplate {
  stepId: string;
  bgId: string;
  emotion: string;
  imageScene: string;
  droppable: boolean;
  rich: (c: Ctx) => string;
  lite: (c: Ctx) => string;
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

// ---- 比喩の核（モチーフ）を入力から推定 -------------------------------
const MOTIF_RULES: { keys: string[]; motif: string }[] = [
  { keys: ["荷物", "背負", "せお", "重"], motif: "荷物" },
  { keys: ["殻", "から", "こうら", "かめ", "カメ"], motif: "殻" },
  { keys: ["角", "しか", "シカ", "鹿"], motif: "角" },
  { keys: ["光", "太陽", "ほたる", "ホタル"], motif: "光" },
  { keys: ["仮面", "マスク", "つくり笑"], motif: "仮面" },
  { keys: ["帽子", "ぼうし"], motif: "帽子" },
  { keys: ["鎧", "よろい", "とげ", "トゲ"], motif: "よろい" },
  { keys: ["走", "うさぎ", "ウサギ", "止まれ"], motif: "足あと" },
];

function detectMotif(c: Pick<StoryInput, "guestName" | "guestType" | "appearance" | "realWorry" | "complex">): string {
  const text = [c.guestName, c.guestType, c.appearance, c.realWorry, c.complex].join(" ");
  for (const r of MOTIF_RULES) {
    if (r.keys.some((k) => text.includes(k))) return r.motif;
  }
  return "胸の奥";
}

function detectInner(realize: string): string {
  if (/(やさし|優し)/.test(realize)) return "やさしさ";
  if (/(声|言葉|本音)/.test(realize)) return "声";
  if (/(弱|よわ)/.test(realize)) return "よわさ";
  if (/(休|つかれ|疲)/.test(realize)) return "ひとやすみ";
  return "ほんとうの気持ち";
}

// ---- 比喩タイトル -----------------------------------------------------
function makeTitle(c: Ctx): string {
  const patterns = [
    `${c.motif}の奥に、しまいこんだ${c.inner}`,
    `${c.motif}の下の、ほんとうの顔`,
    `${c.motif}と、${c.realize}`,
  ];
  // 入力で決定的に選ぶ（毎回同じ結果）
  const seed = Array.from(c.name).reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return patterns[seed % patterns.length];
}

// ---- 締めの比喩一文 ---------------------------------------------------
function makeClosingLine(c: Ctx): string {
  return (
    `ぜんぶ自分で抱えることが、つよさだと思っていました。\n` +
    `でも、ほんとうは——${c.realize}、ということでした。`
  );
}

// ---- 物語のビート（会話駆動・段階的告白） ------------------------------
const BEATS: BeatTemplate[] = [
  {
    stepId: "arrive",
    bgId: "bg-iriguchi",
    emotion: "緊張と、ほんの少しの期待",
    imageScene: "入口でお出迎え。あたたかい光。2人がやさしく迎える構図。",
    droppable: false,
    rich: (c) =>
      `ある日の午後。つるるんとんの扉が、ちりんと鳴りました。\n` +
      `入ってきたのは、${c.name}。少しだけ、疲れた目をしています。\n` +
      `「いらっしゃいませ。どうぞ、こちらへ。」${c.run}が、やわらかく迎えました。\n` +
      `「あ、どうも。……${c.reason}って言われて。それだけ、なんとかなればいいんです。${c.outer}。」\n` +
      `${c.tsuru}は、湯気の立つおしぼりをそっと手渡しながら、にこっと笑いました。\n` +
      `「“大丈夫”って、よく言いますね。」「え?」\n` +
      `「いえ。今日は、ぜんぶこちらにおまかせで。ゆっくりしていってください。まずは、髪から整えましょうか。」`,
    lite: (c) =>
      `つるるんとんの扉が、ちりんと鳴りました。入ってきたのは${c.name}。「${c.reason}が気になって……でも大丈夫です。」` +
      `${c.tsuru}と${c.run}は、あたたかく迎えました。`,
  },
  {
    stepId: "cut",
    bgId: "bg-cut-angle",
    emotion: "輪郭が整いはじめる",
    imageScene: "カット椅子斜め。背後から、肩より上。落ち着いた表情。",
    droppable: true,
    rich: (c) =>
      `チョキ、チョキ。${c.tsuru}のハサミが、ゆっくり動きます。\n` +
      `「お仕事、お忙しいんですか?」${c.tsuru}が、さらりと聞きました。\n` +
      `「ええ、まあ。人より少し、抱えてるほうかもしれません。でも、ぼくがやれば、まるくおさまるんで。慣れてます。」\n` +
      `「ひとりで、ぜんぶ?」\n` +
      `「みんな、忙しいですから。頼むのも、なんだか申し訳なくて。」\n` +
      `${c.tsuru}は、それ以上は聞かず、ただ手を動かします。チョキ、チョキ。\n` +
      `ハサミの音だけが、しばらく店にひびきました。鏡の中の${c.name}が、さっきより少しだけ、すっきりして見えます。`,
    lite: (c) =>
      `チョキ、チョキ。${c.tsuru}がていねいに髪を整えます。${c.name}の輪郭が、少しずつすっきりしていきました。`,
  },
  {
    stepId: "shave",
    bgId: "bg-shave",
    emotion: "張りつめたものが、ほどける",
    imageScene: "顔剃り。安心した表情中心。手元・カミソリは控えめに。",
    droppable: true,
    rich: (c) =>
      `席をそっと倒し、あたたかい蒸しタオルが、ふわりと顔をつつみます。\n` +
      `こわばっていた表情が、ほんの少し、ほどけました。\n` +
      `「……じつは最近、${c.complaint || "あんまり眠れてなくて"}。」\n` +
      `ぽつり、と言葉がこぼれます。「あ、でも大丈夫です。みんな、あることだし。」\n` +
      `${c.run}は、否定も、はげましもせず、ただ、しずかにうなずきました。\n` +
      `「そうですか。……無理に話さなくても、いいんですよ。ここでは。」\n` +
      `その一言に、${c.name}は、なぜだか少しだけ、肩の力がゆるむのを感じました。`,
    lite: (c) =>
      `あたたかい蒸しタオルに、表情がほどけます。「……最近、ちょっと疲れていて。」${c.name}の本音が、少しこぼれました。`,
  },
  {
    stepId: "pore",
    bgId: "bg-pore",
    emotion: "モヤモヤが流れていく",
    imageScene: "毛穴洗浄。流れる水のやわらかい表現。ほどけていく表情。",
    droppable: true,
    rich: (c) =>
      `${c.run}が、ふわふわの泡を立てます。\n` +
      `顔の汚れといっしょに、心の奥のモヤモヤまで、すうっと流れていくようでした。\n` +
      `「……変ですよね。」${c.name}が、小さく笑いました。\n` +
      `「だれかに『手伝おうか』って言われると、つい『大丈夫』って言っちゃうんです。」\n` +
      `「ほんとうは、${c.worry}。でも、弱ってるとこ、見せたくなくて。心配を、かけたくなくて。」\n` +
      `「うん。」${c.run}は、相づちだけを、そっと返します。せかさず、ただ聞いていました。\n` +
      `泡が、ぱちぱちと、静かにはじけました。`,
    lite: (c) =>
      `ふわふわの泡といっしょに、心の詰まりも流れていきます。「ほんとうは、${c.worry}。」言えなかった思いが、ぽつりとこぼれました。`,
  },
  {
    stepId: "spa",
    bgId: "bg-spa",
    emotion: "重さがほどけ、本音が出る（物語の山）",
    imageScene: "ヘッドスパ。頭がふわっと軽くなる抽象表現。やすらいだ表情。",
    droppable: false,
    rich: (c) =>
      `${c.run}の手が、ゆっくりと頭を包みます。指のはらが、こめかみを、やさしく押していきます。\n` +
      `頭のおくにあった重さが、ふわっと、軽くなっていきます。\n` +
      `${c.run}は、手を動かしながら、そっと言いました。\n` +
      `「がんばってきた人ほど、自分のことは、後回しにしちゃうんですよね。」\n` +
      `「……。」\n` +
      `「でもね。${c.realize}——わたしは、そう思うんです。」\n` +
      `${c.name}の息が、すこし、止まりました。お湯の流れる音だけが、店に残ります。\n` +
      `ふいに、思い出しました。いつだったか、近くにいた誰かが、言ってくれたことを。「無理しないで」「手伝うよ」——あのとき、いつものように「大丈夫」と、返してしまった。\n` +
      `その人の、少しさみしそうな顔。あの意味が、いま、ようやく、わかった気がしました。`,
    lite: (c) =>
      `${c.run}の手が、頭の重さをほどいていきます。「${c.realize}——そう思うんです。」その一言が、${c.name}の胸に、しずかに残りました。`,
  },
  {
    stepId: "pause",
    bgId: "bg-spa",
    emotion: "気づきの余韻",
    imageScene: "静かな間。光の粒。肩の力がぬける抽象表現。",
    droppable: true,
    rich: (c) =>
      `しばらく、ただ静かな時間が流れました。何も言わなくていい時間。\n` +
      `${c.name}は、はりつめていた肩の力が、すっと抜けていくのを感じました。\n` +
      `いつもなら頭の中をぐるぐる回っている考えごとが、今日は、ふしぎと静かでした。\n` +
      `${c.run}も、${c.tsuru}も、何も聞かず、ただそばにいてくれます。\n` +
      `${c.motif}が、ほんの少しだけ、軽くなった気がしました。`,
    lite: (c) =>
      `しばらく、静かな時間が流れます。${c.name}の肩から、すっと力が抜けていきました。`,
  },
  {
    stepId: "mirror",
    bgId: "bg-mirror",
    emotion: "整った自分を、まっすぐ見る（反転）",
    imageScene: "鏡前。本人の表情が主役。鏡はやわらかいボケで添える。",
    droppable: true,
    rich: (c) =>
      `施術が終わり、鏡の前にすわります。\n` +
      `映っていたのは、さっきより、少しやわらかい顔の${c.name}でした。\n` +
      `「ぼく、ずっと、ぜんぶ自分でやることが、つよさだと思ってました。」${c.name}が、ぽつりと言いました。\n` +
      `「でも……ちがったのかもしれません。」\n` +
      `${c.tsuru}は、ただ、うなずきました。「整いましたね。いい顔です。」\n` +
      `鏡の中の自分と、しばらく、目が合っていました。なぜだか、まっすぐに見られました。`,
    lite: (c) =>
      `鏡に映るのは、やわらかい表情の${c.name}。「ぜんぶ自分で、と思ってたけど……ちがったのかも。」少し、前を向けた気がしました。`,
  },
  {
    stepId: "leave",
    bgId: "bg-rona",
    emotion: "また明日も、少し頑張れそう",
    imageScene: "帰り際。ロナが足元にそっと寄りそう。やわらかい夕方の光。",
    droppable: false,
    rich: (c) =>
      (c.input.useRona
        ? `足元に、とことこと、${c.rona}がやってきました。くわえていたのは、${c.name}のぼうし。「はい、どうぞ」とでも言うように、ちょこんと置きます。\n` +
          `${c.name}は、ふっと笑いました。「……ありがとう。半分、もってくれたんだね。」\n`
        : `${c.name}は、ドアの前で、ふっと笑いました。\n`) +
      `ドアの外は、いつのまにか、やわらかい夕方の光。\n` +
      `${c.name}は、来たときより、少しだけ軽い足どりで、帰っていきました。\n` +
      `${makeClosingLine(c)}\n` +
      `そして今日もまた。つるるんとんから、心が少し軽くなったお客様が、帰っていきました。`,
    lite: (c) =>
      (c.input.useRona
        ? `帰りぎわ、${c.rona}が足元にそっと寄りそいました。${c.name}は、ふっと笑います。`
        : `帰りぎわ、${c.name}は、ふっと笑いました。`) +
      `「また明日も、少し頑張れそうだ。」${c.mood}な気持ちで、ドアを開けて帰っていきました。`,
  },
];

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
  const realize = input.finalRealization || "頼ってもいい";
  const ctx: Ctx = {
    input,
    brand,
    name: input.guestName.trim() || "ある男性",
    tsuru: brand.characters.find((c) => c.id === "tsuru")?.name ?? "つる君",
    run: brand.characters.find((c) => c.id === "run")?.name ?? "るんちゃん",
    rona: brand.characters.find((c) => c.id === "rona")?.name ?? "ロナ",
    reason: input.visitReason || "顔が疲れて見える",
    outer: input.outerAttitude || "「大丈夫です」と笑ってしまう",
    worry: input.realWorry || "うまく弱音を吐けない",
    complaint: input.complaint,
    complex: input.complex,
    realize,
    mood: input.mood || "静かに前向き",
    motif: detectMotif(input),
    inner: detectInner(realize),
  };

  // しっかり読ませる/標準 は会話たっぷりの rich、短め系は lite
  const rich = charsPerPage >= 160;

  // --- ページ数に合わせてビートを選ぶ ---
  let beats = [...BEATS];
  const keepStep = input.emphasizedStepId;
  const dropOrder = ["pause", "cut", "mirror", "pore", "shave"];
  if (pagesTarget < beats.length) {
    for (const id of dropOrder) {
      if (beats.length <= pagesTarget) break;
      if (id === keepStep) continue;
      beats = beats.filter((b) => b.stepId !== id);
    }
  }
  if (pagesTarget > beats.length) {
    const pauseTpl = BEATS.find((b) => b.stepId === "pause")!;
    while (beats.length < pagesTarget) {
      const spaIdx = beats.findIndex((b) => b.stepId === "spa");
      beats.splice(spaIdx + 1, 0, { ...pauseTpl });
    }
  }

  const pages: StoryPage[] = beats.map((b, i) => {
    const text = rich ? b.rich(ctx) : b.lite(ctx);
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

  const title = makeTitle(ctx);

  const synopsis =
    `「${ctx.reason}」。そんな思いを抱えて、${brand.store.name}を訪れた${ctx.name}。` +
    `${brand.menu.name}を受けるうちに、張りつめていた心が、少しずつほどけていきます。` +
    (input.useRona ? `${ctx.rona}のぬくもりにもふれ、` : ``) +
    `最後に「${ctx.realize}」という気づきにたどり着く、${ctx.mood}な1話。`;

  const postcardLine =
    `${ctx.motif}を、ひとりで抱えなくていい。つるるんとんで、心も少し軽く。`;

  const snsShort =
    `${brand.store.tagline}、${brand.store.name}。\n` +
    `今日のお話は『${title}』。${ctx.realize}——施術のあと、ふっと心が軽くなる物語です。\n` +
    `#理容室 #メンズ美容 #つるるんとん #絵本`;

  const blogIntro =
    `「${ctx.complaint || ctx.reason}」——そんなふうに感じる日は、ありませんか。\n` +
    `${brand.store.name}を訪れたある日の${ctx.name}も、同じでした。\n` +
    `${brand.menu.name}の時間が進むほどに、こわばっていた心がほどけていく——そんな小さな物語を、今日はお届けします。`;

  const usedSteps = Array.from(
    new Set(pages.map((p) => p.serviceStep).filter((s) => s !== "—")),
  );

  return {
    id: genId("story"),
    createdAt: new Date().toISOString(),
    status: "draft",
    source: "template",
    input,
    title,
    synopsis,
    pages,
    emotionFlow: pages.map((p) => p.emotion),
    usedSteps,
    finalRealization: ctx.realize,
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
    keys: ["弱音", "頼れ", "頼る", "我慢", "抱え", "背負"],
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
  if (text.trim()) {
    const idx =
      Array.from(text).reduce((a, c) => a + c.charCodeAt(0), 0) %
      GUEST_PRESETS.length;
    return GUEST_PRESETS[idx].s;
  }
  return GUEST_FALLBACK;
}
