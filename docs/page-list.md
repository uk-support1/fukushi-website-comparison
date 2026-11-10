# 比較記事一覧

| 日本語名 | スラッグ | ファイル名 | 状態 |
| --- | --- | --- | --- |
| 福祉事業所向けホームページ制作会社比較 | welfare | welfare-comparison.html | 公開準備完了 |
| 障害者グループホーム向けホームページ制作会社比較 | group-home | group-home-comparison.html | 公開準備完了 |
| 就労継続支援B型向けホームページ制作会社比較 | b-type | b-type-comparison.html | 公開中 |

# その他のページ

| 日本語名 | URL | 原稿・生成 |
| --- | --- | --- |
| お役立ち記事一覧 | /blog/ | `scripts/build-blog.cjs` で生成 |
| お役立ち記事（4カテゴリー、予約投稿を含む） | /blog/<スラッグ>/ | `content/blog/*.md`（手順は docs/blog-writing-guide.md） |
| 運営者情報・編集方針 | /about/ | `content/about.md` |

比較記事を追加するときは `assets/data/comparisons.json` に登録し、`node scripts/make-blog-covers.cjs` と `node scripts/build-blog.cjs` を実行する（トップページのカード・記事内の導線・サイトマップが自動で更新される）。自動作成の手順は `docs/daily-comparison-task.md`。
