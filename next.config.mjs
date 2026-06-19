/** @type {import('next').NextConfig} */

// GitHub Pages（プロジェクトサイト）はサブパス配信になるため、
// リポジトリ名を basePath に入れる。GitHub Actions が BASE_PATH を渡す。
// ローカル（BASE_PATH 未設定）では "" になり、そのまま動く。
const basePath = process.env.BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  // 静的サイトとして out/ に書き出す（サーバー不要＝GitHub Pagesで公開可能）
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
