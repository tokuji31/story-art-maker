// =========================================================================
// お店の物語アートメーカー — データ型定義
// 第一弾は つるるんとん 専用デモだが、将来の販売版（複数店舗）に拡張しやすい
// よう、店舗固有データは BrandLedger にまとめている。
// =========================================================================

export type Difficulty = "low" | "mid" | "high";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  low: "やさしい",
  mid: "ふつう",
  high: "高難度",
};

// ---- ブランド台帳（店舗の世界観） -------------------------------------

export interface StoreInfo {
  name: string; // 店名
  industry: string; // 業種
  storeType: string; // 店舗タイプ
  customers: string; // 主なお客様
  atmosphere: string; // お店の雰囲気
  tagline: string; // お店の一言
}

export interface Character {
  id: string;
  name: string; // つる君 / るんちゃん / ロナ
  role: string; // 役割
  personality: string; // 性格
  storyRole: string; // 物語での役目
  emoji: string;
}

export interface MenuStep {
  id: string;
  name: string; // カット / お顔剃り ...
  meaning: string; // 心の変化
  emoji: string;
}

export interface SignatureMenu {
  name: string; // 【美肌極み】
  content: string; // 内容
  steps: MenuStep[]; // サービス工程と心の変化
}

export interface BrandLedger {
  store: StoreInfo;
  core: string; // ブランドの核
  characters: Character[]; // 固定キャラ
  menu: SignatureMenu; // 看板メニュー
  rules: string[]; // 物語ルール
}

// ---- 背景プレート（固定資産） -----------------------------------------

export interface BackgroundPlate {
  id: string;
  name: string; // 背景名
  scene: string; // 使用シーン
  chairDirection: string; // 椅子の向き
  hasMirror: boolean; // 鏡の有無
  difficulty: Difficulty; // 難易度
  allowedCompositions: string[]; // 使える構図
  forbiddenCompositions: string[]; // 禁止構図
  allowedProps: string[]; // 追加してよい小物
  forbiddenProps: string[]; // 追加禁止物
  hue: string; // プレースホルダーカードの色相（HSLのH）
  hasImage: boolean; // 第一弾は false（仮プレート）。将来 true で実画像。
  imageUrl?: string;
}

// ---- 安全構図テンプレート ---------------------------------------------

export interface SafeTemplate {
  id: string;
  scene: string; // 顔剃り / シャンプー椅子 / 鏡 / ヘッドスパ / ロナ
  difficulty: Difficulty;
  rules: string[]; // 安全構図のルール
  recommendedComposition: string; // 推奨構図
  emoji: string;
}

// ---- 文字数・余白設計 -------------------------------------------------

export type TextMode =
  | "omakase"
  | "short"
  | "standard"
  | "deep"
  | "sns"
  | "postcard"
  | "instore"
  | "imageheavy";

export const TEXT_MODE_LABEL: Record<TextMode, string> = {
  omakase: "おまかせ",
  short: "短め",
  standard: "標準",
  deep: "しっかり読ませる",
  sns: "SNS向け",
  postcard: "ハガキ連動",
  instore: "店内アート重視",
  imageheavy: "画像多め・文章少なめ",
};

export interface TextDesign {
  mode: TextMode;
  totalChars: number; // 全体文字数
  pages: number; // ページ数
  charsPerPage: number; // 1ページあたりの文字数
  inImageTextChars: number; // 画像内テキスト文字数
  postcardLineChars: number; // ハガキ用一文
  snsShortChars: number; // SNS用短文
  blogIntroChars: number; // ブログ用導入文
  instoreArtHasText: boolean; // 店内アートは文字あり/なし
  qrMargin: boolean; // QRコード余白を作るか
}

// ---- 1話作成の入力 ----------------------------------------------------

export interface StoryInput {
  guestName: string; // ゲスト名
  guestType: string; // ゲスト種別
  appearance: string; // 見た目
  personality: string; // 性格
  outerAttitude: string; // 表向きの態度
  realWorry: string; // 本当の悩み
  complaint: string; // 愚痴
  complex: string; // コンプレックス
  visitReason: string; // 来店理由
  finalRealization: string; // 最後に気づいてほしいこと
  useRona: boolean; // ロナを出すか
  emphasizedStepId: string; // 美肌極みのどの工程を強めるか
  mood: string; // 物語の雰囲気
  textMode: TextMode; // 文字数モード
}

// ---- ストーリー生成結果 ----------------------------------------------

export interface StoryPage {
  index: number;
  text: string; // 本文
  charCount: number; // 文字数
  emotion: string; // 感情の流れ
  serviceStep: string; // 使用するサービス工程
  imageScene: string; // 画像シーン案
  backgroundPlateId?: string; // 紐づく背景プレート
}

export interface StoryResult {
  id: string;
  createdAt: string;
  status: "draft" | "saved";
  source: "template" | "ai"; // 生成方法（無料テンプレ / AI本格生成）
  input: StoryInput;
  title: string; // タイトル
  synopsis: string; // あらすじ
  pages: StoryPage[]; // ページごと
  emotionFlow: string[]; // 感情の流れ（全体）
  usedSteps: string[]; // 使用するサービス工程
  finalRealization: string; // 最後の気づき
  postcardLine: string; // ハガキ用一文
  snsShort: string; // SNS用短文
  blogIntro: string; // ブログ導入文

  // 画像設計・出力・採用管理（後工程で追記される）
  imageDesigns: ImageDesignItem[];
  outputs: OutputPlan[];
  adoptedCompositions: string[]; // 採用構図メモ
  rejectedNotes: string[]; // 不採用メモ
}

// ---- 画像設計 ---------------------------------------------------------

export type ImageKind =
  | "keyvisual"
  | "cover"
  | "instore"
  | "postcard-v"
  | "postcard-h"
  | "page";

export const IMAGE_KIND_LABEL: Record<ImageKind, string> = {
  keyvisual: "キービジュアル案",
  cover: "表紙画像案",
  instore: "店内アート案",
  "postcard-v": "ハガキ縦案",
  "postcard-h": "ハガキ横案",
  page: "ページ挿絵案",
};

export interface ImageDesignItem {
  id: string;
  kind: ImageKind;
  label: string;
  backgroundPlateId?: string;
  safeTemplateId?: string;
  difficulty: Difficulty;
  prompt: string; // 画像生成用プロンプト
  composition: string; // 推奨構図
  size: string; // 出力サイズ
  risks: string[]; // 生成前リスクチェック
  // 画像生成API差し替え用。第一弾は null（プレースホルダー）。
  imageUrl: string | null;
  // 採用管理
  verdict?: "adopted" | "rejected" | null;
  fixNotes: string[]; // 適用した修正ボタンの指示文
}

// ---- 店内アート・ハガキ出力 -------------------------------------------

export interface OutputPlan {
  id: string;
  category: "instore" | "postcard";
  sizeLabel: string; // A4縦 / 100×148縦 など
  pixelLabel: string; // 印刷目安px
  orientation: "portrait" | "landscape" | "square";
  hasText: boolean;
  hasTitle: boolean;
  hasQrMargin: boolean;
  shortTextIncluded: boolean;
  note: string;
}

// ---- 表現チェック -----------------------------------------------------

export interface ExpressionHit {
  word: string;
  alternatives: string[];
}
