# B型比較・条件検索の保守

## 対象と生成

- 公開URLは `comparisons/b-type-comparison.html` を維持。
- 検索結果はルートの `search.html`。GitHub Pagesのプロジェクト配下でも相対URLで動作。
- `assets/js/company-data.js` が会社・料金・対応条件・掲載区分の共通データ。
- `assets/data/b-type-content.json` は既存記事から引き継いだ会社説明、メリット・注意点、下部ガイドとヘッダー・フッター。
- `scripts/build-directory.cjs` で比較表、スマホカード、詳細の料金、検索カード、メタ情報を静的HTMLとして生成。

更新後はリポジトリルートで `node scripts/build-directory.cjs` を実行する。生成された2つのHTMLも一緒に管理する。公開時にNodeや外部DBは不要。別業種を増やす場合は `categories` と記事の生成対象を拡張する（現在の検索はB型のみ）。

## 情報の扱い

掲載4社（福祉ITパートナー・Onenet・tomonico・アトラボ）の料金・対応内容は、いずれも2026年9月29日に公式サイトで確認した情報を優先。4社以外は追加していない。

`source` は各社の公式ページ、`informationDate` は情報時点。今後公式確認した際は出典URLと日付も更新する。会社の新しい住所・法人情報等は推測で補っていない。

`features` は確認できるもののみ `true`。`null` は未確認で、非対応という意味ではない。対応内容の表示も同時に更新する。WordPressへの対応だけでは「自社更新できる」と推測しない。

費用比較の数値は税込相当の円単位。税別掲載価格は10%加算した値を保持。元の表示料金・税区分は `price` と `priceNote` に保存する。福祉ITパートナーは税込19,800円のライトと税込55,000円の標準を別プランで保持する。ライトのGoogleマップは未確認で、`plan.features.maps = null` により会社側の対応フラグを上書きする。

複数条件はANDで同一プラン上で判定する。`matchingPlans()` を適合判定と主料金表示の両方で使用し、条件に合う先頭プランの `price` を主表示する。別プランは補足表示。現行未確認プランは `verified:false` として条件判定から除外する（2026年9月29日時点で `verified:false` のプランはなし）。月額なしはtomonicoのフリープランが該当し1件表示される。主料金・別プラン表示の回帰テストは、テスト専用の合成プランをブラウザ内でのみ差し替えて検証する。

Googleマップはサイトへの掲載、Googleマップへの登録、Googleビジネスプロフィール基本設定を含み、各社の表現を混同しない。写真・文章の相談は公開後の変更対応を含む。月額料金なしは掲載プランの月額保守更新費0円を指し、サーバー等の費用が全く発生しないという意味ではない。各定義は検索フォームにも明示。

## おすすめ・掲載区分

`listing.recommended` は編集上のおすすめ。まず条件判定を行い、適合した会社の中でのみおすすめ会社を先頭表示する。不適合の福祉ITパートナーは表示しない。

`listing.commercial` は将来の掲載協力・PR管理に備えた予約領域で、現時点では全社 `null`。広告契約を示す表示や広告配信処理は実装していない。将来有料掲載を始める際は表示方針と契約の事実を確認してから実装する。

## URL・アクセシビリティ・SEO

GETフォームは `category=b-type&condition=welfare&condition=selfUpdate` のようなURLを生成。サーバー側処理は不要。再読込・共有・戻る・進むで条件を復元し、`pageshow` で再評価する。未知の条件や業種は条件を選び直す案内を出す。重複した条件は一つにまとめ、URL値をHTMLとして挿入しない。

チェックボックスはlabel付き。メニューにアクセシブル名を追加。検索数はstatus領域で伝える。JavaScript無効時もB型記事の表・カード・詳細とフッターリンクを読める。検索結果は誤った全件表示をせず、比較表への案内を出す。

検索ページは `noindex,follow`、canonicalはパラメータなしの `search.html`。サイトマップに追加せず、robots.txtではクロールを許可しnoindexを読み取れる状態を維持。B型のtitle・H1・OGP・Twitter・WebPageの見出しを統一。両ページにBreadcrumbListを追加。FAQは可視コンテンツを追加し、既存記事にFAQ構造化データがなかったため今回も追加していない。

