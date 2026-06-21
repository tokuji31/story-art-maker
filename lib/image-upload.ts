// =========================================================================
// 画像アップロード用ユーティリティ
// localStorage は容量が小さい（数MB）ため、アップロード画像は
// 自動で縮小＋JPEG圧縮してから data URL 化して保存する。
// =========================================================================

export async function fileToCompressedDataUrl(
  file: File,
  maxDim = 1100,
  quality = 0.8,
): Promise<string> {
  // 1) ファイル → data URL
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("ファイルを読み込めませんでした"));
    fr.readAsDataURL(file);
  });

  // 2) 画像として読み込み
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("画像を読み込めませんでした"));
    i.src = rawDataUrl;
  });

  // 3) 長辺 maxDim に縮小して canvas へ描画（白背景で透過を埋める）
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return rawDataUrl;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  // 4) JPEG で書き出し（容量を抑える）
  return canvas.toDataURL("image/jpeg", quality);
}

// 既存の data URL を再圧縮する。
// localStorage が逼迫したときに、保存済みの参照画像をまとめて小さくし直すために使う。
export async function compressDataUrl(
  dataUrl: string,
  maxDim = 1100,
  quality = 0.8,
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("画像を読み込めませんでした"));
    i.src = dataUrl;
  });
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  const scale = Math.min(1, maxDim / Math.max(w, h));
  w = Math.max(1, Math.round(w * scale));
  h = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

// data URL の実バイト数を概算（base64 の長さから推定）
export function approxDataUrlBytes(dataUrl: string): number {
  if (!dataUrl) return 0;
  const i = dataUrl.indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}

// バイト数を「●● KB」「●● MB」の人間が読める形に
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
