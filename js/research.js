/**
 * せどりプロ - 自動リサーチエンジン
 * AIが自動で売れ筋商品をリサーチし、利益シミュレーションまで全自動で実行
 */
const Research = (() => {

  // ================================================================
  // カテゴリーデータベース
  // ================================================================
  const categoryDB = {
    'books': { name: '本・参考書', icon: '📚' },
    'games': { name: 'ゲーム', icon: '🎮' },
    'trading_card': { name: 'トレーディングカード', icon: '🃏' },
    'figure': { name: 'フィギュア・ホビー', icon: '🎭' },
    'electronics': { name: '家電・ガジェット', icon: '📱' },
    'fashion': { name: 'ファッション', icon: '👟' },
    'cosme': { name: 'コスメ・美容', icon: '💄' },
    'toys': { name: 'おもちゃ・LEGO', icon: '🧸' },
    'outdoor': { name: 'アウトドア', icon: '⛺' },
    'daily': { name: '日用品・食品', icon: '🏠' },
  };

  // ================================================================
  // 商品データベース（全自動リサーチ用）
  // 実際のせどりで利益が出やすい商品を網羅
  // buyPrice: 想定仕入れ価格, sellPrice: 想定販売価格
  // ================================================================
  const productDB = [
    // ===== 本・参考書 =====
    { id: 'p001', name: '医学書院 標準解剖学 第4版', category: 'books', buyPrice: 2800, sellPrice: 6500, bestBuy: 'mercari', bestSell: 'amazon', turnover: 3, competition: 2, difficulty: 1, seasonalKeywords: ['入学', '新学期'], tip: '医学生必須テキスト。年度始めに需要急増。状態良好品を狙う。' },
    { id: 'p002', name: '薬がみえる vol.1-4 セット', category: 'books', buyPrice: 4500, sellPrice: 9800, bestBuy: 'mercari', bestSell: 'amazon', turnover: 4, competition: 2, difficulty: 1, seasonalKeywords: ['入学', '新学期'], tip: '薬学生のバイブル。セット販売で単品より高利益。' },
    { id: 'p003', name: '公認会計士 短答式 過去問題集', category: 'books', buyPrice: 1200, sellPrice: 3800, bestBuy: 'yahoo_auction', bestSell: 'amazon', turnover: 3, competition: 2, difficulty: 1, seasonalKeywords: ['入学'], tip: '毎年版が変わるが旧版でも需要あり。試験直前に価格上昇。' },
    { id: 'p004', name: '司法試験 判例百選シリーズ 全巻', category: 'books', buyPrice: 5000, sellPrice: 12000, bestBuy: 'mercari', bestSell: 'amazon', turnover: 3, competition: 1, difficulty: 1, seasonalKeywords: [], tip: '法学部生の必需品。全巻セットはプレミア。' },
    { id: 'p005', name: '絶版 建築設計資料集成', category: 'books', buyPrice: 3000, sellPrice: 8500, bestBuy: 'yahoo_auction', bestSell: 'amazon', turnover: 2, competition: 1, difficulty: 2, seasonalKeywords: [], tip: '絶版のため安定して高値。建築学科の定番。' },
    { id: 'p006', name: 'TOEIC 公式問題集 最新版', category: 'books', buyPrice: 1500, sellPrice: 2800, bestBuy: 'rakuten', bestSell: 'mercari', turnover: 5, competition: 3, difficulty: 1, seasonalKeywords: ['入学'], tip: '回転率が高く初心者向け。新版が出るタイミングで旧版を安く仕入れ。' },

    // ===== ゲーム =====
    { id: 'p010', name: 'SFC スーパーメトロイド 箱説付き', category: 'games', buyPrice: 3500, sellPrice: 8000, bestBuy: 'store', bestSell: 'amazon', turnover: 3, competition: 3, difficulty: 3, seasonalKeywords: [], tip: '海外需要も高い名作。箱・説明書付きは2〜3倍。' },
    { id: 'p011', name: 'PS1 クロノ・クロス 帯付き美品', category: 'games', buyPrice: 2000, sellPrice: 5500, bestBuy: 'store', bestSell: 'mercari', turnover: 3, competition: 2, difficulty: 2, seasonalKeywords: [], tip: 'スクウェア名作。リマスター発売で原作需要上昇。' },
    { id: 'p012', name: 'Nintendo Switch 有機ELモデル（中古美品）', category: 'games', buyPrice: 28000, sellPrice: 35000, bestBuy: 'store', bestSell: 'mercari', turnover: 5, competition: 4, difficulty: 2, seasonalKeywords: ['クリスマス', 'ボーナス'], tip: '年末商戦で需要ピーク。付属品完備が高値の条件。' },
    { id: 'p013', name: 'ゼルダの伝説 ティアーズオブキングダム CE', category: 'games', buyPrice: 8000, sellPrice: 14000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 3, competition: 3, difficulty: 3, seasonalKeywords: ['ゲーム'], tip: 'コレクターズエディション。未開封品はプレミア確実。' },
    { id: 'p014', name: 'GBA ファイアーエムブレム 封印の剣', category: 'games', buyPrice: 2500, sellPrice: 6000, bestBuy: 'store', bestSell: 'amazon', turnover: 3, competition: 2, difficulty: 2, seasonalKeywords: [], tip: 'GBAのFEシリーズは安定高値。ソフト単体でもOK。' },
    { id: 'p015', name: 'PS5 ファイナルファンタジーVII リバース', category: 'games', buyPrice: 4500, sellPrice: 6800, bestBuy: 'amazon', bestSell: 'mercari', turnover: 4, competition: 4, difficulty: 1, seasonalKeywords: ['ゲーム'], tip: 'セール時に仕入れ→定価付近で売却。限定版が狙い目。' },

    // ===== トレーディングカード =====
    { id: 'p020', name: 'ポケモンカード 151 未開封BOX', category: 'trading_card', buyPrice: 7500, sellPrice: 14000, bestBuy: 'store', bestSell: 'mercari', turnover: 5, competition: 5, difficulty: 4, seasonalKeywords: [], tip: '入手困難BOXはプレミア化。コンビニ・ポケセン巡回がカギ。' },
    { id: 'p021', name: '遊戯王 レアリティコレクション 未開封BOX', category: 'trading_card', buyPrice: 5500, sellPrice: 10000, bestBuy: 'store', bestSell: 'yahoo_auction', turnover: 5, competition: 4, difficulty: 3, seasonalKeywords: [], tip: 'レアコレは毎回プレミア化。予約段階で仕入れ。' },
    { id: 'p022', name: 'ワンピースカード 新時代の主役 BOX', category: 'trading_card', buyPrice: 5000, sellPrice: 9000, bestBuy: 'store', bestSell: 'mercari', turnover: 5, competition: 4, difficulty: 3, seasonalKeywords: [], tip: 'ワンピースカードは急成長市場。パラレルが高額。' },
    { id: 'p023', name: 'ポケカ リーリエSR 美品', category: 'trading_card', buyPrice: 15000, sellPrice: 35000, bestBuy: 'yahoo_auction', bestSell: 'mercari', turnover: 3, competition: 3, difficulty: 4, seasonalKeywords: [], tip: '高額カード単品はPSA鑑定で更に価値上昇。真贋に注意。' },
    { id: 'p024', name: 'ポケモンカード クレイバースト BOX', category: 'trading_card', buyPrice: 6000, sellPrice: 11000, bestBuy: 'store', bestSell: 'mercari', turnover: 5, competition: 5, difficulty: 4, seasonalKeywords: [], tip: 'ナンジャモSARが封入。人気キャラ封入BOXは鉄板。' },

    // ===== フィギュア・ホビー =====
    { id: 'p030', name: '一番くじ ドラゴンボール A賞 フィギュア', category: 'figure', buyPrice: 800, sellPrice: 4500, bestBuy: 'store', bestSell: 'mercari', turnover: 4, competition: 3, difficulty: 2, seasonalKeywords: [], tip: '一番くじのA賞は即プレミア化。コンビニ巡回で入手。' },
    { id: 'p031', name: 'ねんどろいど 初音ミク 雪ミク2024', category: 'figure', buyPrice: 4500, sellPrice: 8000, bestBuy: 'store', bestSell: 'amazon', turnover: 3, competition: 2, difficulty: 2, seasonalKeywords: ['クリスマス'], tip: '限定ねんどろいどは安定プレミア。未開封品が鍵。' },
    { id: 'p032', name: 'S.H.Figuarts ドラゴンボール 孫悟空', category: 'figure', buyPrice: 5000, sellPrice: 9500, bestBuy: 'amazon', bestSell: 'mercari', turnover: 3, competition: 3, difficulty: 2, seasonalKeywords: [], tip: 'バンダイ魂ウェブ限定品は入手困難で高利益。' },
    { id: 'p033', name: 'PG ガンプラ ユニコーンガンダム', category: 'figure', buyPrice: 12000, sellPrice: 22000, bestBuy: 'rakuten', bestSell: 'amazon', turnover: 2, competition: 2, difficulty: 2, seasonalKeywords: [], tip: 'PGシリーズは高単価高利益。バンダイ再販タイミングで仕入れ。' },
    { id: 'p034', name: 'MG ガンプラ Hi-νガンダム Ver.Ka', category: 'figure', buyPrice: 5500, sellPrice: 9000, bestBuy: 'store', bestSell: 'amazon', turnover: 3, competition: 3, difficulty: 2, seasonalKeywords: [], tip: 'Ver.Kaシリーズは品薄になりやすい。再販情報をチェック。' },

    // ===== 家電・ガジェット =====
    { id: 'p040', name: 'AirPods Pro 第2世代（整備済製品）', category: 'electronics', buyPrice: 22000, sellPrice: 30000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 5, competition: 4, difficulty: 2, seasonalKeywords: ['ボーナス', 'クリスマス'], tip: 'Apple整備済製品は新品同様でお得。セール時に仕入れ。' },
    { id: 'p041', name: 'Anker Soundcore Liberty 4', category: 'electronics', buyPrice: 8000, sellPrice: 12000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 4, competition: 3, difficulty: 1, seasonalKeywords: [], tip: 'Amazonタイムセールで大幅値下げ時が仕入れチャンス。' },
    { id: 'p042', name: 'リファ ビューテック ドライヤー', category: 'electronics', buyPrice: 25000, sellPrice: 35000, bestBuy: 'rakuten', bestSell: 'mercari', turnover: 4, competition: 3, difficulty: 2, seasonalKeywords: ['クリスマス', 'ボーナス'], tip: '楽天スーパーSALEで仕入れ→メルカリ販売が王道。' },
    { id: 'p043', name: 'パナソニック ナノケア EH-NA0J', category: 'electronics', buyPrice: 22000, sellPrice: 32000, bestBuy: 'rakuten', bestSell: 'amazon', turnover: 4, competition: 3, difficulty: 1, seasonalKeywords: ['クリスマス'], tip: '美容家電の王道。型落ちモデルでも需要安定。' },
    { id: 'p044', name: 'Canon EF 50mm F1.8 STM（中古美品）', category: 'electronics', buyPrice: 8000, sellPrice: 14000, bestBuy: 'yahoo_auction', bestSell: 'mercari', turnover: 3, competition: 2, difficulty: 2, seasonalKeywords: [], tip: '撒き餌レンズとして永続的需要。状態重視で仕入れ。' },
    { id: 'p045', name: 'Sony WH-1000XM5 ヘッドホン', category: 'electronics', buyPrice: 28000, sellPrice: 38000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 4, competition: 3, difficulty: 2, seasonalKeywords: ['ボーナス'], tip: 'ノイキャン最高峰。新型発表で旧型がセール→プレミアの流れ。' },

    // ===== ファッション =====
    { id: 'p050', name: 'Supreme BOXロゴ Tシャツ', category: 'fashion', buyPrice: 12000, sellPrice: 25000, bestBuy: 'store', bestSell: 'mercari', turnover: 3, competition: 4, difficulty: 4, seasonalKeywords: [], tip: 'オンライン抽選が仕入れ。BOXロゴは安定プレミア。真贋注意。' },
    { id: 'p051', name: 'Nike Dunk Low レトロ（人気カラー）', category: 'fashion', buyPrice: 12000, sellPrice: 20000, bestBuy: 'store', bestSell: 'mercari', turnover: 4, competition: 4, difficulty: 3, seasonalKeywords: [], tip: 'SNKRS抽選が主な仕入れ先。パンダカラーは安定需要。' },
    { id: 'p052', name: 'THE NORTH FACE バルトロライトジャケット', category: 'fashion', buyPrice: 35000, sellPrice: 55000, bestBuy: 'store', bestSell: 'mercari', turnover: 3, competition: 4, difficulty: 4, seasonalKeywords: ['暖房', 'クリスマス'], tip: '毎年争奪戦。秋口に定価購入→冬にプレミア販売。' },
    { id: 'p053', name: 'New Balance 990v6 グレー', category: 'fashion', buyPrice: 25000, sellPrice: 35000, bestBuy: 'store', bestSell: 'mercari', turnover: 3, competition: 3, difficulty: 3, seasonalKeywords: [], tip: '品薄カラー・サイズは確実にプレミア化。' },
    { id: 'p054', name: 'adidas SAMBA OG（定番カラー）', category: 'fashion', buyPrice: 12000, sellPrice: 18000, bestBuy: 'store', bestSell: 'mercari', turnover: 4, competition: 3, difficulty: 2, seasonalKeywords: [], tip: '近年のトレンドで在庫切れ続出。ABC-MARTなどで入手。' },

    // ===== コスメ・美容 =====
    { id: 'p060', name: 'CHANEL クリスマスコフレ 2025', category: 'cosme', buyPrice: 9000, sellPrice: 18000, bestBuy: 'store', bestSell: 'mercari', turnover: 5, competition: 4, difficulty: 3, seasonalKeywords: ['クリスマス', 'コフレ'], tip: '発売日に百貨店で購入→即プレミア。並び必須。' },
    { id: 'p061', name: 'Dior アディクト リップマキシマイザー 限定色', category: 'cosme', buyPrice: 4200, sellPrice: 7500, bestBuy: 'store', bestSell: 'mercari', turnover: 5, competition: 3, difficulty: 2, seasonalKeywords: [], tip: '限定色は即完売→メルカリでプレミア販売。' },
    { id: 'p062', name: '韓国コスメ rom&nd ジューシーラスティングティント セット', category: 'cosme', buyPrice: 2000, sellPrice: 4500, bestBuy: 'rakuten', bestSell: 'mercari', turnover: 5, competition: 3, difficulty: 1, seasonalKeywords: [], tip: 'SNSでバズった色は瞬間的に需要急増。Qoo10で安く仕入れ。' },
    { id: 'p063', name: 'SK-II フェイシャルトリートメントエッセンス 230ml', category: 'cosme', buyPrice: 15000, sellPrice: 22000, bestBuy: 'rakuten', bestSell: 'amazon', turnover: 4, competition: 3, difficulty: 2, seasonalKeywords: ['ボーナス'], tip: '楽天スーパーSALE+ポイント込みで大幅利益。' },
    { id: 'p064', name: 'LANEIGE リップスリーピングマスク', category: 'cosme', buyPrice: 800, sellPrice: 2200, bestBuy: 'rakuten', bestSell: 'mercari', turnover: 5, competition: 3, difficulty: 1, seasonalKeywords: [], tip: 'TikTokで話題。低単価だがまとめ買いで利益確保。' },

    // ===== おもちゃ・LEGO =====
    { id: 'p070', name: 'LEGO スターウォーズ ミレニアムファルコン 75375', category: 'toys', buyPrice: 18000, sellPrice: 28000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 3, competition: 3, difficulty: 2, seasonalKeywords: ['クリスマス'], tip: '廃盤予定のSWセットは確実にプレミア化。' },
    { id: 'p071', name: 'LEGO アイデア 赤ひげ船長の海賊島 21322（廃盤）', category: 'toys', buyPrice: 25000, sellPrice: 45000, bestBuy: 'yahoo_auction', bestSell: 'amazon', turnover: 2, competition: 2, difficulty: 3, seasonalKeywords: [], tip: '廃盤LEGOは年々価格上昇。未開封品は投資対象。' },
    { id: 'p072', name: 'たまごっちスマート 限定カラー', category: 'toys', buyPrice: 3500, sellPrice: 7000, bestBuy: 'store', bestSell: 'mercari', turnover: 3, competition: 2, difficulty: 2, seasonalKeywords: ['クリスマス'], tip: '限定カラーは完売後にプレミア化。玩具店巡回で入手。' },
    { id: 'p073', name: 'シルバニアファミリー 赤い屋根の大きなお家', category: 'toys', buyPrice: 5500, sellPrice: 8000, bestBuy: 'rakuten', bestSell: 'amazon', turnover: 4, competition: 2, difficulty: 1, seasonalKeywords: ['クリスマス'], tip: 'クリスマス前に需要急増。楽天SALE時に仕入れ。' },
    { id: 'p074', name: 'プラレール 新幹線 はやぶさ スペシャルセット', category: 'toys', buyPrice: 4000, sellPrice: 7000, bestBuy: 'store', bestSell: 'amazon', turnover: 4, competition: 2, difficulty: 1, seasonalKeywords: ['クリスマス'], tip: '限定セットは毎年プレミア。トイザらス限定が狙い目。' },

    // ===== アウトドア =====
    { id: 'p080', name: 'スノーピーク チタンマグ 450', category: 'outdoor', buyPrice: 3500, sellPrice: 5800, bestBuy: 'store', bestSell: 'mercari', turnover: 3, competition: 2, difficulty: 2, seasonalKeywords: ['GW', 'アウトドア'], tip: '限定デザインは即完売。スノーピーク直営店で入手。' },
    { id: 'p081', name: 'Coleman タフスクリーン2ルームハウス MDX+', category: 'outdoor', buyPrice: 45000, sellPrice: 65000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 3, competition: 2, difficulty: 2, seasonalKeywords: ['GW', 'アウトドア', '夏物'], tip: 'GW前に需要ピーク。Amazonセールで仕入れ。' },
    { id: 'p082', name: 'YETI ランブラー 26oz 限定カラー', category: 'outdoor', buyPrice: 5500, sellPrice: 9500, bestBuy: 'store', bestSell: 'mercari', turnover: 3, competition: 2, difficulty: 2, seasonalKeywords: ['夏物'], tip: '限定カラーは海外でも人気。正規品証明が重要。' },

    // ===== 日用品・食品 =====
    { id: 'p090', name: 'マイプロテイン Impact ホエイ 5kg セール品', category: 'daily', buyPrice: 5000, sellPrice: 8500, bestBuy: 'rakuten', bestSell: 'amazon', turnover: 5, competition: 3, difficulty: 1, seasonalKeywords: [], tip: 'ゾロ目セールで最安値仕入れ。定番フレーバーが安定。' },
    { id: 'p091', name: 'パンパース さらさらケア テープ Sサイズ 箱買い', category: 'daily', buyPrice: 3800, sellPrice: 5500, bestBuy: 'rakuten', bestSell: 'amazon', turnover: 5, competition: 3, difficulty: 1, seasonalKeywords: [], tip: 'リピート商品の王道。楽天お買い物マラソンで仕入れ。' },
    { id: 'p092', name: '明治 ほほえみ らくらくキューブ 大箱', category: 'daily', buyPrice: 3500, sellPrice: 5000, bestBuy: 'rakuten', bestSell: 'amazon', turnover: 5, competition: 3, difficulty: 1, seasonalKeywords: [], tip: 'ミルクは安定需要。まとめ買い割引で利益確保。' },
    { id: 'p093', name: 'コストコ オキシクリーン 5.26kg', category: 'daily', buyPrice: 1800, sellPrice: 3500, bestBuy: 'store', bestSell: 'mercari', turnover: 5, competition: 3, difficulty: 1, seasonalKeywords: [], tip: 'コストコ会員限定商品は非会員への需要あり。' },

    // ===== 季節もの =====
    { id: 'p100', name: 'ダイソン Pure Hot+Cool HP07', category: 'electronics', buyPrice: 45000, sellPrice: 62000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 3, competition: 3, difficulty: 2, seasonalKeywords: ['暖房', '花粉'], tip: '空気清浄機+暖房の2WAY需要。秋口に仕入れ。' },
    { id: 'p101', name: 'シャープ 加湿空気清浄機 KC-P50', category: 'electronics', buyPrice: 15000, sellPrice: 25000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 4, competition: 3, difficulty: 1, seasonalKeywords: ['暖房', '花粉'], tip: '冬〜春の花粉シーズンに需要ピーク。' },
    { id: 'p102', name: 'アイリスオーヤマ セラミックヒーター', category: 'electronics', buyPrice: 4000, sellPrice: 7500, bestBuy: 'amazon', bestSell: 'mercari', turnover: 4, competition: 3, difficulty: 1, seasonalKeywords: ['暖房'], tip: '10月に仕入れ→12月がピーク。型番違いに注意。' },
    { id: 'p103', name: 'クリスマスツリー 180cm LED付き', category: 'toys', buyPrice: 3000, sellPrice: 7000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 3, competition: 2, difficulty: 1, seasonalKeywords: ['クリスマス', 'ツリー'], tip: '9月から仕込み。11月後半〜12月中旬がピーク。' },
    { id: 'p104', name: 'カシオ 電子辞書 XD-SX4900', category: 'electronics', buyPrice: 18000, sellPrice: 28000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 4, competition: 2, difficulty: 1, seasonalKeywords: ['入学', '新学期'], tip: '入学シーズンに需要急増。1〜3月が売り時。' },
    { id: 'p105', name: 'バレンタイン ゴディバ限定アソートメント', category: 'cosme', buyPrice: 3000, sellPrice: 5500, bestBuy: 'store', bestSell: 'mercari', turnover: 5, competition: 3, difficulty: 2, seasonalKeywords: ['バレンタイン'], tip: '百貨店限定品は即完売→プレミア。1月中に仕入れ。' },
    { id: 'p106', name: 'コールマン アウトドアワゴン', category: 'outdoor', buyPrice: 7000, sellPrice: 11000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 4, competition: 3, difficulty: 1, seasonalKeywords: ['GW', 'アウトドア', '夏物'], tip: 'アウトドアシーズン前に需要増。色違い限定モデルが狙い目。' },

    // ===== 追加商品 =====
    { id: 'p110', name: 'Apple Watch SE 第2世代 40mm', category: 'electronics', buyPrice: 28000, sellPrice: 36000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 4, competition: 4, difficulty: 2, seasonalKeywords: ['ボーナス', 'クリスマス'], tip: 'Apple新製品発表時に旧モデルがセール→仕入れチャンス。' },
    { id: 'p111', name: 'iPad 第10世代 64GB', category: 'electronics', buyPrice: 45000, sellPrice: 55000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 4, competition: 4, difficulty: 2, seasonalKeywords: ['入学', 'ボーナス'], tip: '学割＋ポイント還元で実質安く仕入れ可能。' },
    { id: 'p112', name: 'ポケモンカード VSTARユニバース BOX', category: 'trading_card', buyPrice: 7500, sellPrice: 13000, bestBuy: 'store', bestSell: 'mercari', turnover: 5, competition: 5, difficulty: 4, seasonalKeywords: [], tip: 'AR9枚セットが人気。再販タイミングで仕入れ。' },
    { id: 'p113', name: 'figma 進撃の巨人 リヴァイ', category: 'figure', buyPrice: 6000, sellPrice: 12000, bestBuy: 'yahoo_auction', bestSell: 'amazon', turnover: 3, competition: 2, difficulty: 2, seasonalKeywords: [], tip: '人気キャラのfigmaは廃盤後に高騰。' },
    { id: 'p114', name: 'LEGO テクニック ランボルギーニ シアン', category: 'toys', buyPrice: 40000, sellPrice: 65000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 2, competition: 2, difficulty: 2, seasonalKeywords: [], tip: '廃盤テクニックは投資対象。年10%以上の値上がり。' },
    { id: 'p115', name: 'Nikon Z fc ボディ', category: 'electronics', buyPrice: 95000, sellPrice: 125000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 3, competition: 2, difficulty: 3, seasonalKeywords: [], tip: 'レトロデザインカメラは品薄→プレミア。限定色が狙い目。' },
    { id: 'p116', name: 'ヨギボー Max（大型ビーズクッション）', category: 'daily', buyPrice: 20000, sellPrice: 30000, bestBuy: 'store', bestSell: 'mercari', turnover: 3, competition: 2, difficulty: 2, seasonalKeywords: [], tip: 'セール時に仕入れ。配送コストに注意。' },
    { id: 'p117', name: '鬼滅の刃 全巻セット 1-23巻', category: 'books', buyPrice: 4000, sellPrice: 8500, bestBuy: 'mercari', bestSell: 'amazon', turnover: 4, competition: 3, difficulty: 1, seasonalKeywords: [], tip: '完結済み人気漫画は全巻セットに安定需要。' },
    { id: 'p118', name: 'DJI Osmo Action 4', category: 'electronics', buyPrice: 35000, sellPrice: 48000, bestBuy: 'amazon', bestSell: 'mercari', turnover: 3, competition: 2, difficulty: 2, seasonalKeywords: ['GW', '夏物'], tip: 'アクションカメラは旅行・アウトドアシーズン前に需要増。' },
    { id: 'p119', name: 'バンダイ たまごっちユニ 限定セット', category: 'toys', buyPrice: 5500, sellPrice: 9000, bestBuy: 'store', bestSell: 'mercari', turnover: 4, competition: 2, difficulty: 2, seasonalKeywords: ['クリスマス'], tip: '限定カラーは即完売→メルカリでプレミア。' },

    // ===== 中国仕入れ（アリババ/AliExpress） =====
    { id: 'p200', name: 'ワイヤレスイヤホン OEM品（AirPods互換）', category: 'electronics', buyPrice: 500, sellPrice: 2500, bestBuy: 'aliexpress', bestSell: 'mercari', turnover: 5, competition: 4, difficulty: 2, seasonalKeywords: [], tip: 'AliExpressで大量仕入れ。パッケージを工夫して差別化。送料込み原価に注意。', isImport: true },
    { id: 'p201', name: 'スマホケース 手帳型（iPhone/Galaxy対応）', category: 'electronics', buyPrice: 150, sellPrice: 1200, bestBuy: 'alibaba', bestSell: 'mercari', turnover: 5, competition: 5, difficulty: 1, seasonalKeywords: [], tip: '1688で50個〜ロット仕入れ。多品種展開で回転率アップ。', isImport: true },
    { id: 'p202', name: 'LED投影プラネタリウム ライト', category: 'electronics', buyPrice: 800, sellPrice: 3500, bestBuy: 'aliexpress', bestSell: 'mercari', turnover: 4, competition: 3, difficulty: 1, seasonalKeywords: ['クリスマス'], tip: 'SNS映え商品。クリスマス前に需要急増。動画付きで出品がコツ。', isImport: true },
    { id: 'p203', name: 'ネイルアートキット ジェルネイルセット', category: 'cosme', buyPrice: 600, sellPrice: 3000, bestBuy: 'alibaba', bestSell: 'mercari', turnover: 4, competition: 3, difficulty: 1, seasonalKeywords: [], tip: 'セット販売で高利益。初心者向けキットが人気。', isImport: true },
    { id: 'p204', name: 'ペット用 自動給水器 フィルター付き', category: 'daily', buyPrice: 700, sellPrice: 3000, bestBuy: 'aliexpress', bestSell: 'amazon', turnover: 4, competition: 3, difficulty: 1, seasonalKeywords: ['夏物'], tip: 'ペット用品は安定需要。Amazon FBAで販売がベスト。', isImport: true },
    { id: 'p205', name: '車載ワイヤレス充電器 マグネット式', category: 'electronics', buyPrice: 400, sellPrice: 2200, bestBuy: 'alibaba', bestSell: 'amazon', turnover: 4, competition: 3, difficulty: 2, seasonalKeywords: [], tip: '1688で安く仕入れ。自社ブランド化（OEM）で競合と差別化。', isImport: true },
    { id: 'p206', name: 'ミニプロジェクター 家庭用', category: 'electronics', buyPrice: 3000, sellPrice: 9000, bestBuy: 'aliexpress', bestSell: 'amazon', turnover: 3, competition: 3, difficulty: 2, seasonalKeywords: ['クリスマス'], tip: '技適マークの確認必須。日本語説明書を用意すると高評価。', isImport: true },
    { id: 'p207', name: 'シリコン製キッチン調理器具セット', category: 'daily', buyPrice: 400, sellPrice: 2500, bestBuy: 'alibaba', bestSell: 'mercari', turnover: 4, competition: 3, difficulty: 1, seasonalKeywords: [], tip: 'カラフルなセット品が人気。食品衛生法対応品を選ぶこと。', isImport: true },
    { id: 'p208', name: 'アクションカメラ 4K 防水ケース付き', category: 'electronics', buyPrice: 2500, sellPrice: 7000, bestBuy: 'aliexpress', bestSell: 'amazon', turnover: 3, competition: 3, difficulty: 2, seasonalKeywords: ['GW', '夏物', 'アウトドア'], tip: 'GoPro互換品。アクセサリーセットで付加価値をつける。', isImport: true },
    { id: 'p209', name: 'LEDテープライト RGB リモコン付き', category: 'electronics', buyPrice: 300, sellPrice: 1800, bestBuy: 'alibaba', bestSell: 'mercari', turnover: 5, competition: 4, difficulty: 1, seasonalKeywords: ['クリスマス'], tip: 'SNSで人気の部屋装飾。長さバリエーションで展開。', isImport: true },
    { id: 'p210', name: 'ヨガマット TPE素材 6mm', category: 'outdoor', buyPrice: 500, sellPrice: 2500, bestBuy: 'alibaba', bestSell: 'amazon', turnover: 4, competition: 3, difficulty: 1, seasonalKeywords: [], tip: 'TPE素材は高級感あり。ケース付きセットで差別化。', isImport: true },
    { id: 'p211', name: 'メイクブラシセット 12本入り ケース付き', category: 'cosme', buyPrice: 400, sellPrice: 2200, bestBuy: 'alibaba', bestSell: 'mercari', turnover: 4, competition: 3, difficulty: 1, seasonalKeywords: [], tip: 'ケース付きセットが人気。ピンクゴールドなど高見えカラーを選ぶ。', isImport: true },
    { id: 'p212', name: 'キッズ知育玩具 モンテッソーリ木製パズル', category: 'toys', buyPrice: 300, sellPrice: 1800, bestBuy: 'alibaba', bestSell: 'mercari', turnover: 4, competition: 2, difficulty: 1, seasonalKeywords: ['クリスマス'], tip: '知育系は親御さんに人気。安全認証（CE/ST）マーク付きを選ぶ。', isImport: true },
  ];

  // ================================================================
  // 季節トレンドデータベース
  // ================================================================
  const seasonalTrends = [
    { name: 'クリスマス関連', keywords: ['クリスマス', 'コフレ', 'アドベント', 'ツリー', 'イルミネーション'], months: { 10: 2, 11: 4, 12: 5, 1: 1 }, tip: '10月から仕込み開始、11〜12月がピーク。1月は一気に値崩れ。' },
    { name: 'バレンタイン', keywords: ['バレンタイン', 'チョコ', 'ゴディバ'], months: { 1: 3, 2: 5 }, tip: '1月中旬から需要増。限定パッケージが狙い目。' },
    { name: '新学期・入学', keywords: ['入学', 'ランドセル', '文房具', '辞書', '電子辞書', '制服', '新学期'], months: { 1: 2, 2: 4, 3: 5, 4: 3 }, tip: '2〜3月がピーク。電子辞書・参考書が売れる。' },
    { name: '花粉症対策', keywords: ['花粉', '空気清浄機', 'マスク', '花粉症'], months: { 1: 2, 2: 4, 3: 5, 4: 4, 5: 2 }, tip: '1月末から仕入れ開始。3月がピーク。' },
    { name: 'GW・大型連休', keywords: ['旅行', 'キャリーバッグ', 'アウトドア', 'BBQ', 'テント', 'GW'], months: { 3: 2, 4: 4, 5: 5 }, tip: 'アウトドア・旅行グッズが売れる。' },
    { name: '夏物・冷感', keywords: ['扇風機', '冷感', 'プール', '水着', '日焼け止め', 'かき氷', '夏物'], months: { 5: 3, 6: 4, 7: 5, 8: 5, 9: 2 }, tip: '5月から仕込み。7〜8月がピーク。9月は処分価格。' },
    { name: '夏休み・自由研究', keywords: ['自由研究', '工作', '実験', '昆虫', '望遠鏡'], months: { 6: 2, 7: 5, 8: 4 }, tip: '7月が最需要。キットものが人気。' },
    { name: 'ハロウィン', keywords: ['ハロウィン', 'コスプレ', '仮装', 'パーティー'], months: { 9: 3, 10: 5 }, tip: '9月から準備需要。10月がピーク。' },
    { name: '暖房・冬物', keywords: ['ヒーター', 'こたつ', '暖房', '手袋', 'マフラー', '加湿器'], months: { 10: 3, 11: 5, 12: 5, 1: 4, 2: 3 }, tip: '10月から需要開始。加湿器は11〜2月が安定。' },
    { name: '年末年始・お正月', keywords: ['年賀状', 'おせち', '福袋', 'お年玉', 'カレンダー'], months: { 11: 3, 12: 5, 1: 4 }, tip: '福袋の転売はルール要確認。カレンダーは安定。' },
    { name: 'ボーナス商戦', keywords: ['高級', '家電', 'ブランド', '時計', 'ボーナス'], months: { 6: 4, 7: 5, 12: 5 }, tip: '6月・12月のボーナス時期は高額商品が動く。' },
    { name: 'ゲーム新作シーズン', keywords: ['ゲーム', '新作', 'PS5', 'Switch', '限定版'], months: { 2: 3, 3: 4, 9: 3, 10: 4, 11: 5, 12: 5 }, tip: '年末商戦11〜12月と春3月に大型タイトル集中。' },
  ];

  // ================================================================
  // プラットフォーム名マップ
  // ================================================================
  const platformNames = {
    'amazon': 'Amazon', 'mercari': 'メルカリ', 'yahoo_auction': 'ヤフオク',
    'yahoo': 'ヤフオク', 'rakuten': '楽天', 'rakuma': 'ラクマ', 'store': '実店舗',
    'alibaba': 'アリババ(1688)', 'aliexpress': 'AliExpress',
  };

  // ================================================================
  // プラットフォーム検索URL生成
  // ================================================================
  function getSearchUrl(platformKey, productName) {
    const q = encodeURIComponent(productName);
    switch (platformKey) {
      case 'amazon':
        return `https://www.amazon.co.jp/s?k=${q}`;
      case 'mercari':
        return `https://jp.mercari.com/search?keyword=${q}`;
      case 'yahoo_auction':
      case 'yahoo':
        return `https://auctions.yahoo.co.jp/search/search?p=${q}`;
      case 'rakuten':
        return `https://search.rakuten.co.jp/search/mall/${q}`;
      case 'rakuma':
        return `https://fril.jp/s?query=${q}`;
      case 'alibaba':
        return `https://s.1688.com/selloffer/offer_search.htm?keywords=${q}`;
      case 'aliexpress':
        return `https://www.aliexpress.com/wholesale?SearchText=${q}`;
      default:
        return null;
    }
  }

  // ================================================================
  // 季節スコア計算（0〜1）
  // ================================================================
  function calcSeasonalScore(product) {
    const month = new Date().getMonth() + 1;
    let maxScore = 0;

    if (!product.seasonalKeywords || product.seasonalKeywords.length === 0) {
      return 0.3; // 季節性なし = 通年で一定スコア
    }

    seasonalTrends.forEach(trend => {
      const isMatch = trend.keywords.some(kw =>
        product.seasonalKeywords.some(sk => sk.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(sk.toLowerCase()))
      );
      if (isMatch && trend.months[month]) {
        maxScore = Math.max(maxScore, trend.months[month] / 5);
      }
    });

    return maxScore || 0.2;
  }

  // ================================================================
  // 商品スコアリング（100点満点）
  // ================================================================
  function scoreProduct(product) {
    const margin = product.sellPrice > 0
      ? ((product.sellPrice - product.buyPrice) / product.sellPrice) * 100
      : 0;
    const roi = product.buyPrice > 0
      ? ((product.sellPrice - product.buyPrice) / product.buyPrice) * 100
      : 0;

    // 各スコア（重み付き）
    const marginScore = Math.min(30, margin * 0.75);           // max 30
    const roiScore = Math.min(20, roi * 0.2);                  // max 20
    const turnoverScore = (product.turnover / 5) * 15;         // max 15
    const competitionScore = ((6 - product.competition) / 5) * 15; // max 15
    const seasonalScore = calcSeasonalScore(product) * 10;      // max 10
    const difficultyScore = ((6 - product.difficulty) / 5) * 10; // max 10

    const total = marginScore + roiScore + turnoverScore + competitionScore + seasonalScore + difficultyScore;
    const rounded = Math.round(total * 10) / 10;

    let rank, rankLabel;
    if (rounded >= 75) { rank = 'S'; rankLabel = '超おすすめ'; }
    else if (rounded >= 60) { rank = 'A'; rankLabel = 'おすすめ'; }
    else if (rounded >= 48) { rank = 'B'; rankLabel = '良好'; }
    else if (rounded >= 35) { rank = 'C'; rankLabel = '普通'; }
    else { rank = 'D'; rankLabel = '様子見'; }

    return {
      total: rounded,
      margin: Math.round(margin * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      scores: { marginScore, roiScore, turnoverScore, competitionScore, seasonalScore, difficultyScore },
      rank,
      rankLabel,
    };
  }

  // ================================================================
  // 利益シミュレーション（プラットフォーム手数料込み）
  // ================================================================
  function simulateProfit(product) {
    const settings = Storage.getSettings();
    const sellPlatformKey = product.bestSell === 'yahoo_auction' ? 'yahoo' : product.bestSell;

    let platformResult;
    switch (sellPlatformKey) {
      case 'amazon':
        platformResult = Platforms.calcAmazon(product.sellPrice, settings.amazonCategory, {
          sellerType: settings.amazonSellerType,
          useFba: settings.useFba,
          monthlyVolume: settings.monthlyVolume,
        });
        break;
      case 'mercari':
        platformResult = Platforms.calcMercari(product.sellPrice, {
          shippingMethod: settings.mercariShipping,
        });
        break;
      case 'yahoo':
        platformResult = Platforms.calcYahooAuction(product.sellPrice, {
          isPremium: settings.yahooPremium,
          monthlyVolume: settings.monthlyVolume,
        });
        break;
      case 'rakuma':
        platformResult = Platforms.calcRakuma(product.sellPrice, {});
        break;
      default:
        platformResult = { totalFees: 0, platform: platformNames[sellPlatformKey] || sellPlatformKey };
    }

    // 海外仕入れの場合は輸入コストを加算
    const isImport = product.isImport || product.bestBuy === 'alibaba' || product.bestBuy === 'aliexpress';
    let importCost = 0;
    if (isImport) {
      const importShipping = settings.importShipping || 800;
      const importTaxRate = settings.importTaxRate || 10;
      importCost = importShipping + Math.round(product.buyPrice * importTaxRate / 100);
    }

    const storageCost = settings.storageCost || 0;
    const totalExtraCost = settings.packagingCost + importCost + storageCost;

    const profit = Platforms.calculateProfit(product.buyPrice, product.sellPrice, platformResult, {
      packagingCost: totalExtraCost,
    });

    return {
      netProfit: profit.netProfit,
      profitRate: profit.profitRate,
      roi: profit.roi,
      totalFees: platformResult.totalFees,
      platformName: platformResult.platform,
      importCost,
      isImport,
    };
  }

  // ================================================================
  // 全自動リサーチ実行
  // ================================================================
  function autoResearch(options = {}) {
    const { category = 'all', sortBy = 'score' } = options;

    // 商品をフィルタリング
    let products = [...productDB];
    if (category !== 'all') {
      products = products.filter(p => p.category === category);
    }

    // 各商品をスコアリング＋利益シミュレーション
    const results = products.map(product => {
      const score = scoreProduct(product);
      const simulation = simulateProfit(product);
      const grossProfit = product.sellPrice - product.buyPrice;

      return {
        ...product,
        score,
        simulation,
        grossProfit,
        categoryName: categoryDB[product.category]?.name || '',
        categoryIcon: categoryDB[product.category]?.icon || '',
        buyPlatformName: platformNames[product.bestBuy] || product.bestBuy,
        sellPlatformName: platformNames[product.bestSell] || product.bestSell,
      };
    });

    // ソート
    switch (sortBy) {
      case 'profit':
        results.sort((a, b) => b.simulation.netProfit - a.simulation.netProfit);
        break;
      case 'margin':
        results.sort((a, b) => b.score.margin - a.score.margin);
        break;
      case 'roi':
        results.sort((a, b) => b.score.roi - a.score.roi);
        break;
      case 'turnover':
        results.sort((a, b) => b.turnover - a.turnover);
        break;
      case 'easy':
        results.sort((a, b) => a.difficulty - b.difficulty);
        break;
      default: // score
        results.sort((a, b) => b.score.total - a.score.total);
        break;
    }

    return results;
  }

  // ================================================================
  // 今月のトレンド商品（季節スコアが高い商品を返す）
  // ================================================================
  function getTrendingProducts() {
    const month = new Date().getMonth() + 1;
    const results = [];

    productDB.forEach(product => {
      if (!product.seasonalKeywords || product.seasonalKeywords.length === 0) return;

      let maxDemand = 0;
      let matchedTrend = null;

      seasonalTrends.forEach(trend => {
        const isMatch = trend.keywords.some(kw =>
          product.seasonalKeywords.some(sk => sk.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(sk.toLowerCase()))
        );
        if (isMatch && trend.months[month] && trend.months[month] >= 3) {
          if (trend.months[month] > maxDemand) {
            maxDemand = trend.months[month];
            matchedTrend = trend;
          }
        }
      });

      if (matchedTrend) {
        const score = scoreProduct(product);
        const simulation = simulateProfit(product);
        results.push({
          ...product,
          score,
          simulation,
          demand: maxDemand,
          trendName: matchedTrend.name,
          trendTip: matchedTrend.tip,
          categoryName: categoryDB[product.category]?.name || '',
          categoryIcon: categoryDB[product.category]?.icon || '',
          buyPlatformName: platformNames[product.bestBuy] || product.bestBuy,
          sellPlatformName: platformNames[product.bestSell] || product.bestSell,
        });
      }
    });

    results.sort((a, b) => b.demand - a.demand || b.score.total - a.score.total);
    return results;
  }

  // ================================================================
  // 今月・来月のトレンドテーマ
  // ================================================================
  function getCurrentTrends() {
    const month = new Date().getMonth() + 1;
    const nextMonth = month === 12 ? 1 : month + 1;

    const current = [];
    const upcoming = [];

    seasonalTrends.forEach(trend => {
      if (trend.months[month] && trend.months[month] >= 3) {
        current.push({ ...trend, demand: trend.months[month] });
      }
      if (trend.months[nextMonth] && trend.months[nextMonth] >= 3 &&
          (!trend.months[month] || trend.months[nextMonth] > trend.months[month])) {
        upcoming.push({ ...trend, demand: trend.months[nextMonth] });
      }
    });

    current.sort((a, b) => b.demand - a.demand);
    upcoming.sort((a, b) => b.demand - a.demand);

    return { current, upcoming };
  }

  // ================================================================
  // カテゴリーランキング
  // ================================================================
  function getCategoryRanking() {
    const catStats = {};

    productDB.forEach(product => {
      const cat = product.category;
      if (!catStats[cat]) {
        catStats[cat] = { products: [], totalMargin: 0, count: 0 };
      }
      const margin = product.sellPrice > 0
        ? ((product.sellPrice - product.buyPrice) / product.sellPrice) * 100
        : 0;
      catStats[cat].products.push(product);
      catStats[cat].totalMargin += margin;
      catStats[cat].count++;
    });

    const ranked = Object.entries(catStats).map(([key, stats]) => {
      const avgMargin = stats.count > 0 ? Math.round(stats.totalMargin / stats.count) : 0;
      const avgTurnover = Math.round(stats.products.reduce((s, p) => s + p.turnover, 0) / stats.count * 10) / 10;
      const avgDifficulty = Math.round(stats.products.reduce((s, p) => s + p.difficulty, 0) / stats.count * 10) / 10;
      return {
        key,
        name: categoryDB[key]?.name || key,
        icon: categoryDB[key]?.icon || '',
        productCount: stats.count,
        avgMargin,
        avgTurnover,
        avgDifficulty,
        score: avgMargin * 0.4 + avgTurnover * 8 + (6 - avgDifficulty) * 5,
      };
    });

    ranked.sort((a, b) => b.score - a.score);
    return ranked;
  }

  // ================================================================
  // 仕入れ上限価格の逆算
  // ================================================================
  function calcMaxPurchasePrice(salePrice, targetMargin, platformKey) {
    let low = 0;
    let high = salePrice;
    const settings = Storage.getSettings();

    for (let i = 0; i < 50; i++) {
      const mid = Math.floor((low + high) / 2);
      let platformResult;

      switch (platformKey) {
        case 'amazon':
          platformResult = Platforms.calcAmazon(salePrice, settings.amazonCategory, {
            sellerType: settings.amazonSellerType, useFba: settings.useFba, monthlyVolume: settings.monthlyVolume,
          });
          break;
        case 'mercari':
          platformResult = Platforms.calcMercari(salePrice, { shippingMethod: settings.mercariShipping });
          break;
        case 'yahoo':
          platformResult = Platforms.calcYahooAuction(salePrice, { isPremium: settings.yahooPremium, monthlyVolume: settings.monthlyVolume });
          break;
        case 'rakuma':
          platformResult = Platforms.calcRakuma(salePrice, {});
          break;
        default:
          platformResult = { totalFees: 0 };
      }

      const profit = Platforms.calculateProfit(mid, salePrice, platformResult, { packagingCost: settings.packagingCost });

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
    productDB,
    seasonalTrends,
    platformNames,
    autoResearch,
    scoreProduct,
    simulateProfit,
    getTrendingProducts,
    getCurrentTrends,
    getCategoryRanking,
    calcMaxPurchasePrice,
    getSearchUrl,
  };
})();

if (typeof module !== 'undefined') module.exports = Research;
