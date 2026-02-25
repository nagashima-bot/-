/**
 * せどり利益計算エンジン
 * 各プラットフォームの手数料・送料を正確に計算
 */

const Platforms = (() => {
  // ========== Amazon Japan ==========
  const amazonCategories = {
    'books':        { name: '本', rate: 0.15, closingFee: 80 },
    'music':        { name: 'CD・レコード', rate: 0.15, closingFee: 140 },
    'dvd':          { name: 'DVD・ブルーレイ', rate: 0.15, closingFee: 140 },
    'video_games':  { name: 'TVゲーム', rate: 0.15, closingFee: 140 },
    'pc_software':  { name: 'PCソフト', rate: 0.15, closingFee: 140 },
    'electronics':  { name: '家電・カメラ', rate: 0.10, closingFee: 0 },
    'toys':         { name: 'おもちゃ・ホビー', rate: 0.10, closingFee: 0 },
    'kitchen':      { name: 'キッチン・日用品', rate: 0.15, closingFee: 0 },
    'beauty':       { name: 'ビューティー', rate: 0.10, closingFee: 0 },
    'health':       { name: 'ドラッグストア', rate: 0.10, closingFee: 0 },
    'sports':       { name: 'スポーツ・アウトドア', rate: 0.10, closingFee: 0 },
    'car':          { name: 'カー・バイク用品', rate: 0.10, closingFee: 0 },
    'clothing':     { name: '服・シューズ', rate: 0.15, closingFee: 0 },
    'food':         { name: '食品・飲料', rate: 0.10, closingFee: 0 },
    'pet':          { name: 'ペット用品', rate: 0.15, closingFee: 0 },
    'office':       { name: '文房具・オフィス', rate: 0.15, closingFee: 0 },
    'instrument':   { name: '楽器', rate: 0.10, closingFee: 0 },
    'other':        { name: 'その他', rate: 0.15, closingFee: 0 },
  };

  // Amazon FBA 配送料 (標準サイズ)
  const amazonFbaSizes = [
    { name: '小型', maxWeight: 250,  maxDim: [25, 18, 2],   fee: 288 },
    { name: '標準1', maxWeight: 1000, maxDim: [35, 30, 3.3], fee: 381 },
    { name: '標準2', maxWeight: 2000, maxDim: [45, 35, 20],  fee: 421 },
    { name: '標準3', maxWeight: 5000, maxDim: [45, 35, 20],  fee: 467 },
    { name: '大型1', maxWeight: 10000, maxDim: [60, 50, 50], fee: 589 },
    { name: '大型2', maxWeight: 20000, maxDim: [80, 50, 50], fee: 712 },
    { name: '大型3', maxWeight: 30000, maxDim: [100, 50, 50], fee: 815 },
    { name: '特大型', maxWeight: 40000, maxDim: [200, 100, 100], fee: 975 },
  ];

  function calcAmazon(salePrice, category, options = {}) {
    const cat = amazonCategories[category] || amazonCategories['other'];
    const sellerType = options.sellerType || 'professional'; // professional or individual

    // 販売手数料
    const referralFee = Math.floor(salePrice * cat.rate);

    // カテゴリー成約料（メディア商品のみ）
    const closingFee = cat.closingFee;

    // 月額登録料（1商品あたり按分）
    // 大口: 4,900円/月 → 1商品あたりは月販売数で按分
    // 小口: 100円/商品
    const perItemFee = sellerType === 'professional'
      ? Math.ceil(4900 / (options.monthlyVolume || 30))
      : 100;

    // FBA利用料
    let fbaFee = 0;
    if (options.useFba) {
      const weight = options.weight || 500;
      const sizeIndex = options.sizeCategory || 1;
      fbaFee = amazonFbaSizes[Math.min(sizeIndex, amazonFbaSizes.length - 1)].fee;

      // FBA在庫保管手数料 (概算: 月額 1商品あたり)
      const storageFee = options.storageFee || 10;
      fbaFee += storageFee;
    }

    // 自己発送の場合の送料
    const shippingCost = options.useFba ? 0 : (options.shippingCost || 0);

    const totalFees = referralFee + closingFee + perItemFee + fbaFee + shippingCost;

    return {
      platform: 'Amazon',
      salePrice,
      referralFee,
      closingFee,
      perItemFee,
      fbaFee,
      shippingCost,
      totalFees,
      category: cat.name,
    };
  }

  // ========== メルカリ ==========
  const mercariShipping = {
    'nekopos':       { name: 'ネコポス', fee: 210, maxWeight: 1000, maxDim: '31.2×22.8×3cm, A4' },
    'yupacket':      { name: 'ゆうパケット', fee: 230, maxWeight: 1000, maxDim: '34×25×3cm' },
    'yupacket_plus': { name: 'ゆうパケットプラス', fee: 455, maxWeight: 2000, maxDim: '24×17×7cm' },
    'compact':       { name: '宅急便コンパクト', fee: 450, maxWeight: null, maxDim: '25×20×5cm (専用BOX70円)' },
    'takuhai_60':    { name: '宅急便60', fee: 750, maxWeight: 2000, maxDim: '60サイズ' },
    'takuhai_80':    { name: '宅急便80', fee: 850, maxWeight: 5000, maxDim: '80サイズ' },
    'takuhai_100':   { name: '宅急便100', fee: 1050, maxWeight: 10000, maxDim: '100サイズ' },
    'takuhai_120':   { name: '宅急便120', fee: 1200, maxWeight: 15000, maxDim: '120サイズ' },
    'takuhai_140':   { name: '宅急便140', fee: 1450, maxWeight: 20000, maxDim: '140サイズ' },
    'takuhai_160':   { name: '宅急便160', fee: 1700, maxWeight: 25000, maxDim: '160サイズ' },
    'yupacket_post': { name: 'ゆうパケットポスト', fee: 215, maxWeight: 2000, maxDim: '32.7×22.8×3cm' },
  };

  function calcMercari(salePrice, options = {}) {
    // 販売手数料: 10%
    const commissionRate = 0.10;
    const commission = Math.floor(salePrice * commissionRate);

    // 送料
    const shippingMethod = options.shippingMethod || 'nekopos';
    const shipping = mercariShipping[shippingMethod] || mercariShipping['nekopos'];
    const shippingCost = options.buyerPaysShipping ? 0 : shipping.fee;

    const totalFees = commission + shippingCost;

    return {
      platform: 'メルカリ',
      salePrice,
      commission,
      commissionRate: commissionRate * 100,
      shippingCost,
      shippingMethod: shipping.name,
      totalFees,
    };
  }

  // ========== ヤフオク ==========
  function calcYahooAuction(salePrice, options = {}) {
    // 落札システム利用料
    // Yahoo!プレミアム会員: 8.8%
    // 非会員: 10%
    const isPremium = options.isPremium !== undefined ? options.isPremium : true;
    const commissionRate = isPremium ? 0.088 : 0.10;
    const commission = Math.floor(salePrice * commissionRate);

    // 出品取消システム利用料（出品した商品に入札があった状態で取り消した場合: 550円）
    // → 通常計算には含めない

    // Yahoo!プレミアム会費: 508円/月 (按分)
    const premiumFee = isPremium
      ? Math.ceil(508 / (options.monthlyVolume || 10))
      : 0;

    // 送料（出品者負担の場合）
    let shippingCost = 0;
    if (!options.buyerPaysShipping) {
      shippingCost = options.shippingCost || 0;
    }

    const totalFees = commission + premiumFee + shippingCost;

    return {
      platform: 'ヤフオク',
      salePrice,
      commission,
      commissionRate: commissionRate * 100,
      premiumFee,
      isPremium,
      shippingCost,
      totalFees,
    };
  }

  // ========== 楽天ラクマ（仕入れ先参考用） ==========
  function calcRakuma(salePrice, options = {}) {
    // 販売手数料: 6% (2024年時点で6%に引き下げ)
    const commissionRate = 0.06;
    const commission = Math.floor(salePrice * commissionRate);

    const shippingCost = options.shippingCost || 0;
    const totalFees = commission + shippingCost;

    return {
      platform: 'ラクマ',
      salePrice,
      commission,
      commissionRate: commissionRate * 100,
      shippingCost,
      totalFees,
    };
  }

  // ========== 仕入れ先情報 ==========
  const purchaseSources = {
    'amazon': {
      name: 'Amazon',
      icon: '📦',
      tips: 'タイムセール・アウトレット・ポイント還元を活用',
    },
    'mercari': {
      name: 'メルカリ',
      icon: '🔴',
      tips: '値下げ交渉・まとめ買い割引を活用',
    },
    'yahoo_auction': {
      name: 'ヤフオク',
      icon: '🔨',
      tips: '終了間際の入札・まとめ出品を狙う',
    },
    'rakuten': {
      name: '楽天市場',
      icon: '🏪',
      tips: 'お買い物マラソン・SPU・クーポン併用',
    },
    'store': {
      name: '実店舗',
      icon: '🏬',
      tips: 'ワゴンセール・決算セール・閉店セール',
    },
    'other': {
      name: 'その他',
      icon: '📋',
      tips: '',
    },
  };

  // ========== 利益計算（総合） ==========
  function calculateProfit(purchasePrice, salePrice, platformResult, options = {}) {
    const totalFees = platformResult.totalFees;

    // 仕入れ時のポイント還元
    const pointsBack = options.pointsBack || 0;
    const effectivePurchasePrice = purchasePrice - pointsBack;

    // 梱包資材費
    const packagingCost = options.packagingCost || 30;

    // 利益計算
    const grossProfit = salePrice - effectivePurchasePrice;
    const netProfit = salePrice - effectivePurchasePrice - totalFees - packagingCost;
    const profitRate = salePrice > 0 ? (netProfit / salePrice * 100) : 0;
    const roi = effectivePurchasePrice > 0 ? (netProfit / effectivePurchasePrice * 100) : 0;

    return {
      purchasePrice,
      effectivePurchasePrice,
      salePrice,
      grossProfit,
      totalFees,
      packagingCost,
      netProfit,
      profitRate: Math.round(profitRate * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      pointsBack,
    };
  }

  // ========== 全販路一括比較 ==========
  function compareAll(purchasePrice, salePrice, options = {}) {
    const results = [];

    // Amazon
    const amazonResult = calcAmazon(salePrice, options.amazonCategory || 'other', {
      sellerType: options.amazonSellerType || 'professional',
      useFba: options.useFba || false,
      monthlyVolume: options.monthlyVolume || 30,
      shippingCost: options.amazonShipping || 0,
      sizeCategory: options.sizeCategory || 1,
    });
    const amazonProfit = calculateProfit(purchasePrice, salePrice, amazonResult, options);
    results.push({ ...amazonResult, ...amazonProfit, platformKey: 'amazon' });

    // メルカリ
    const mercariResult = calcMercari(salePrice, {
      shippingMethod: options.mercariShipping || 'nekopos',
      buyerPaysShipping: false,
    });
    const mercariProfit = calculateProfit(purchasePrice, salePrice, mercariResult, options);
    results.push({ ...mercariResult, ...mercariProfit, platformKey: 'mercari' });

    // ヤフオク
    const yahooResult = calcYahooAuction(salePrice, {
      isPremium: options.yahooPremium !== undefined ? options.yahooPremium : true,
      monthlyVolume: options.monthlyVolume || 10,
      shippingCost: options.yahooShipping || 0,
      buyerPaysShipping: options.yahooBuyerPaysShipping || false,
    });
    const yahooProfit = calculateProfit(purchasePrice, salePrice, yahooResult, options);
    results.push({ ...yahooResult, ...yahooProfit, platformKey: 'yahoo' });

    // ラクマ
    const rakumaResult = calcRakuma(salePrice, {
      shippingCost: options.rakumaShipping || 0,
    });
    const rakumaProfit = calculateProfit(purchasePrice, salePrice, rakumaResult, options);
    results.push({ ...rakumaResult, ...rakumaProfit, platformKey: 'rakuma' });

    // 利益順にソート
    results.sort((a, b) => b.netProfit - a.netProfit);

    return results;
  }

  // ========== 最適販売価格の逆算 ==========
  function calcMinSalePrice(purchasePrice, targetProfitRate, platformKey, options = {}) {
    // 目標利益率を達成するための最低販売価格を計算
    // netProfit / salePrice = targetProfitRate / 100
    // (salePrice - purchasePrice - fees - packaging) / salePrice = targetProfitRate / 100
    // Binary search for the right price
    let low = purchasePrice;
    let high = purchasePrice * 5;
    const packaging = options.packagingCost || 30;
    const pointsBack = options.pointsBack || 0;

    for (let i = 0; i < 50; i++) {
      const mid = Math.floor((low + high) / 2);
      let result;
      switch (platformKey) {
        case 'amazon':
          result = calcAmazon(mid, options.amazonCategory || 'other', options);
          break;
        case 'mercari':
          result = calcMercari(mid, options);
          break;
        case 'yahoo':
          result = calcYahooAuction(mid, options);
          break;
        case 'rakuma':
          result = calcRakuma(mid, options);
          break;
        default:
          result = { totalFees: 0 };
      }

      const effectivePurchase = purchasePrice - pointsBack;
      const netProfit = mid - effectivePurchase - result.totalFees - packaging;
      const rate = mid > 0 ? (netProfit / mid * 100) : 0;

      if (rate < targetProfitRate) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return high;
  }

  return {
    amazonCategories,
    amazonFbaSizes,
    mercariShipping,
    purchaseSources,
    calcAmazon,
    calcMercari,
    calcYahooAuction,
    calcRakuma,
    calculateProfit,
    compareAll,
    calcMinSalePrice,
  };
})();

if (typeof module !== 'undefined') module.exports = Platforms;
