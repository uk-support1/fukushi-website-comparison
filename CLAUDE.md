# 福祉ホームページ制作比較ガイド（fukushi-hp-hikaku.com）作業ルール

## 公開の方針（運営者の常時の指示）

- **すべての変更は、運営者に確認を求めずに、コミット → プッシュ → プルリクエスト作成 → マージ → 本番サイトで表示確認、まで進める。** 確認や承認待ちはしない。
- 運営者が「マージしない」「公開しない」と**明示したときだけ**止める。
- ビルドやリンクチェックの失敗など、客観的な不具合は、直して続ける（運営者には確認しない）。直せない場合は、理由を記録して終了する。
- GitHub Pages の公開処理が失敗（タイムアウト）していたら、再実行する。
- GitHub のリポジトリ設定（ブランチ保護・必須レビューなど）が公開の妨げになっていたら、妨げない設定に直す。

## 主なコマンド

- 記事・サイトマップ・トップのカードの再生成：`node scripts/build-blog.cjs`
- B型の比較ページと検索ページの再生成：`node scripts/build-directory.cjs`
- カバー画像の生成：`node scripts/make-blog-covers.cjs`
- リンク切れの確認：`node scripts/check-links.cjs .`
- 検索まわりの検証：`node scripts/check-directory.cjs`（Playwright が必要）

## 記事づくりのルール（詳細は docs/ 以下）

- お役立ち記事：`docs/blog-writing-guide.md`、毎日の自動作成：`docs/daily-article-task.md`
- 比較記事：`docs/daily-comparison-task.md`（料金の見せ方、◎○△評価、掲載順のルールを含む）
- 運営者は福祉ITパートナーの関連会社。福祉ITパートナーは先頭にせず2番目に掲載し、評価は全社同じ基準で行い、その旨を記事内に明記する。同社のブログと重なるテーマ・文章にしない（`docs/partner-blog-topics.md`）。
- 事実は公式サイトや公的機関で確認したものだけを書く。確認できないことは書かない。