## 検証

`scripts/check-directory.cjs` はPlaywrightで確認する。既存のPlaywrightを利用する場合は `PLAYWRIGHT_MODULE` にモジュールのパスを指定。ブラウザは既定でインストール済みEdge、`QA_BROWSER` で変更可能。

- 256通りの独立テスト：本番の判定関数を期待値に使わず、登録データの機能ビット集合と選択条件の包含関係から期待値を算出。ブラウザ表示・主料金も照合。
- 0件、未知の条件、重複条件、フォーム遷移、戻る・進む、費用条件に合うプラン名。
- PC 1440px、スマホ375px・390px・430pxで両ページの横はみ出しとレイアウト切替。
- B型記事の内部リンク・アンカー・画像、モバイルメニュー、トップ・グループホームの表示。
- JavaScript無効時の比較カードと検索案内。

`QA_LAYOUT_ONLY=1` は256通りのブラウザ検索だけを省略した表示再確認用。スクリーンショット・ログは `docs/qa/` に出力。2026年9月8日に全項目通過後、スマホカードの開閉化と費用プラン表示追加を反映して再確認した。

既存のトップ、グループホーム、福祉全般の記事、共通CSS/JS、サイトマップは変更していない。改修対象内にあったトップの存在しない `#operator` リンクは、新B型ページの運営者情報へ修正。既存ページ側の同リンクは今回の変更対象外。

commit / pushは行っていない。

### 2026-09-29 追記：納期・tomonico等の再確認

福祉ITパートナーの公式サイトに「最短48時間」の納期表記があることを確認したのを機に、掲載4社の「制作期間」と、残っていた「要確認」項目を公式サイトで再調査した。

- 福祉ITパートナー：制作期間は変更なし（14日間・素材がそろえば最短48時間〜）。自分で更新・SEOは当時は公式サイトに記載なしと判断（同日の別ページ確認で後日訂正。下記2026-09-29追記2参照）。
- Onenet：制作期間は公式サイトに記載なし。SEO対策は制作プランに含まれず、別サービス「WEB広報サポート」で対応可能と判明。
- tomonico：`https://tomonico.com/service/fukushi` で現行プラン（トモニコプラン／ミドルプラン／フリープラン）・基本SEO対策・Google Map表示・Googleビジネスプロフィール基本設定が確認できたため、`verified:false` を解除し4社目として条件検索に含めた。自社更新は不可（月額保守での更新代行）。制作の納期日数は記載なく、公開後の更新依頼は5営業日以内が目安。
- アトラボ：`https://attlabo.com/concept/flow/` に「制作期間はおおよそ2〜6ヶ月（規模・プランニング内容により異なる）」の記載を確認。集客支援はSEO・リスティング広告代行・WEBコンサルティングを要望に応じて提供（個別見積り）だが、標準機能ではないため `features.marketing` はnullのまま維持し、表示テキストのみ補足した。

tomonicoの条件検索への算入に伴い、`scripts/check-directory.cjs` の一部の期待値（`budget`／`noMonthly`／`maps`／`welfare+budget+maps`／`welfare+budget+content`、および375px手動確認2箇所）を更新した。**この環境にはPlaywrightがインストールされておらず、`node scripts/check-directory.cjs` を実際には実行できていない。** 更新後は改めてこのチェックを実行して確認すること。

commit / pushは行っていない。

### 2026-09-29 追記2：比較表を記号表記へ変更、福祉ITパートナーの自分で更新・SEOを訂正

比較表の文章が長く読みにくいとの指摘を受け、`福祉への理解`／`自分で更新`／`SEO`／`Googleマップ`／`集客支援`の5項目を、welfare・group-home記事と同じ◎○△×の記号表記に変更した。

