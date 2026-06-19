// =========================================================================
// 表現チェック（医療・健康・美容の誇大/断定表現をやわらかく言い換え）
// 将来 美容・健康・整体・エステ へ広げる前提の簡易版。
// =========================================================================

import { ExpressionHit } from "./types";

export const WARNING_WORDS: { word: string; alternatives: string[] }[] = [
  { word: "治る", alternatives: ["整う", "軽く感じる", "前向きな気持ちになる"] },
  { word: "完治", alternatives: ["すっきり整える", "心地よく感じる"] },
  {
    word: "必ず改善",
    alternatives: ["変化を感じる方もいます", "整えるサポートをします"],
  },
  { word: "絶対", alternatives: ["きっと", "多くの方が"] },
  { word: "若返る", alternatives: ["生き生きとして見える", "印象が明るくなる"] },
  {
    word: "シミが消える",
    alternatives: ["肌の印象を整える", "明るい印象に近づく"],
  },
  { word: "小顔になる", alternatives: ["すっきりした印象に", "輪郭が整って見える"] },
  {
    word: "一回で劇的改善",
    alternatives: ["一度でも違いを感じる方もいます", "少しずつ整えていきます"],
  },
  { word: "日本一", alternatives: ["こだわりの", "ていねいな"] },
  { word: "地域No.1", alternatives: ["地域で愛される", "近くの頼れる"] },
  { word: "永久保証", alternatives: ["安心のアフターケア", "ていねいなフォロー"] },
];

export function checkExpression(text: string): ExpressionHit[] {
  if (!text) return [];
  const hits: ExpressionHit[] = [];
  for (const w of WARNING_WORDS) {
    if (text.includes(w.word)) {
      hits.push({ word: w.word, alternatives: w.alternatives });
    }
  }
  return hits;
}

// 複数テキストをまとめてチェック（重複ワードは1つにまとめる）
export function checkAll(texts: (string | undefined)[]): ExpressionHit[] {
  const merged = new Map<string, ExpressionHit>();
  for (const t of texts) {
    for (const h of checkExpression(t ?? "")) {
      if (!merged.has(h.word)) merged.set(h.word, h);
    }
  }
  return Array.from(merged.values());
}
