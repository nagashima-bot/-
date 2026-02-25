/**
 * せどりプロ - メインアプリケーション
 */
const App = (() => {
  let currentPage = 'calculator';
  let editingProductId = null;
  let currentFilter = 'all';

  // ========== 初期化 ==========
  function init() {
    initSelectOptions();
    loadSettings();
    bindEvents();
    initDarkMode();
    showPage('calculator');
  }

  // ========== セレクトボックスの選択肢を動的生成 ==========
  function initSelectOptions() {
    // Amazon カテゴリー
    const catSelects = ['calc-amazon-category', 'set-amazon-category'];
    catSelects.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = '';
      Object.entries(Platforms.amazonCategories).forEach(([key, cat]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${cat.name} (${cat.rate * 100}%)`;
        el.appendChild(opt);
      });
    });

    // メルカリ配送方法
    const shipSelects = ['calc-mercari-shipping', 'set-mercari-shipping'];
    shipSelects.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = '';
      Object.entries(Platforms.mercariShipping).forEach(([key, ship]) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${ship.name} (${ship.fee}円)`;
        el.appendChild(opt);
      });
    });
  }

  // ========== 設定読み込み ==========
  function loadSettings() {
    const s = Storage.getSettings();
    setVal('set-amazon-seller', s.amazonSellerType);
    setVal('set-amazon-category', s.amazonCategory);
    setVal('set-use-fba', s.useFba ? '1' : '0');
    setVal('set-monthly-volume', s.monthlyVolume);
    setVal('set-yahoo-premium', s.yahooPremium ? '1' : '0');
    setVal('set-mercari-shipping', s.mercariShipping);
    setVal('set-packaging', s.packagingCost);
    setVal('set-target-rate', s.targetProfitRate);

    // 計算画面にもデフォルト反映
    setVal('calc-amazon-category', s.amazonCategory);
    setVal('calc-use-fba', s.useFba ? '1' : '0');
    setVal('calc-mercari-shipping', s.mercariShipping);
    setVal('calc-yahoo-premium', s.yahooPremium ? '1' : '0');
    setVal('calc-packaging', s.packagingCost);
  }

  function saveCurrentSettings() {
    const settings = {
      amazonSellerType: getVal('set-amazon-seller'),
      amazonCategory: getVal('set-amazon-category'),
      useFba: getVal('set-use-fba') === '1',
      monthlyVolume: getNum('set-monthly-volume') || 30,
      yahooPremium: getVal('set-yahoo-premium') === '1',
      mercariShipping: getVal('set-mercari-shipping'),
      packagingCost: getNum('set-packaging') || 30,
      targetProfitRate: getNum('set-target-rate') || 20,
      darkMode: document.documentElement.getAttribute('data-theme') === 'dark',
    };
    Storage.saveSettings(settings);
    toast('設定を保存しました');
  }

  // ========== ダークモード ==========
  function initDarkMode() {
    const s = Storage.getSettings();
    if (s.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    const settings = Storage.getSettings();
    settings.darkMode = !isDark;
    Storage.saveSettings(settings);
  }

  // ========== ページナビゲーション ==========
  function showPage(page) {
    currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (pageEl) pageEl.classList.add('active');
    if (navBtn) navBtn.classList.add('active');

    // ページ固有の初期化
    if (page === 'dashboard') refreshDashboard();
    if (page === 'products') renderProductList();
  }

  // ========== イベントバインド ==========
  function bindEvents() {
    // ナビゲーション
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => showPage(btn.dataset.page));
    });

    // ダークモード
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

    // 販売先プラットフォーム切替
    document.getElementById('calc-platform').addEventListener('change', onPlatformChange);
    onPlatformChange(); // 初期表示

    // ヤフオク送料負担切替
    document.getElementById('calc-yahoo-shipping-type').addEventListener('change', (e) => {
      const el = document.getElementById('yahoo-shipping-input');
      if (e.target.value === 'buyer') {
        el.classList.add('hidden');
      } else {
        el.classList.remove('hidden');
      }
    });

    // 利益計算
    document.getElementById('calc-btn').addEventListener('click', runCalculation);

    // 全販路比較
    document.getElementById('cmp-btn').addEventListener('click', runComparison);
    document.getElementById('compare-all-btn').addEventListener('click', () => {
      const purchase = getNum('calc-purchase-price');
      const sale = getNum('calc-sale-price');
      setVal('cmp-purchase', purchase);
      setVal('cmp-sale', sale);
      showPage('compare');
      runComparison();
    });

    // 商品保存
    document.getElementById('save-to-products').addEventListener('click', saveCalcToProducts);

    // 逆算
    document.getElementById('reverse-calc-btn').addEventListener('click', runReverseCalc);

    // 商品リスト
    document.getElementById('add-product-btn').addEventListener('click', () => openProductModal());
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderProductList();
      });
    });

    // モーダル
    document.getElementById('modal-cancel').addEventListener('click', closeProductModal);
    document.querySelector('.modal-close').addEventListener('click', closeProductModal);
    document.querySelector('#product-modal .modal-backdrop').addEventListener('click', closeProductModal);
    document.getElementById('modal-save').addEventListener('click', saveProduct);
    document.getElementById('modal-status').addEventListener('change', (e) => {
      const soldSection = document.getElementById('modal-sold-section');
      if (e.target.value === 'sold') {
        soldSection.classList.remove('hidden');
      } else {
        soldSection.classList.add('hidden');
      }
    });

    // 確認ダイアログ
    document.getElementById('confirm-no').addEventListener('click', closeConfirm);
    document.querySelector('#confirm-dialog .modal-backdrop').addEventListener('click', closeConfirm);

    // 設定変更時に自動保存
    document.querySelectorAll('#page-settings .input').forEach(el => {
      el.addEventListener('change', saveCurrentSettings);
    });

    // データ管理
    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', importData);
    document.getElementById('clear-data-btn').addEventListener('click', () => {
      showConfirm('全データを削除しますか？この操作は取り消せません。', () => {
        localStorage.clear();
        loadSettings();
        refreshDashboard();
        renderProductList();
        toast('全データを削除しました');
      });
    });

    // リアルタイム計算（入力中に自動計算）
    ['calc-purchase-price', 'calc-sale-price'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        const purchase = getNum('calc-purchase-price');
        const sale = getNum('calc-sale-price');
        if (purchase > 0 && sale > 0) {
          runCalculation();
        }
      });
    });
  }

  // ========== プラットフォーム切替 ==========
  function onPlatformChange() {
    const platform = getVal('calc-platform');
    const sections = {
      'amazon': 'amazon-options',
      'mercari': 'mercari-options',
      'yahoo': 'yahoo-options',
      'rakuma': 'rakuma-options',
    };

    Object.values(sections).forEach(id => {
      document.getElementById(id).classList.add('hidden');
    });

    if (sections[platform]) {
      document.getElementById(sections[platform]).classList.remove('hidden');
    }
  }

  // ========== 利益計算実行 ==========
  function runCalculation() {
    const purchasePrice = getNum('calc-purchase-price');
    const salePrice = getNum('calc-sale-price');
    const platform = getVal('calc-platform');

    if (!purchasePrice || !salePrice) {
      return;
    }

    let platformResult;
    const settings = Storage.getSettings();

    switch (platform) {
      case 'amazon':
        platformResult = Platforms.calcAmazon(salePrice, getVal('calc-amazon-category'), {
          sellerType: settings.amazonSellerType,
          useFba: getVal('calc-use-fba') === '1',
          monthlyVolume: settings.monthlyVolume,
          shippingCost: 0,
          sizeCategory: 1,
        });
        break;
      case 'mercari':
        platformResult = Platforms.calcMercari(salePrice, {
          shippingMethod: getVal('calc-mercari-shipping'),
        });
        break;
      case 'yahoo':
        platformResult = Platforms.calcYahooAuction(salePrice, {
          isPremium: getVal('calc-yahoo-premium') === '1',
          monthlyVolume: settings.monthlyVolume,
          shippingCost: getVal('calc-yahoo-shipping-type') === 'seller' ? getNum('calc-yahoo-shipping') : 0,
          buyerPaysShipping: getVal('calc-yahoo-shipping-type') === 'buyer',
        });
        break;
      case 'rakuma':
        platformResult = Platforms.calcRakuma(salePrice, {
          shippingCost: getNum('calc-rakuma-shipping'),
        });
        break;
    }

    const profitResult = Platforms.calculateProfit(purchasePrice, salePrice, platformResult, {
      pointsBack: getNum('calc-points-back'),
      packagingCost: getNum('calc-packaging'),
    });

    renderCalcResult(platformResult, profitResult);

    // 履歴に保存
    Storage.addHistory({
      productName: getVal('calc-product-name') || '(名称未設定)',
      platform: platformResult.platform,
      purchasePrice,
      salePrice,
      netProfit: profitResult.netProfit,
      profitRate: profitResult.profitRate,
    });
  }

  // ========== 計算結果レンダリング ==========
  function renderCalcResult(platformResult, profitResult) {
    const container = document.getElementById('calc-result-content');
    const isProfit = profitResult.netProfit >= 0;

    let feeDetails = '';
    if (platformResult.platform === 'Amazon') {
      feeDetails = `
        <div class="result-row">
          <span class="result-label">販売手数料 (${platformResult.category})</span>
          <span class="result-value">-¥${fmt(platformResult.referralFee)}</span>
        </div>
        ${platformResult.closingFee > 0 ? `
        <div class="result-row">
          <span class="result-label">カテゴリー成約料</span>
          <span class="result-value">-¥${fmt(platformResult.closingFee)}</span>
        </div>` : ''}
        <div class="result-row">
          <span class="result-label">出品手数料（按分）</span>
          <span class="result-value">-¥${fmt(platformResult.perItemFee)}</span>
        </div>
        ${platformResult.fbaFee > 0 ? `
        <div class="result-row">
          <span class="result-label">FBA配送料</span>
          <span class="result-value">-¥${fmt(platformResult.fbaFee)}</span>
        </div>` : ''}
      `;
    } else if (platformResult.platform === 'メルカリ') {
      feeDetails = `
        <div class="result-row">
          <span class="result-label">販売手数料 (${platformResult.commissionRate}%)</span>
          <span class="result-value">-¥${fmt(platformResult.commission)}</span>
        </div>
        <div class="result-row">
          <span class="result-label">送料 (${platformResult.shippingMethod})</span>
          <span class="result-value">-¥${fmt(platformResult.shippingCost)}</span>
        </div>
      `;
    } else if (platformResult.platform === 'ヤフオク') {
      feeDetails = `
        <div class="result-row">
          <span class="result-label">落札手数料 (${platformResult.commissionRate}%)</span>
          <span class="result-value">-¥${fmt(platformResult.commission)}</span>
        </div>
        ${platformResult.premiumFee > 0 ? `
        <div class="result-row">
          <span class="result-label">プレミアム会費（按分）</span>
          <span class="result-value">-¥${fmt(platformResult.premiumFee)}</span>
        </div>` : ''}
        ${platformResult.shippingCost > 0 ? `
        <div class="result-row">
          <span class="result-label">送料</span>
          <span class="result-value">-¥${fmt(platformResult.shippingCost)}</span>
        </div>` : ''}
      `;
    } else {
      feeDetails = `
        <div class="result-row">
          <span class="result-label">販売手数料 (${platformResult.commissionRate}%)</span>
          <span class="result-value">-¥${fmt(platformResult.commission)}</span>
        </div>
        ${platformResult.shippingCost > 0 ? `
        <div class="result-row">
          <span class="result-label">送料</span>
          <span class="result-value">-¥${fmt(platformResult.shippingCost)}</span>
        </div>` : ''}
      `;
    }

    container.innerHTML = `
      <div class="result-row result-highlight" style="text-align:center; flex-direction:column; gap:4px;">
        <span class="result-label">純利益</span>
        <span class="result-big ${isProfit ? 'result-profit-positive' : 'result-profit-negative'}">
          ${isProfit ? '+' : ''}¥${fmt(profitResult.netProfit)}
        </span>
        <div style="display:flex; gap:8px; justify-content:center; margin-top:4px;">
          <span class="result-badge ${isProfit ? 'badge-profit' : 'badge-loss'}">
            利益率 ${profitResult.profitRate}%
          </span>
          <span class="result-badge ${isProfit ? 'badge-profit' : 'badge-loss'}">
            ROI ${profitResult.roi}%
          </span>
        </div>
      </div>

      <div class="result-grid" style="margin-top:12px;">
        <div class="result-row">
          <span class="result-label">販売先</span>
          <span class="result-value">${platformResult.platform}</span>
        </div>
        <div class="result-row">
          <span class="result-label">販売価格</span>
          <span class="result-value">¥${fmt(profitResult.salePrice)}</span>
        </div>
        <div class="result-row">
          <span class="result-label">仕入れ価格</span>
          <span class="result-value">-¥${fmt(profitResult.purchasePrice)}</span>
        </div>
        ${profitResult.pointsBack > 0 ? `
        <div class="result-row">
          <span class="result-label">ポイント還元</span>
          <span class="result-value result-profit-positive">+¥${fmt(profitResult.pointsBack)}</span>
        </div>` : ''}

        ${feeDetails}

        <div class="result-row">
          <span class="result-label">梱包資材費</span>
          <span class="result-value">-¥${fmt(profitResult.packagingCost)}</span>
        </div>
        <div class="result-row">
          <span class="result-label">手数料・経費 合計</span>
          <span class="result-value" style="color:var(--red)">-¥${fmt(profitResult.totalFees + profitResult.packagingCost)}</span>
        </div>
      </div>
    `;

    document.getElementById('calc-result').classList.remove('hidden');
  }

  // ========== 全販路比較 ==========
  function runComparison() {
    const purchase = getNum('cmp-purchase');
    const sale = getNum('cmp-sale');

    if (!purchase || !sale) {
      toast('仕入れ価格と販売価格を入力してください');
      return;
    }

    const settings = Storage.getSettings();
    const results = Platforms.compareAll(purchase, sale, {
      amazonCategory: settings.amazonCategory,
      amazonSellerType: settings.amazonSellerType,
      useFba: settings.useFba,
      monthlyVolume: settings.monthlyVolume,
      mercariShipping: settings.mercariShipping,
      yahooPremium: settings.yahooPremium,
      packagingCost: settings.packagingCost,
    });

    renderComparison(results);
  }

  function renderComparison(results) {
    const container = document.getElementById('cmp-result-content');
    let html = '';

    results.forEach((r, i) => {
      const isProfit = r.netProfit >= 0;
      html += `
        <div class="compare-card ${i === 0 ? 'best' : ''}">
          <div class="compare-header">
            <span class="compare-platform">${r.platform}</span>
            <span class="compare-profit ${isProfit ? 'result-profit-positive' : 'result-profit-negative'}">
              ${isProfit ? '+' : ''}¥${fmt(r.netProfit)}
            </span>
          </div>
          <div class="compare-details">
            <span>手数料合計</span>
            <span class="compare-detail-value">¥${fmt(r.totalFees)}</span>
            <span>利益率</span>
            <span class="compare-detail-value">${r.profitRate}%</span>
            <span>ROI</span>
            <span class="compare-detail-value">${r.roi}%</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    document.getElementById('cmp-result').classList.remove('hidden');
  }

  // ========== 逆算 ==========
  function runReverseCalc() {
    const purchase = getNum('reverse-purchase');
    const targetRate = getNum('reverse-rate');

    if (!purchase) {
      toast('仕入れ価格を入力してください');
      return;
    }

    const settings = Storage.getSettings();
    const platforms = [
      { key: 'amazon', name: 'Amazon' },
      { key: 'mercari', name: 'メルカリ' },
      { key: 'yahoo', name: 'ヤフオク' },
      { key: 'rakuma', name: 'ラクマ' },
    ];

    let html = '<div class="reverse-result-grid">';
    platforms.forEach(p => {
      const options = {
        packagingCost: settings.packagingCost,
        amazonCategory: settings.amazonCategory,
        sellerType: settings.amazonSellerType,
        useFba: settings.useFba,
        monthlyVolume: settings.monthlyVolume,
        shippingMethod: settings.mercariShipping,
        isPremium: settings.yahooPremium,
      };

      const minPrice = Platforms.calcMinSalePrice(purchase, targetRate, p.key, options);
      html += `
        <div class="reverse-card">
          <div class="reverse-platform">${p.name}</div>
          <div class="reverse-price">¥${fmt(minPrice)}</div>
        </div>
      `;
    });
    html += '</div>';

    const resultEl = document.getElementById('reverse-result');
    resultEl.innerHTML = html;
    resultEl.classList.remove('hidden');
  }

  // ========== 計算結果を商品リストに保存 ==========
  function saveCalcToProducts() {
    const product = {
      name: getVal('calc-product-name') || '(名称未設定)',
      status: 'research',
      source: getVal('calc-source'),
      purchasePrice: getNum('calc-purchase-price'),
      salePrice: getNum('calc-sale-price'),
      platform: getVal('calc-platform'),
      memo: '',
    };

    Storage.addProduct(product);
    toast('商品リストに保存しました');
  }

  // ========== 商品リスト ==========
  function renderProductList() {
    const products = Storage.getProducts();
    const filtered = currentFilter === 'all'
      ? products
      : products.filter(p => p.status === currentFilter);

    const container = document.getElementById('product-list');

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📦</span>
          <p>商品がまだありません</p>
          <p class="text-muted">「+ 追加」ボタンまたは計算結果から保存できます</p>
        </div>
      `;
      return;
    }

    const statusLabels = {
      'research': 'リサーチ中',
      'purchased': '仕入済',
      'listed': '出品中',
      'sold': '売却済',
    };

    const platformLabels = {
      'amazon': 'Amazon',
      'mercari': 'メルカリ',
      'yahoo': 'ヤフオク',
      'rakuma': 'ラクマ',
    };

    const sourceLabels = {
      'amazon': 'Amazon',
      'mercari': 'メルカリ',
      'yahoo_auction': 'ヤフオク',
      'rakuten': '楽天',
      'store': '実店舗',
      'other': 'その他',
    };

    let html = '';
    filtered.forEach(p => {
      const estimatedProfit = (p.salePrice || 0) - (p.purchasePrice || 0);
      const actualProfit = p.actualProfit || null;
      const displayProfit = p.status === 'sold' && actualProfit !== null
        ? actualProfit
        : estimatedProfit;
      const isProfit = displayProfit >= 0;

      html += `
        <div class="product-item" data-id="${p.id}">
          <div class="product-top">
            <span class="product-name">${escHtml(p.name)}</span>
            <span class="product-status status-${p.status}">${statusLabels[p.status] || p.status}</span>
          </div>
          <div class="product-details">
            <span class="product-detail">${sourceLabels[p.source] || ''} → ${platformLabels[p.platform] || ''}</span>
            <span class="product-detail">仕入 ¥${fmt(p.purchasePrice || 0)}</span>
            <span class="product-profit ${isProfit ? 'result-profit-positive' : 'result-profit-negative'}">
              ${p.status === 'sold' ? '確定' : '見込'} ${isProfit ? '+' : ''}¥${fmt(displayProfit)}
            </span>
          </div>
          <div class="product-actions">
            <button class="product-action-btn edit-btn" data-id="${p.id}">編集</button>
            <button class="product-action-btn delete" data-id="${p.id}">削除</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // イベント割り当て
    container.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openProductModal(btn.dataset.id);
      });
    });

    container.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showConfirm('この商品を削除しますか？', () => {
          Storage.deleteProduct(btn.dataset.id);
          renderProductList();
          toast('商品を削除しました');
        });
      });
    });
  }

  // ========== 商品モーダル ==========
  function openProductModal(id = null) {
    editingProductId = id;
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('modal-title');

    if (id) {
      title.textContent = '商品を編集';
      const product = Storage.getProducts().find(p => p.id === id);
      if (!product) return;

      setVal('modal-name', product.name || '');
      setVal('modal-status', product.status || 'research');
      setVal('modal-source', product.source || 'amazon');
      setVal('modal-purchase', product.purchasePrice || '');
      setVal('modal-platform', product.platform || 'mercari');
      setVal('modal-sale', product.salePrice || '');
      setVal('modal-actual-sale', product.actualSalePrice || '');
      setVal('modal-actual-fees', product.actualFees || '');
      setVal('modal-memo', product.memo || '');

      if (product.status === 'sold') {
        document.getElementById('modal-sold-section').classList.remove('hidden');
      } else {
        document.getElementById('modal-sold-section').classList.add('hidden');
      }
    } else {
      title.textContent = '商品を追加';
      ['modal-name', 'modal-purchase', 'modal-sale', 'modal-actual-sale', 'modal-actual-fees', 'modal-memo'].forEach(id => setVal(id, ''));
      setVal('modal-status', 'research');
      setVal('modal-source', 'amazon');
      setVal('modal-platform', 'mercari');
      document.getElementById('modal-sold-section').classList.add('hidden');
    }

    modal.classList.remove('hidden');
  }

  function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
    editingProductId = null;
  }

  function saveProduct() {
    const name = getVal('modal-name');
    if (!name.trim()) {
      toast('商品名を入力してください');
      return;
    }

    const productData = {
      name: name.trim(),
      status: getVal('modal-status'),
      source: getVal('modal-source'),
      purchasePrice: getNum('modal-purchase'),
      platform: getVal('modal-platform'),
      salePrice: getNum('modal-sale'),
      memo: getVal('modal-memo'),
    };

    // 売却済の場合
    if (productData.status === 'sold') {
      productData.actualSalePrice = getNum('modal-actual-sale') || productData.salePrice;
      productData.actualFees = getNum('modal-actual-fees') || 0;
      productData.actualProfit = productData.actualSalePrice - productData.purchasePrice - productData.actualFees;
    }

    if (editingProductId) {
      Storage.updateProduct(editingProductId, productData);
      toast('商品を更新しました');
    } else {
      Storage.addProduct(productData);
      toast('商品を追加しました');
    }

    closeProductModal();
    renderProductList();
  }

  // ========== ダッシュボード ==========
  function refreshDashboard() {
    const stats = Storage.getStats();

    document.getElementById('stat-total-profit').textContent = `¥${fmt(stats.totalProfit)}`;
    document.getElementById('stat-total-revenue').textContent = `¥${fmt(stats.totalRevenue)}`;
    document.getElementById('stat-total-investment').textContent = `¥${fmt(stats.totalInvestment)}`;
    document.getElementById('stat-roi').textContent = `${stats.roi}%`;
    document.getElementById('stat-in-stock').textContent = stats.inStock;
    document.getElementById('stat-sold').textContent = stats.soldCount;
    document.getElementById('stat-research').textContent = stats.researchCount;

    // 利益率バー
    const rate = Math.max(0, Math.min(100, stats.profitRate));
    document.getElementById('profit-rate-fill').style.width = `${rate}%`;
    document.getElementById('profit-rate-text').textContent = `${stats.profitRate}%`;

    // 最近の売却
    const products = Storage.getProducts().filter(p => p.status === 'sold').slice(0, 10);
    const recentEl = document.getElementById('recent-sales');
    if (products.length === 0) {
      recentEl.innerHTML = '<p class="text-muted text-center">売却済の商品はありません</p>';
    } else {
      recentEl.innerHTML = products.map(p => {
        const profit = p.actualProfit || ((p.salePrice || 0) - (p.purchasePrice || 0));
        const isProfit = profit >= 0;
        return `
          <div class="recent-item">
            <span class="recent-name">${escHtml(p.name)}</span>
            <span class="recent-profit ${isProfit ? 'result-profit-positive' : 'result-profit-negative'}">
              ${isProfit ? '+' : ''}¥${fmt(profit)}
            </span>
          </div>
        `;
      }).join('');
    }
  }

  // ========== データ管理 ==========
  function exportData() {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sedori-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('データをエクスポートしました');
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        Storage.importAll(data);
        loadSettings();
        renderProductList();
        refreshDashboard();
        toast('データをインポートしました');
      } catch (err) {
        toast('ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ========== 確認ダイアログ ==========
  let confirmCallback = null;

  function showConfirm(message, callback) {
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-dialog').classList.remove('hidden');
    confirmCallback = callback;
    document.getElementById('confirm-yes').onclick = () => {
      closeConfirm();
      if (confirmCallback) confirmCallback();
    };
  }

  function closeConfirm() {
    document.getElementById('confirm-dialog').classList.add('hidden');
    confirmCallback = null;
  }

  // ========== トースト通知 ==========
  function toast(message) {
    let toastEl = document.querySelector('.toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2500);
  }

  // ========== ユーティリティ ==========
  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function getNum(id) {
    return parseInt(getVal(id)) || 0;
  }

  function fmt(num) {
    return Math.abs(num).toLocaleString('ja-JP');
  }

  function escHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ========== 起動 ==========
  document.addEventListener('DOMContentLoaded', init);

  return { init, showPage };
})();
