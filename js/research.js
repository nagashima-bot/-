/**
 * せどりプロ - リサーチエンジン
 * 商品スコアリング・カテゴリー分析・季節トレンド・価格差検出
 */
const Research = (() => {

  // ================================================================
  // カテゴリー別 利益が出やすい商品データベース
  // 実績ベースの平均利益率・回転率・仕入れ難易度をスコア化
  // ================================================================
  const categoryDB = {
    // --- 本・メディア ---
    'books_reference': {
      name: '専門書・参考書', parent: '本',
      avgMargin: 35, turnover: 3, difficulty: 1, competition: 2,
      tips: '絶版本・大学教科書が狙い目。状態が良ければ高値安定。',
      bestBuy: ['amazon', 'store', 'yahoo_auction'],
      bestSell: ['amazon', 'mercari'],
      keywords: ['教科書', '参考書', '専門書', '絶版', '医学書', '法律書'],
    },
    'books_manga_set': {
      name: '漫画セット（全巻）', parent: '本',
      avgMargin: 25, turnover: 4, difficulty: 2, competition: 3,
      tips: '完結済み全巻セットは安定需要。人気作はプレミア化も。',
      bestBuy: ['mercari', 'yahoo_auction', 'store'],
      bestSell: ['amazon', 'mercari'],
      keywords: ['全巻', '漫画セット', 'コミック全巻', '完結'],
    },
    // --- ゲーム ---
    'games_retro': {
      name: 'レトロゲーム', parent: 'ゲーム',
      avgMargin: 40, turnover: 3, difficulty: 3, competition: 3,
      tips: 'SFC・PS1・GBAなど。箱説明書付きは2〜3倍。海外需要もあり。',
      bestBuy: ['store', 'yahoo_auction', 'mercari'],
      bestSell: ['amazon', 'mercari', 'yahoo'],
      keywords: ['レトロゲーム', 'SFC', 'ファミコン', 'GBA', 'PS1', 'ゲームボーイ'],
    },
    'games_limited': {
      name: '限定版ゲームソフト', parent: 'ゲーム',
      avgMargin: 30, turnover: 4, difficulty: 3, competition: 3,
      tips: '初回限定版・特典付きは発売後にプレミア化しやすい。',
      bestBuy: ['amazon', 'rakuten', 'store'],
      bestSell: ['amazon', 'mercari'],
      keywords: ['限定版', '初回限定', '特典付き', 'コレクターズ'],
    },
    'games_switch': {
      name: 'Nintendo Switch ソフト', parent: 'ゲーム',
      avgMargin: 15, turnover: 5, difficulty: 1, competition: 4,
      tips: '新作は値崩れ前に回転。任天堂タイトルは値崩れしにくい。',
      bestBuy: ['amazon', 'rakuten', 'store'],
      bestSell: ['mercari', 'amazon'],
      keywords: ['Switch', 'スイッチ', '任天堂'],
    },
    // --- 家電・ガジェット ---
    'electronics_apple': {
      name: 'Apple製品', parent: '家電',
      avgMargin: 12, turnover: 5, difficulty: 2, competition: 4,
      tips: 'AirPods・Apple Watch旧モデルが狙い目。整備済み品も需要あり。',
      bestBuy: ['amazon', 'rakuten', 'store'],
      bestSell: ['mercari', 'yahoo'],
      keywords: ['Apple', 'AirPods', 'iPad', 'Apple Watch', 'iPhone'],
    },
    'electronics_audio': {
      name: 'オーディオ機器', parent: '家電',
      avgMargin: 25, turnover: 3, difficulty: 2, competition: 2,
      tips: 'ヘッドホン・イヤホン・スピーカー。ヴィンテージ品は高利益。',
      bestBuy: ['yahoo_auction', 'store', 'mercari'],
      bestSell: ['amazon', 'mercari'],
      keywords: ['ヘッドホン', 'イヤホン', 'スピーカー', 'アンプ', 'オーディオ'],
    },
    'electronics_camera': {
      name: 'カメラ・レンズ', parent: '家電',
      avgMargin: 20, turnover: 3, difficulty: 3, competition: 3,
      tips: 'オールドレンズ・フィルムカメラは海外需要も。レンズ単体が高利益。',
      bestBuy: ['yahoo_auction', 'store', 'mercari'],
      bestSell: ['mercari', 'yahoo', 'amazon'],
      keywords: ['カメラ', 'レンズ', 'Canon', 'Nikon', 'Sony', 'フィルムカメラ'],
    },
    'electronics_beauty': {
      name: '美容家電', parent: '家電',
      avgMargin: 22, turnover: 4, difficulty: 2, competition: 3,
      tips: 'ドライヤー・美顔器・脱毛器。型落ちでも需要安定。',
      bestBuy: ['amazon', 'rakuten', 'store'],
      bestSell: ['mercari', 'amazon'],
      keywords: ['ドライヤー', '美顔器', '脱毛器', 'リファ', 'パナソニック'],
    },
    // --- おもちゃ・ホビー ---
    'toys_figure': {
      name: 'フィギュア', parent: 'おもちゃ',
      avgMargin: 35, turnover: 3, difficulty: 2, competition: 3,
      tips: '一番くじ・プライズ品は入手後即プレミア化。未開封品が鍵。',
      bestBuy: ['store', 'mercari', 'yahoo_auction'],
      bestSell: ['amazon', 'mercari', 'yahoo'],
      keywords: ['フィギュア', '一番くじ', 'プライズ', 'ねんどろいど', 'figma'],
    },
    'toys_trading_card': {
      name: 'トレーディングカード', parent: 'おもちゃ',
      avgMargin: 40, turnover: 5, difficulty: 3, competition: 4,
      tips: 'ポケカ・遊戯王・ワンピースカード。レアカード単体が超高利益。',
      bestBuy: ['store', 'mercari', 'yahoo_auction'],
      bestSell: ['mercari', 'yahoo'],
      keywords: ['ポケモンカード', '遊戯王', 'ワンピースカード', 'トレカ', 'BOX'],
    },
    'toys_lego': {
      name: 'LEGO', parent: 'おもちゃ',
      avgMargin: 30, turnover: 3, difficulty: 2, competition: 3,
      tips: '廃盤セットはプレミア化必至。スターウォーズ系が特に高値。',
      bestBuy: ['amazon', 'rakuten', 'store'],
      bestSell: ['amazon', 'mercari'],
      keywords: ['LEGO', 'レゴ', '廃盤', 'スターウォーズ'],
    },
    'toys_plamo': {
      name: 'プラモデル・ガンプラ', parent: 'おもちゃ',
      avgMargin: 25, turnover: 4, difficulty: 2, competition: 3,
      tips: '限定ガンプラは入手困難で高利益。PGシリーズは安定。',
      bestBuy: ['store', 'amazon', 'rakuten'],
      bestSell: ['amazon', 'mercari'],
      keywords: ['ガンプラ', 'プラモデル', 'MG', 'PG', 'RG', 'バンダイ'],
    },
    // --- ファッション ---
    'fashion_brand': {
      name: 'ブランド品', parent: 'ファッション',
      avgMargin: 30, turnover: 3, difficulty: 3, competition: 3,
      tips: 'シュプリーム・ノースフェイスコラボなど。真贋に注意。',
      bestBuy: ['yahoo_auction', 'mercari', 'store'],
      bestSell: ['mercari', 'yahoo'],
      keywords: ['Supreme', 'ノースフェイス', 'シュプリーム', 'NIKE', 'コラボ'],
    },
    'fashion_sneakers': {
      name: 'スニーカー', parent: 'ファッション',
      avgMargin: 25, turnover: 4, difficulty: 3, competition: 4,
      tips: '限定モデル・コラボモデルはプレミア化。SNKRS抽選が仕入れ先。',
      bestBuy: ['store', 'amazon', 'rakuten'],
      bestSell: ['mercari', 'yahoo'],
      keywords: ['スニーカー', 'NIKE', 'Jordan', 'Dunk', 'adidas', 'New Balance'],
    },
    // --- コスメ・ヘルスケア ---
    'cosme_korean': {
      name: '韓国コスメ', parent: 'コスメ',
      avgMargin: 35, turnover: 5, difficulty: 2, competition: 3,
      tips: 'SNSでバズった商品は瞬間的に需要急増。トレンド把握が鍵。',
      bestBuy: ['rakuten', 'other'],
      bestSell: ['mercari', 'amazon'],
      keywords: ['韓国コスメ', 'CICA', 'クッションファンデ', 'パック'],
    },
    'cosme_limited': {
      name: '限定コスメ', parent: 'コスメ',
      avgMargin: 30, turnover: 4, difficulty: 3, competition: 3,
      tips: 'クリスマスコフレ・限定パレットは確実にプレミア化。',
      bestBuy: ['store', 'amazon', 'rakuten'],
      bestSell: ['mercari', 'amazon'],
      keywords: ['コフレ', '限定', 'ホリデー', 'パレット', 'クリスマス'],
    },
    // --- 日用品・食品 ---
    'daily_supplement': {
      name: 'サプリメント・健康食品', parent: '日用品',
      avgMargin: 20, turnover: 5, difficulty: 1, competition: 4,
      tips: 'リピート需要が高い。セール時にまとめ買いで利益確保。',
      bestBuy: ['amazon', 'rakuten'],
      bestSell: ['amazon', 'mercari'],
      keywords: ['サプリ', 'プロテイン', 'ビタミン', '健康食品'],
    },
    'daily_baby': {
      name: 'ベビー用品', parent: '日用品',
      avgMargin: 18, turnover: 5, difficulty: 1, competition: 3,
      tips: 'おむつ・ミルクは安定需要。廃盤品はプレミアも。',
      bestBuy: ['amazon', 'rakuten', 'store'],
      bestSell: ['amazon', 'mercari'],
      keywords: ['おむつ', 'ベビー', 'ミルク', '哺乳瓶', 'チャイルドシート'],
    },
    // --- その他 ---
    'other_ticket': {
      name: '株主優待券・商品券', parent: 'その他',
      avgMargin: 8, turnover: 5, difficulty: 1, competition: 2,
      tips: '金券ショップ仕入れ→ヤフオクが王道。薄利多売。',
      bestBuy: ['store', 'yahoo_auction'],
      bestSell: ['yahoo', 'mercari'],
      keywords: ['株主優待', '商品券', 'ギフトカード', 'クオカード'],
    },
    'other_outdoor': {
      name: 'アウトドア用品', parent: 'その他',
      avgMargin: 22, turnover: 3, difficulty: 2, competition: 2,
      tips: 'キャンプブームで需要増。ブランド品は値崩れしにくい。',
      bestBuy: ['mercari', 'yahoo_auction', 'store'],
      bestSell: ['mercari', 'amazon'],
      keywords: ['キャンプ', 'テント', 'コールマン', 'スノーピーク'],
    },
  };

  // ================================================================
  // 季節トレンドデータベース
  // month: 1-12, demand: 1-5
  // ================================================================
  const seasonalTrends = [
    {
      name: 'クリスマス関連',
      keywords: ['クリスマス', 'コフレ', 'アドベント', 'ツリー', 'イルミネーション'],
      months: { 10: 2, 11: 4, 12: 5, 1: 1 },
      tip: '10月から仕込み開始、11〜12月がピーク。1月は一気に値崩れ。',
    },
    {
      name: 'バレンタイン',
      keywords: ['バレンタイン', 'チョコ', 'ゴディバ'],
      months: { 1: 3, 2: 5 },
      tip: '1月中旬から需要増。限定パッケージが狙い目。',
    },
    {
      name: '新学期・入学',
      keywords: ['入学', 'ランドセル', '文房具', '辞書', '電子辞書', '制服'],
      months: { 1: 2, 2: 4, 3: 5, 4: 3 },
      tip: '2〜3月がピーク。電子辞書・参考書が売れる。',
    },
    {
      name: '花粉症対策',
      keywords: ['花粉', '空気清浄機', 'マスク', '花粉症'],
      months: { 1: 2, 2: 4, 3: 5, 4: 4, 5: 2 },
      tip: '1月末から仕入れ開始。3月がピーク。',
    },
    {
      name: 'GW・大型連休',
      keywords: ['旅行', 'キャリーバッグ', 'アウトドア', 'BBQ', 'テント'],
      months: { 3: 2, 4: 4, 5: 5 },
      tip: 'アウトドア・旅行グッズが売れる。',
    },
    {
      name: '夏物・冷感',
      keywords: ['扇風機', '冷感', 'プール', '水着', '日焼け止め', 'かき氷'],
      months: { 5: 3, 6: 4, 7: 5, 8: 5, 9: 2 },
      tip: '5月から仕込み。7〜8月がピーク。9月は処分価格。',
    },
    {
      name: '夏休み・自由研究',
      keywords: ['自由研究', '工作', '実験', '昆虫', '望遠鏡'],
      months: { 6: 2, 7: 5, 8: 4 },
      tip: '7月が最需要。キットものが人気。',
    },
    {
      name: 'ハロウィン',
      keywords: ['ハロウィン', 'コスプレ', '仮装', 'パーティー'],
      months: { 9: 3, 10: 5 },
      tip: '9月から準備需要。10月がピーク。',
    },
    {
      name: '暖房・冬物',
      keywords: ['ヒーター', 'こたつ', '暖房', '手袋', 'マフラー', '加湿器'],
      months: { 10: 3, 11: 5, 12: 5, 1: 4, 2: 3 },
      tip: '10月から需要開始。加湿器は11〜2月が安定。',
    },
    {
      name: '年末年始・お正月',
      keywords: ['年賀状', 'おせち', '福袋', 'お年玉', 'カレンダー'],
      months: { 11: 3, 12: 5, 1: 4 },
      tip: '福袋の転売はルール要確認。カレンダーは安定。',
    },
    {
      name: 'ボーナス商戦',
      keywords: ['高級', '家電', 'ブランド', '時計'],
      months: { 6: 4, 7: 5, 12: 5 },
      tip: '6月・12月のボーナス時期は高額商品が動く。',
    },
    {
      name: 'ゲーム新作シーズン',
      keywords: ['ゲーム', '新作', 'PS5', 'Switch', '限定版'],
      months: { 2: 3, 3: 4, 9: 3, 10: 4, 11: 5, 12: 5 },
      tip: '年末商戦11〜12月と春3月に大型タイトル集中。',
    },
  ];

  // ================================================================
  // 商品スコアリングアルゴリズム
  // ================================================================
  const SCORE_WEIGHTS = {
    profitMargin: 30,   // 利益率の重み (max 30)
    roi: 20,            // ROI の重み (max 20)
    turnover: 15,       // 回転率の重み (max 15)
    competition: 15,    // 競合の少なさ (max 15)
    seasonal: 10,       // 季節適合度 (max 10)
    priceDiff: 10,      // プラットフォーム間価格差 (max 10)
  };

  /**
   * 商品をスコアリング
   * @param {Object} item - リサーチ商品データ
   * @returns {Object} スコア詳細
   */
  function scoreProduct(item) {
    const scores = {};
    let total = 0;

    // 1. 利益率スコア (0-30)
    const margin = item.estimatedMargin || 0;
    scores.profitMargin = Math.min(30, Math.max(0, margin * 0.75));

    // 2. ROIスコア (0-20)
    const roi = item.estimatedROI || 0;
    scores.roi = Math.min(20, Math.max(0, roi * 0.2));

    // 3. 回転率スコア (0-15) - ユーザー評価 1-5
    const turnover = item.turnoverRating || 3;
    scores.turnover = (turnover / 5) * 15;

    // 4. 競合スコア (0-15) - 競合少ない=高スコア。1-5 (1=少ない)
    const competition = item.competitionRating || 3;
    scores.competition = ((6 - competition) / 5) * 15;

    // 5. 季節適合度 (0-10)
    scores.seasonal = calcSeasonalScore(item.keywords || item.name || '') * 10;

    // 6. プラットフォーム間価格差スコア (0-10)
    const priceDiff = calcPriceDiffScore(item.prices || {});
    scores.priceDiff = priceDiff * 10;

    // 合計
    total = Object.values(scores).reduce((sum, v) => sum + v, 0);

    // ランク判定
    let rank, rankLabel;
    if (total >= 80) { rank = 'S'; rankLabel = '超優良'; }
    else if (total >= 65) { rank = 'A'; rankLabel = '優良'; }
    else if (total >= 50) { rank = 'B'; rankLabel = '良好'; }
    else if (total >= 35) { rank = 'C'; rankLabel = '普通'; }
    else { rank = 'D'; rankLabel = '低評価'; }

    return {
      total: Math.round(total * 10) / 10,
      scores,
      rank,
      rankLabel,
    };
  }

  /**
   * 季節適合スコア (0-1)
   */
  function calcSeasonalScore(text) {
    const currentMonth = new Date().getMonth() + 1;
    let maxScore = 0;

    seasonalTrends.forEach(trend => {
      const isMatch = trend.keywords.some(kw =>
        text.toLowerCase().includes(kw.toLowerCase())
      );
      if (isMatch && trend.months[currentMonth]) {
        maxScore = Math.max(maxScore, trend.months[currentMonth] / 5);
      }
    });

    return maxScore;
  }

  /**
   * プラットフォーム価格差スコア (0-1)
   */
  function calcPriceDiffScore(prices) {
    const values = Object.values(prices).filter(v => v > 0);
    if (values.length < 2) return 0;

    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === 0) return 0;

    const diffRate = (max - min) / min;
    // 30%以上の価格差で満点
    return Math.min(1, diffRate / 0.3);
  }

  // ================================================================
  // 最適仕入れ・販売先の自動提案
  // ================================================================
  function suggestBestRoute(prices) {
    const platforms = Object.keys(prices).filter(k => prices[k] > 0);
    if (platforms.length < 2) return null;

    let bestCombo = null;
    let bestProfit = -Infinity;

    const buyPlatforms = ['amazon', 'mercari', 'yahoo_auction', 'rakuten', 'store'];
    const sellPlatforms = ['amazon', 'mercari', 'yahoo', 'rakuma'];

    // 仕入れ先候補
    buyPlatforms.forEach(buy => {
      if (!prices[buy] || prices[buy] <= 0) return;

      // 販売先候補
      sellPlatforms.forEach(sell => {
        const sellKey = sell === 'yahoo' ? 'yahoo_auction' : sell;
        if (buy === sellKey) return; // 同じプラットフォームはスキップ
        if (!prices[sellKey] && !prices[sell]) return;

        const salePrice = prices[sellKey] || prices[sell];
        if (!salePrice || salePrice <= 0) return;

        const settings = Storage.getSettings();
        let platformResult;
        switch (sell) {
          case 'amazon':
            platformResult = Platforms.calcAmazon(salePrice, settings.amazonCategory, {
              sellerType: settings.amazonSellerType,
              useFba: settings.useFba,
              monthlyVolume: settings.monthlyVolume,
            });
            break;
          case 'mercari':
            platformResult = Platforms.calcMercari(salePrice, {
              shippingMethod: settings.mercariShipping,
            });
            break;
          case 'yahoo':
            platformResult = Platforms.calcYahooAuction(salePrice, {
              isPremium: settings.yahooPremium,
              monthlyVolume: settings.monthlyVolume,
            });
            break;
          case 'rakuma':
            platformResult = Platforms.calcRakuma(salePrice, {});
            break;
          default:
            return;
        }

        const profit = Platforms.calculateProfit(prices[buy], salePrice, platformResult, {
          packagingCost: settings.packagingCost,
        });

        if (profit.netProfit > bestProfit) {
          bestProfit = profit.netProfit;
          bestCombo = {
            buyFrom: buy,
            buyPrice: prices[buy],
            sellOn: sell,
            sellPrice: salePrice,
            netProfit: profit.netProfit,
            profitRate: profit.profitRate,
            roi: profit.roi,
            fees: platformResult.totalFees,
          };
        }
      });
    });

    return bestCombo;
  }

  // ================================================================
  // カテゴリーマッチング（キーワードから最適カテゴリーを推定）
  // ================================================================
  function matchCategories(text) {
    if (!text) return [];
    const lower = text.toLowerCase();
    const matches = [];

    Object.entries(categoryDB).forEach(([key, cat]) => {
      let matchScore = 0;

      cat.keywords.forEach(kw => {
        if (lower.includes(kw.toLowerCase())) {
          matchScore += 10;
        }
      });

      // カテゴリー名マッチ
      if (lower.includes(cat.name.toLowerCase())) matchScore += 5;
      if (lower.includes(cat.parent.toLowerCase())) matchScore += 3;

      if (matchScore > 0) {
        matches.push({ key, ...cat, matchScore });
      }
    });

    matches.sort((a, b) => b.matchScore - a.matchScore);
    return matches;
  }

  // ================================================================
  // 今月のトレンド商品取得
  // ================================================================
  function getCurrentTrends() {
    const month = new Date().getMonth() + 1;
    const nextMonth = month === 12 ? 1 : month + 1;

    const current = [];
    const upcoming = [];

    seasonalTrends.forEach(trend => {
      if (trend.months[month] && trend.months[month] >= 3) {
        current.push({
          ...trend,
          demand: trend.months[month],
        });
      }
      if (trend.months[nextMonth] && trend.months[nextMonth] >= 3 &&
          (!trend.months[month] || trend.months[nextMonth] > trend.months[month])) {
        upcoming.push({
          ...trend,
          demand: trend.months[nextMonth],
        });
      }
    });

    current.sort((a, b) => b.demand - a.demand);
    upcoming.sort((a, b) => b.demand - a.demand);

    return { current, upcoming };
  }

  // ================================================================
  // おすすめカテゴリーランキング
  // ================================================================
  function getCategoryRanking(sortBy = 'score') {
    const month = new Date().getMonth() + 1;

    const ranked = Object.entries(categoryDB).map(([key, cat]) => {
      // 総合スコア計算
      const marginScore = cat.avgMargin * 0.3;
      const turnoverScore = cat.turnover * 4;
      const difficultyScore = (6 - cat.difficulty) * 3;
      const competitionScore = (6 - cat.competition) * 3;

      // 季節ボーナス
      let seasonalBonus = 0;
      seasonalTrends.forEach(trend => {
        const isMatch = trend.keywords.some(kw =>
          cat.keywords.some(ck => ck.toLowerCase().includes(kw.toLowerCase()))
        );
        if (isMatch && trend.months[month]) {
          seasonalBonus = Math.max(seasonalBonus, trend.months[month] * 2);
        }
      });

      const totalScore = marginScore + turnoverScore + difficultyScore + competitionScore + seasonalBonus;

      return {
        key,
        ...cat,
        totalScore: Math.round(totalScore * 10) / 10,
        seasonalBonus,
      };
    });

    switch (sortBy) {
      case 'margin':
        ranked.sort((a, b) => b.avgMargin - a.avgMargin);
        break;
      case 'turnover':
        ranked.sort((a, b) => b.turnover - a.turnover);
        break;
      case 'easy':
        ranked.sort((a, b) => a.difficulty - b.difficulty);
        break;
      default:
        ranked.sort((a, b) => b.totalScore - a.totalScore);
        break;
    }

    return ranked;
  }

  // ================================================================
  // 一括リサーチ分析
  // ================================================================
  function analyzeResearchList(items) {
    const analyzed = items.map(item => {
      const score = scoreProduct(item);
      const route = suggestBestRoute(item.prices || {});
      const categories = matchCategories(item.name);

      return {
        ...item,
        score,
        bestRoute: route,
        matchedCategories: categories.slice(0, 3),
      };
    });

    // スコア順にソート
    analyzed.sort((a, b) => b.score.total - a.score.total);

    return analyzed;
  }

  // ================================================================
  // 利益率から仕入れ上限価格を逆算（リサーチ用）
  // ================================================================
  function calcMaxPurchasePrice(salePrice, targetMargin, platformKey) {
    // Binary search
    let low = 0;
    let high = salePrice;
    const settings = Storage.getSettings();

    for (let i = 0; i < 50; i++) {
      const mid = Math.floor((low + high) / 2);
      let platformResult;

      switch (platformKey) {
        case 'amazon':
          platformResult = Platforms.calcAmazon(salePrice, settings.amazonCategory, {
            sellerType: settings.amazonSellerType,
            useFba: settings.useFba,
            monthlyVolume: settings.monthlyVolume,
          });
          break;
        case 'mercari':
          platformResult = Platforms.calcMercari(salePrice, {
            shippingMethod: settings.mercariShipping,
          });
          break;
        case 'yahoo':
          platformResult = Platforms.calcYahooAuction(salePrice, {
            isPremium: settings.yahooPremium,
            monthlyVolume: settings.monthlyVolume,
          });
          break;
        case 'rakuma':
          platformResult = Platforms.calcRakuma(salePrice, {});
          break;
        default:
          platformResult = { totalFees: 0 };
      }

      const profit = Platforms.calculateProfit(mid, salePrice, platformResult, {
        packagingCost: settings.packagingCost,
      });

      if (profit.profitRate >= targetMargin) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return Math.max(0, low - 1);
  }

  // ================================================================
  // Public API
  // ================================================================
  return {
    categoryDB,
    seasonalTrends,
    scoreProduct,
    calcSeasonalScore,
    suggestBestRoute,
    matchCategories,
    getCurrentTrends,
    getCategoryRanking,
    analyzeResearchList,
    calcMaxPurchasePrice,
  };
})();

if (typeof module !== 'undefined') module.exports = Research;
