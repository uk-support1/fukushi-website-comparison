/* Official information checked 2026-09-08; historical entries are explicitly marked. null means unverified.
   Price filters must match a single plan; editorial placement never changes eligibility. */
(function (root) {
  'use strict';
  const filters = {
    welfare: '福祉業界に詳しい', budget: '初期費用5万円以下',
    noMonthly: '月額料金なし', selfUpdate: '自分で更新できる', seo: 'SEO対応',
    maps: 'Googleマップ対応', marketing: '集客支援あり', content: '写真・文章の相談ができる'
  };
  const companies = [
    {id:'fukushi-it-partner',name:'福祉ITパートナー',url:'https://fukushi-it-partner.com/',
      categories:['b-type'],listing:{recommended:true,commercial:null},
      price:'おまかせライト制作19,800円（税込）',priceNote:'標準ホームページ制作55,000円（税込）。サーバー契約・ドメイン取得・公開作業は別途。月額費用は要確認。',
      plans:[{name:'おまかせライト制作',initial:19800,monthly:null,price:'19,800円（税込）',note:'1ページ。簡単な文章調整、写真・ロゴの配置に対応。Googleマップは要確認。',features:{maps:null}},
        {name:'標準ホームページ制作',initial:55000,monthly:null,price:'55,000円（税込）',note:'構成提案、文章の整理・言い換え、写真配置の提案、Googleマップに対応。'}],
      features:{welfare:true,selfUpdate:null,seo:null,maps:true,marketing:null,content:true},
      support:['福祉・介護・看護・地域支援向け','要確認','要確認','標準プランにGoogleマップの記載あり','問い合わせ導線の設置（集客支援の範囲は要確認）'],
      delivery:'14日間。素材がそろっている場合は最短48時間〜。内容や確認状況により前後。',
      summary:'福祉の事情を相談しながら、見学・体験につながるサイトを作りたい事業所に。',
      reasons:['B型を含む福祉事業所の制作に対応','ライトは文章調整、標準は文章整理・写真配置の提案に対応','問い合わせ導線を設置'],
      source:'https://fukushi-it-partner.com/homepage-plan.html',informationDate:'2026-09-08'},
    {id:'onenet',name:'Onenet（合同会社フェレット）',url:'https://one1-net.com/',
      categories:['b-type'],listing:{recommended:false,commercial:null},
      price:'初期98,000円〜＋月額6,800円〜（税別）',priceNote:'5ページまでのプラン。年間179,600円〜（税別）。',
      plans:[{name:'5ページ',initial:107800,monthly:7480,price:'初期98,000円＋月額6,800円（税別）',note:'1事業所・5ページまで。初期107,800円＋月額7,480円（税込）。'}],
      features:{welfare:true,selfUpdate:true,seo:null,maps:true,marketing:true,content:null},
      support:['福祉業界出身の技術者','テキスト・画像を自社編集可能／マニュアルあり','要確認','Googleマップへの登録','運用・更新・広告運用のサポート'],
      summary:'福祉への理解に加えて、自社更新や公開後の運用支援を重視する事業所に。',
      reasons:['福祉業界出身の技術者が担当','納品後に自社編集が可能','運用・広告運用を相談できる'],
      source:'https://one1-net.com/web-site-production/',informationDate:'2026-09-08'},
    {id:'tomonico',name:'tomonico',url:'https://tomonico.com/',
      categories:['b-type'],listing:{recommended:false,commercial:null},
      price:'現行料金は要確認',priceNote:'2026年7月の既存記事の参考情報：初期0円・月額8,900円〜（税別、3年契約）。別のフリープランは初期298,000円（税別）・月額保守更新費0円。現行提供条件は未確認で、条件検索の適合には含めません。',
      plans:[{name:'トモニコプラン（2026年7月参考）',initial:0,monthly:9790,verified:false,price:'初期0円・月額8,900円〜（税別、2026年7月参考）'},
        {name:'フリープラン（2026年7月参考）',initial:327800,monthly:0,verified:false,price:'初期298,000円（税別）・月額保守更新費0円（2026年7月参考）'}],
      features:{welfare:null,selfUpdate:null,seo:null,maps:null,marketing:null,content:null},
      support:['旧記事では障害福祉向けと紹介／現行要確認','旧記事では更新代行あり／現行要確認','要確認','旧記事ではGoogleビジネスプロフィール基本設定／現行要確認','要確認'],
      summary:'2026年7月の既存記事では障害福祉向けの制作・更新支援を紹介。現行の対応内容は公式サイトへお問い合わせください。',
      reasons:['以下は2026年7月の既存記事の情報です','旧記事ではB型の制作実績や文章・写真の更新支援を紹介','現行プラン・対応範囲は再確認が必要です'],
      source:'comparisons/b-type-comparison.html#tomonico',informationDate:'2026-07'},
    {id:'attlabo',name:'株式会社アトラボ',url:'https://attlabo.com/',
      categories:['b-type'],listing:{recommended:false,commercial:null},
      price:'297,000円〜（税込）',priceNote:'テンプレート利用・5ページ・WP基本設定込み。ディレクション・ライティング・カスタム投稿設定等は別途。継続費用は要確認。',
      plans:[{name:'WordPressテンプレート利用プラン',initial:297000,monthly:null,price:'297,000円〜（税込）',note:'5ページ・WP基本設定込み。ディレクション・ライティング・カスタム投稿設定等は別途。'}],
      features:{welfare:null,selfUpdate:true,seo:true,maps:null,marketing:null,content:null},
      support:['多業種対応／B型の実績は既存記事で紹介','WordPressで自社更新可能／専用管理マニュアルあり','内部SEO対応','要確認','要確認'],
      summary:'B型の制作実績や、オリジナルデザインでの制作を重視する事業所に。',
      reasons:['WordPressの自社更新に対応','ログイン・更新方法の専用マニュアルを提供','テンプレート・オリジナルデザインのプランあり'],
      source:'https://attlabo.com/services/wordpress/',informationDate:'2026-09-08'}
  ];
  function matchingPlans(company, selected) {
    return company.plans.filter(plan => plan.verified !== false && selected.every(key => {
      if (!Object.hasOwn(filters,key)) return false;
      if (key === 'budget') return plan.initial !== null && plan.initial <= 50000;
      if (key === 'noMonthly') return plan.monthly === 0;
      const value = plan.features && Object.hasOwn(plan.features,key) ? plan.features[key] : company.features[key];
      return value === true;
    }));
  }
  function matches(company, selected, category = 'b-type') {
    return company.categories.includes(category) && (!selected.length || matchingPlans(company,selected).length > 0);
  }
  root.CompanyDirectory = {filters,companies,matches,matchingPlans};
})(typeof window === 'undefined' ? globalThis : window);
