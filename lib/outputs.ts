// =========================================================================
// 店内アート・ハガキ 出力プリセット（サイズと印刷目安px）
// =========================================================================

import { genId } from "./id";
import { OutputPlan } from "./types";

export interface SizePreset {
  sizeLabel: string;
  pixelLabel: string;
  orientation: "portrait" | "landscape" | "square";
}

// 店内アート（300dpi 印刷目安）
export const INSTORE_SIZES: SizePreset[] = [
  { sizeLabel: "A4縦", pixelLabel: "2480 × 3508 px", orientation: "portrait" },
  { sizeLabel: "A4横", pixelLabel: "3508 × 2480 px", orientation: "landscape" },
  { sizeLabel: "A3縦", pixelLabel: "3508 × 4961 px", orientation: "portrait" },
  { sizeLabel: "A3横", pixelLabel: "4961 × 3508 px", orientation: "landscape" },
  { sizeLabel: "正方形", pixelLabel: "2480 × 2480 px", orientation: "square" },
];

// ハガキ（100mm × 148mm・300dpi 印刷目安）
export const POSTCARD_SIZES: SizePreset[] = [
  {
    sizeLabel: "ハガキ縦 100×148mm",
    pixelLabel: "1181 × 1748 px",
    orientation: "portrait",
  },
  {
    sizeLabel: "ハガキ横 148×100mm",
    pixelLabel: "1748 × 1181 px",
    orientation: "landscape",
  },
];

export interface OutputOptions {
  hasText: boolean;
  hasTitle: boolean;
  hasQrMargin: boolean;
  shortTextIncluded: boolean;
}

export function makeOutput(
  category: "instore" | "postcard",
  preset: SizePreset,
  opts: OutputOptions,
): OutputPlan {
  const tags: string[] = [];
  tags.push(opts.hasText ? "文字あり" : "文字なし");
  if (opts.hasTitle) tags.push("タイトルあり");
  if (opts.hasQrMargin) tags.push("QR余白あり");
  if (category === "postcard") tags.push(opts.shortTextIncluded ? "短文あり" : "短文なし");

  return {
    id: genId("out"),
    category,
    sizeLabel: preset.sizeLabel,
    pixelLabel: preset.pixelLabel,
    orientation: preset.orientation,
    hasText: opts.hasText,
    hasTitle: opts.hasTitle,
    hasQrMargin: opts.hasQrMargin,
    shortTextIncluded: opts.shortTextIncluded,
    note: tags.join(" / "),
  };
}
