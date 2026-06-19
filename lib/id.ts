// 小さなID生成ヘルパー（ブラウザ実行）
export function genId(prefix = "id"): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rnd}`;
}

// 文字数（コードポイント単位＝日本語向け）
export function charLen(s: string): number {
  return Array.from(s).length;
}