- `scripts/build-directory.cjs` に `symbolCell()` を追加。`support` 配列の文字列先頭または末尾にある記号（◎○△×）を `<span class="directory-symbol">` で強調表示する。desktop表・モバイルカード・企業詳細・検索結果のすべてに反映される（`spec()`／`rows` 経由）。
- `assets/css/directory.css` に `.directory-symbol`（色分け）と `.directory-legend`（凡例）を追加。凡例は比較表の直下に表示。
- `https://fukushi-it-partner.com/` のトップページを再確認したところ、「自分で更新・カスタマイズも可能」「基本的なSEO対策も標準装備」の記載があった（`homepage-plan.html`には記載がなく、前回の追記1では見落としていた）。`features.selfUpdate`・`features.seo` を `true` に修正し、`support[1]` はユーザー指定の表記「カスタマイズで○」とした。
- tomonicoの「自分で更新」は月額保守での更新代行であり自社編集不可のため「×（月額保守で更新代行、自社編集は不可）」とした。

福祉ITパートナーの`selfUpdate`が`true`になったことに伴い、`scripts/check-directory.cjs`の`expectedIds(['selfUpdate'])`を`['fukushi-it-partner','onenet','attlabo']`に更新した（Node上で`matches()`を直接実行し他の組み合わせに影響がないことを確認済み）。FAQ「公開後は自分で更新できますか？」の回答文も、福祉ITパートナーが自社更新に対応する旨に修正した。

引き続きPlaywrightは未インストールのため`node scripts/check-directory.cjs`は未実行。

commit / pushは行っていない。

### 2026-09-29 追記3：「おすすめ」表示を廃止し項目別の最良セル強調へ変更、集客支援・制作期間・制作料金を記号表記に

「福祉ITパートナーがおすすめ」という編集上の紹介をやめ、welfare・group-home記事と同じく、比較表の各項目（行）ごとに最も優れている会社のセルのみを強調する方式に変更した。

- `assets/js/company-data.js`：`fukushi-it-partner`の`listing.recommended`を`false`に変更（全社`false`）。`support[4]`（集客支援）を「カスタマイズで○」に変更（自分で更新と同じくカスタマイズで対応）。`delivery`（制作期間）を4社とも◎○△×の記号表記に変更（福祉ITパートナーは指定どおり「◎（最短48h、標準14日）」）。各社に`costRating`（制作料金の記号評価）と`priceDetails`（初期費用・月額費用の内訳）を追加。
- `scripts/build-directory.cjs`：「当サイトおすすめ」バッジ（`label()`）、`recommended-column`、`directory-card--recommended`、おすすめ限定の紹介文リストを削除。比較表は行ごとに`bestMask()`で最良の記号（◎優先、複数社が同点なら同時に強調）を判定し、該当セルに`directory-best-cell`クラスを付与する方式に統一。制作期間の表示を`symbolCell()`経由に変更。制作料金は記号を先頭に表示し、その下に初期費用・月額費用の内訳を`<dl>`でまとめて表示する構成に変更（`price()`/`priceDetailsList()`）。詳細記事の「おすすめポイント」見出しは「特徴」に変更（全社共通の紹介のため）。運営者情報の文言も、個別のおすすめ紹介から項目別評価の説明に修正。
- `assets/css/directory.css`：`.recommended-column`／`.directory-label`／`.directory-card--recommended`を削除し、`.directory-best-cell`（項目別の最良セル強調）と`.directory-price-breakdown`／`.directory-price-main`（料金内訳の表示）を追加。

`listing.recommended`は`matches()`の判定に一切使われていないため、条件検索・フィルタの挙動に変更はない。Node上で256通りの条件組み合わせを実行し、変更前と同じ結果（`selfUpdate`・`budget`・`noMonthly`・`maps`・`welfare`・`selfUpdate+marketing`など）になることを確認済み。`scripts/check-directory.cjs`のハードコード済み期待値（44-51行目）は`features`ベースのため変更不要。ただし「おすすめ」バッジ・強調のUI表示に関するPlaywright側のアサーションは無く、`recommended`の値を反転させて`matches()`が変わらないことを確認する独立オラクルのテスト（37-42行目）もロジック自体は変更していないため影響なし。

引き続きこの環境にはPlaywrightがインストールされておらず、`node scripts/check-directory.cjs`は未実行。Playwrightが使える環境で実行し、特に比較表の見た目（強調セルの表示・レイアウト崩れの有無）を確認すること。

commit / pushは行っていない。

### 2026-09-29 追記4：比較表をさらに簡素化、強調色変更、列順を変更

