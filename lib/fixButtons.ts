// =========================================================================
// 画像修正ボタン（プロンプトを書かせず、ボタンで修正指示文を生成）
// ボタンを押すと label の修正指示文（instruction）が自動で表示される。
// =========================================================================

export interface FixButton {
  id: string;
  label: string; // ボタン表示
  instruction: string; // 自動で出る修正指示文
}

export interface FixGroup {
  id: string;
  title: string;
  emoji: string;
  buttons: FixButton[];
}

export const FIX_GROUPS: FixGroup[] = [
  {
    id: "background",
    title: "背景系",
    emoji: "🪟",
    buttons: [
      {
        id: "bg-fix",
        label: "背景を固定する",
        instruction:
          "背景は登録済みの背景プレートに固定し、新しい場所や家具を生成しないでください。",
      },
      {
        id: "bg-chair",
        label: "椅子を登録背景に近づける",
        instruction:
          "椅子の形・向き・位置を、登録背景プレートの椅子に合わせてください。勝手に別デザインの椅子にしないこと。",
      },
      {
        id: "bg-mirror",
        label: "鏡の反射を弱くする",
        instruction:
          "鏡の反射は主役にせず、やわらかいボケで弱めてください。反射に人物を描き込みすぎないこと。",
      },
      {
        id: "bg-furniture",
        label: "余計な家具を消す",
        instruction:
          "背景プレートにない家具・棚・小物を削除し、すっきりさせてください。",
      },
      {
        id: "bg-noadd",
        label: "背景にない物を追加しない",
        instruction:
          "背景プレートに存在しない物体は一切追加しないでください。",
      },
    ],
  },
  {
    id: "treatment",
    title: "施術系",
    emoji: "🪒",
    buttons: [
      {
        id: "tr-hand",
        label: "手元を自然にする",
        instruction:
          "手や指の本数・角度を自然にし、不自然なポーズを避けてください。手元はアップにしすぎないこと。",
      },
      {
        id: "tr-razor",
        label: "カミソリを控えめにする",
        instruction:
          "カミソリやハサミなどの刃物を強調せず、画面のすみで控えめに、刃を目立たせないでください。",
      },
      {
        id: "tr-foam",
        label: "泡を減らす",
        instruction: "泡の量を控えめにし、つけすぎないでください。",
      },
      {
        id: "tr-tool",
        label: "道具を目立たせすぎない",
        instruction:
          "施術道具は脇役にとどめ、主役（お客様の表情）を邪魔しないでください。",
      },
      {
        id: "tr-face",
        label: "お客様を安心した表情にする",
        instruction:
          "お客様の表情を、安心してゆるんだやわらかい表情にしてください。",
      },
    ],
  },
  {
    id: "character",
    title: "キャラ系",
    emoji: "🧑‍🎨",
    buttons: [
      {
        id: "ch-tsuru",
        label: "つる君に近づける",
        instruction:
          "つる君は落ち着いた職人らしい雰囲気に。設定の見た目に近づけてください。",
      },
      {
        id: "ch-run",
        label: "るんちゃんの雰囲気をやさしくする",
        instruction:
          "るんちゃんは、やさしく包むようなやわらかい雰囲気にしてください。",
      },
      {
        id: "ch-rona",
        label: "ロナを小さくする",
        instruction:
          "ロナは主役を奪わないよう小さく、画面のすみや足元にそっと配置してください。",
      },
      {
        id: "ch-guest",
        label: "ゲストの表情を前向きにする",
        instruction:
          "ゲストの表情を、ほんの少し前向きで穏やかなものにしてください。",
      },
    ],
  },
  {
    id: "output",
    title: "出力系",
    emoji: "🖼️",
    buttons: [
      {
        id: "out-instore",
        label: "店内アート向けにする",
        instruction:
          "店内に飾る前提で、余白を広く、落ち着いた構図に整えてください。",
      },
      {
        id: "out-postcard",
        label: "ハガキ用に余白を作る",
        instruction:
          "ハガキ印刷用に、文字や宛名・QRが入る余白を確保してください。",
      },
      {
        id: "out-notext",
        label: "文字なし版にする",
        instruction: "画像内の文字をすべて消した、文字なし版にしてください。",
      },
      {
        id: "out-title",
        label: "タイトル入り版にする",
        instruction:
          "上部または下部の余白に、タイトルを入れられる版にしてください。",
      },
      {
        id: "out-qr",
        label: "QRスペースを空ける",
        instruction:
          "隅にQRコードを置ける正方形の余白（無地）を確保してください。",
      },
    ],
  },
];