比較表の強調が分かりにくい、文章が多くて見づらいとの指摘を受け、一番最初の比較表（デスクトップ表）をさらに簡素化した。個別の詳細（スマホカードの「対応内容を確認する」・各社の詳細記事）は従来どおり丸括弧付きの説明文を維持しており、情報は失っていない。

- `scripts/build-directory.cjs`：`directory-best-cell`の強調を、左端の太線（box-shadow）を廃止し、背景色をグリーン系からアンバー系（`#fff2cc`）に変更して目立たせた。
- 比較表（デスクトップ表）の各項目（福祉への理解／自分で更新／SEO／Googleマップ／集客支援／制作期間）を、丸括弧の説明文を省いた記号のみの表示に変更（`tableSymbol()`を追加）。「公式サイトに記載なし」を含む項目は記号を付けず「記載なし」の文字のみを表示する。「カスタマイズで○」は比較表では記号「△」のみとして扱う（強調判定のランクも合わせて△として計算）。
- 制作料金の行は、記号・料金内訳（`<dl>`）を比較表からは外し、改行区切りの金額のみの表示に変更（`company-data.js`に`tableAmounts`を追加）。tomonicoの2行目は月額8,900円（税別）を1年換算した106,800円を表示し、表下の注記でその旨を説明。
- `assets/js/company-data.js`：会社の掲載順を「福祉ITパートナー・Onenet・tomonico・アトラボ」から「Onenet・tomonico・福祉ITパートナー・アトラボ」に変更（福祉ITパートナーが3列目になるよう指定）。比較表・スマホカード・検索結果・会社詳細のすべてがこの配列順に従うため、ページ全体で同じ順序に統一されている。

掲載順の変更は`matches()`の判定結果（該当有無）には影響しないが、複数社が該当する場合の配列順は変わるため、`scripts/check-directory.cjs`のハードコード済み期待値（`budget`／`maps`／`selfUpdate`／`welfare+budget+content`）と、検索結果の先頭表示に関するアサーション（`福祉業界に詳しい`選択時の先頭は`onenet`に変更）を更新した。Node上で256通りの条件組み合わせを実行し、該当する会社の集合自体（順序を除く）が変更前と同一であることを確認済み。

引き続きこの環境にはPlaywrightがインストールされておらず、`node scripts/check-directory.cjs`は未実行。Playwrightが使える環境で実行し、特に比較表の見た目（強調色・列順・レイアウト崩れの有無）を確認すること。

commit / pushは行っていない。

### 2026-09-29 追記5：制作期間を文字表記に、制作料金を初期・月額の2行表記に、強調色とセル中央寄せを調整

- `scripts/build-directory.cjs`／`assets/js/company-data.js`：比較表の「制作期間」を◎○△×表記から直接の文字表記に変更（`deliveryLabel`を追加：要確認／要確認／最短48h〜／2〜6か月）。ランキング（強調セルの判定）は引き続き元の`delivery`フィールド（記号入り）を使うため、福祉ITパートナー（最短48h〜）が引き続き強調される。
- 「制作料金」の表示を「初期」「月額」の2行表記に変更（`tableAmounts`を更新：初期98,000円〜／月額6,800円〜、初期0円／月額8,900円〜（3年契約）、初期19,800円／月額0円〜、初期297,000円〜／月額要確認）。ランキングは`costRating`のまま（福祉ITパートナーが◎で強調）。
- `assets/css/directory.css`：強調セルの背景色をアンバーからイエロー〜オレンジの中間色（`#ffe4a3`）に変更し、目立ちすぎないよう調整。比較表のセルをすべて中央寄せ（`text-align:center`）に変更。

`matches()`のロジック・データには影響がないため、Node上で256通りの条件組み合わせを再実行し、クラッシュ・結果変化がないことを確認済み。`scripts/check-directory.cjs`のハードコード済み期待値に変更は不要。

引き続きこの環境にはPlaywrightがインストールされておらず、`node scripts/check-directory.cjs`は未実行。

commit / pushは行っていない。

## 今回見送った改善

カードの縦長改善、再検索フォーム位置、PC文字サイズ、検索OGPの個別化、JS無効時フォーム、業種追加向けの大規模整理、support配列の再設計、source設計の全面変更は今後の対応とする。
