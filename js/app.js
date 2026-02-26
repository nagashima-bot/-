/**
 * せどりプロ - メインアプリケーション
 */
const App = (() => {
  let currentPage = 'research';
  let editingProductId = null;
  let currentFilter = 'all';
  let researchCategory = 'all';
  let researchSortBy = 'score';
  let researchResults = [];

  // ========== 初期化 ==========
  function init() {
    initSelectOptions();
    loadSettings();
    bindEvents();
    bindResearchEvents();
    initDarkMode();
    showPage('research');
    initResearchPage();
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
    setVal('set-domestic-shipping', s.domesticShipping || 0);
    setVal('set-import-shipping', s.importShipping || 800);
    setVal('set-import-tax-rate', s.importTaxRate || 10);
    setVal('set-storage-cost', s.storageCost || 0);
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
      domesticShipping: getNum('set-domestic-shipping') || 0,
      importShipping: getNum('set-import-shipping') || 800,
      importTaxRate: getNum('set-import-tax-rate') || 10,
      storageCost: getNum('set-storage-cost') || 0,
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
    if (page === 'research') initResearchPage();
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
    document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
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
      'alibaba': 'アリババ',
      'aliexpress': 'AliExpress',
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

  // ========================================================================
  // 自動リサーチ機能
  // ========================================================================

  function bindResearchEvents() {
    // 自動リサーチ実行
    document.getElementById('rs-auto-research-btn').addEventListener('click', runAutoResearch);

    // カテゴリーフィルター（動的生成するので後で追加）
    // ソートボタン
    document.querySelectorAll('.rs-sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rs-sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        researchSortBy = btn.dataset.sort;
        if (researchResults.length > 0) {
          // 既存の結果を再ソート
          runAutoResearch();
        }
      });
    });

    // 仕入れ上限逆算
    document.getElementById('rs-maxprice-btn').addEventListener('click', runMaxPriceCalc);
  }

  // リサーチページ初期化
  function initResearchPage() {
    initCategoryFilter();
    renderTrends();
    renderTrendingProducts();
    renderCategoryRanking();
  }

  // カテゴリーフィルターボタンを動的生成
  function initCategoryFilter() {
    const container = document.getElementById('rs-category-filter');
    if (!container) return;

    // 既存のボタンをクリア
    container.innerHTML = '<button class="filter-btn active" data-category="all">すべて</button>';

    // カテゴリーボタンを追加
    Object.entries(Research.categoryDB).forEach(([key, cat]) => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.category = key;
      btn.textContent = `${cat.icon} ${cat.name}`;
      container.appendChild(btn);
    });

    // イベント
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        researchCategory = btn.dataset.category;
        if (researchResults.length > 0) {
          runAutoResearch();
        }
      });
    });
  }

  // 自動リサーチ実行
  function runAutoResearch() {
    const loadingEl = document.getElementById('rs-loading');
    const summaryEl = document.getElementById('rs-summary');
    const resultsEl = document.getElementById('rs-results');
    const loadingText = document.getElementById('rs-loading-text');

    // ローディング表示
    loadingEl.classList.remove('hidden');
    summaryEl.classList.add('hidden');
    resultsEl.classList.add('hidden');

    const messages = [
      '各販売サイトを分析中...',
      '売れ筋ランキングをチェック中...',
      '利益率を計算中...',
      '最適ルートを分析中...',
      'おすすめ商品を選定中...',
    ];

    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      loadingText.textContent = messages[msgIndex];
    }, 600);

    // 遅延で結果表示（リサーチ感を演出）
    setTimeout(() => {
      clearInterval(msgInterval);
      loadingEl.classList.add('hidden');

      // リサーチ実行
      researchResults = Research.autoResearch({
        category: researchCategory,
        sortBy: researchSortBy,
      });

      // サマリー表示
      renderResearchSummary(researchResults);
      summaryEl.classList.remove('hidden');

      // 結果リスト表示
      renderResearchResults(researchResults);
      resultsEl.classList.remove('hidden');
    }, 2000);
  }

  // リサーチサマリー
  function renderResearchSummary(results) {
    document.getElementById('rs-summary-count').textContent = results.length;

    if (results.length > 0) {
      const avgProfit = Math.round(results.reduce((s, r) => s + r.simulation.netProfit, 0) / results.length);
      const avgMargin = Math.round(results.reduce((s, r) => s + r.score.margin, 0) / results.length * 10) / 10;
      document.getElementById('rs-summary-avg-profit').textContent = `¥${fmt(avgProfit)}`;
      document.getElementById('rs-summary-avg-margin').textContent = `${avgMargin}%`;
    }
  }

  // リサーチ結果リスト
  function renderResearchResults(results) {
    const container = document.getElementById('rs-results-list');

    if (results.length === 0) {
      container.innerHTML = '<p class="text-muted text-center" style="padding:20px">条件に一致する商品が見つかりませんでした</p>';
      return;
    }

    container.innerHTML = results.map((r, i) => {
      const isProfit = r.simulation.netProfit >= 0;
      const stars = (count, max) => {
        let s = '';
        for (let j = 0; j < max; j++) s += j < count ? '★' : '☆';
        return s;
      };

      // 検索リンク生成
      const buyUrl = Research.getSearchUrl(r.bestBuy, r.name);
      const sellUrl = Research.getSearchUrl(r.bestSell, r.name);

      return `
        <div class="recommend-card rank-${r.score.rank}">
          <div class="recommend-header">
            <span class="recommend-rank rank-badge-${r.score.rank}">${r.score.rank}</span>
            <div class="recommend-title-area">
              <div class="recommend-name">${escHtml(r.name)}</div>
              <div class="recommend-category">${r.categoryIcon} ${r.categoryName}${r.simulation.isImport ? '<span class="import-badge">海外仕入れ</span>' : ''}</div>
            </div>
            <span class="recommend-score">${r.score.total}pt</span>
          </div>

          <div class="recommend-info-row">
            <span class="recommend-info-item">回転率 <span class="stars">${stars(r.turnover, 5)}</span></span>
            <span class="recommend-info-item">難易度 <span class="stars">${stars(r.difficulty, 5)}</span></span>
            <span class="recommend-info-item">競合 <span class="stars">${stars(r.competition, 5)}</span></span>
          </div>

          <div class="recommend-route">
            <div class="recommend-route-flow">
              <div class="route-platform">
                <span class="route-platform-name">仕入れ: ${r.buyPlatformName}</span>
                <span class="route-platform-price">¥${fmt(r.buyPrice)}</span>
              </div>
              <span class="route-arrow">→</span>
              <div class="route-platform">
                <span class="route-platform-name">販売: ${r.sellPlatformName}</span>
                <span class="route-platform-price">¥${fmt(r.sellPrice)}</span>
              </div>
            </div>
            <div class="recommend-profit-row">
              <span class="recommend-net-profit ${isProfit ? 'result-profit-positive' : 'result-profit-negative'}">
                純利益 ${isProfit ? '+' : ''}¥${fmt(r.simulation.netProfit)}
              </span>
              <div class="recommend-metrics">
                <span class="recommend-metric-badge badge-green">利益率 ${r.simulation.profitRate}%</span>
                <span class="recommend-metric-badge badge-blue">ROI ${r.simulation.roi}%</span>
              </div>
            </div>
          </div>

          <div class="recommend-links">
            ${buyUrl ? `<a href="${buyUrl}" target="_blank" rel="noopener" class="recommend-link link-buy">${r.buyPlatformName}で探す</a>` : ''}
            ${sellUrl ? `<a href="${sellUrl}" target="_blank" rel="noopener" class="recommend-link link-sell">${r.sellPlatformName}で相場を見る</a>` : ''}
          </div>

          <div class="recommend-tip">${r.tip}${r.simulation.importCost > 0 ? `<br>※輸入コスト(送料+関税): 約¥${fmt(r.simulation.importCost)} を含む` : ''}</div>

          <div class="recommend-actions">
            <button class="btn btn-secondary rs-save-product" data-index="${i}">商品リストに保存</button>
            <button class="btn btn-outline rs-calc-product" data-index="${i}">詳細計算</button>
          </div>
        </div>
      `;
    }).join('');

    // 保存ボタン
    container.querySelectorAll('.rs-save-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = results[parseInt(btn.dataset.index)];
        const sellPlatformKey = r.bestSell === 'yahoo_auction' ? 'yahoo' : r.bestSell;
        Storage.addProduct({
          name: r.name,
          status: 'research',
          source: r.bestBuy,
          purchasePrice: r.buyPrice,
          salePrice: r.sellPrice,
          platform: sellPlatformKey,
          memo: `スコア: ${r.score.rank} (${r.score.total}pt) | 利益率: ${r.simulation.profitRate}% | ROI: ${r.simulation.roi}%`,
        });
        toast('商品リストに保存しました');
      });
    });

    // 詳細計算ボタン
    container.querySelectorAll('.rs-calc-product').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = results[parseInt(btn.dataset.index)];
        const sellPlatformKey = r.bestSell === 'yahoo_auction' ? 'yahoo' : r.bestSell;
        setVal('calc-product-name', r.name);
        setVal('calc-source', r.bestBuy);
        setVal('calc-purchase-price', r.buyPrice);
        setVal('calc-platform', sellPlatformKey);
        setVal('calc-sale-price', r.sellPrice);
        onPlatformChange();
        showPage('calculator');
        runCalculation();
      });
    });
  }

  // 今月の注目商品（トレンド）
  function renderTrendingProducts() {
    const trending = Research.getTrendingProducts();
    const container = document.getElementById('rs-trending-list');

    if (!container) return;

    if (trending.length === 0) {
      container.innerHTML = '<p class="text-muted text-center">今月の特別な注目商品はありません</p>';
      return;
    }

    container.innerHTML = trending.slice(0, 8).map(t => {
      const isProfit = t.simulation.netProfit >= 0;
      const dots = Array.from({ length: 5 }, (_, i) =>
        `<span class="trending-dot ${i < t.demand ? 'active' : ''}"></span>`
      ).join('');

      return `
        <div class="trending-card">
          <div class="trending-trend-name">${t.trendName}</div>
          <div class="trending-header">
            <span class="trending-name">${escHtml(t.name)}</span>
            <div class="trending-demand">${dots}</div>
          </div>
          <div class="trending-profit">
            <span class="trending-profit-value ${isProfit ? 'result-profit-positive' : 'result-profit-negative'}">
              ${isProfit ? '+' : ''}¥${fmt(t.simulation.netProfit)}
            </span>
            <span class="trending-route-mini">
              ${t.buyPlatformName} ¥${fmt(t.buyPrice)} → ${t.sellPlatformName} ¥${fmt(t.sellPrice)}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  // 季節トレンドテーマ
  function renderTrends() {
    const { current, upcoming } = Research.getCurrentTrends();

    const currentEl = document.getElementById('rs-trends-current');
    const upcomingEl = document.getElementById('rs-trends-upcoming');

    if (!currentEl || !upcomingEl) return;

    if (current.length === 0) {
      currentEl.innerHTML = '<p class="text-muted">今月の特別なトレンドはありません</p>';
    } else {
      currentEl.innerHTML = current.map(t => renderTrendItem(t)).join('');
    }

    if (upcoming.length === 0) {
      upcomingEl.innerHTML = '<p class="text-muted">来月の特別な注目トレンドはありません</p>';
    } else {
      upcomingEl.innerHTML = upcoming.map(t => renderTrendItem(t)).join('');
    }
  }

  function renderTrendItem(trend) {
    const dots = Array.from({ length: 5 }, (_, i) =>
      `<span class="trend-dot ${i < trend.demand ? 'active' : ''}"></span>`
    ).join('');

    const keywords = trend.keywords.slice(0, 5).map(kw =>
      `<span class="trend-keyword">${kw}</span>`
    ).join('');

    return `
      <div class="trend-item">
        <div class="trend-demand">${dots}</div>
        <div class="trend-info">
          <div class="trend-name">${trend.name}</div>
          <div class="trend-tip">${trend.tip}</div>
          <div class="trend-keywords">${keywords}</div>
        </div>
      </div>
    `;
  }

  // カテゴリーランキング
  function renderCategoryRanking() {
    const ranked = Research.getCategoryRanking();
    const container = document.getElementById('rs-category-ranking');
    if (!container) return;

    const stars = (count, max) => {
      let s = '';
      for (let j = 0; j < max; j++) s += j < Math.round(count) ? '★' : '☆';
      return s;
    };

    container.innerHTML = ranked.map((cat, i) => `
      <div class="cat-rank-item">
        <span class="cat-rank-icon">${cat.icon}</span>
        <div class="cat-rank-info">
          <div class="cat-rank-name">${cat.name} <span style="font-size:0.68rem;color:var(--text-muted)">(${cat.productCount}商品)</span></div>
          <div class="cat-rank-metrics">
            <span class="cat-rank-metric">利益率 <span class="cat-rank-metric-value">${cat.avgMargin}%</span></span>
            <span class="cat-rank-metric">回転 <span class="cat-rank-metric-value">${stars(cat.avgTurnover, 5)}</span></span>
            <span class="cat-rank-metric">難易度 <span class="cat-rank-metric-value">${stars(cat.avgDifficulty, 5)}</span></span>
          </div>
        </div>
        <span class="cat-rank-score">${Math.round(cat.score)}</span>
      </div>
    `).join('');
  }

  // 仕入れ上限価格の逆算
  function runMaxPriceCalc() {
    const salePrice = getNum('rs-rev-sale');
    const targetMargin = getNum('rs-rev-margin');

    if (!salePrice) {
      toast('想定販売価格を入力してください');
      return;
    }

    const platforms = [
      { key: 'amazon', name: 'Amazon' },
      { key: 'mercari', name: 'メルカリ' },
      { key: 'yahoo', name: 'ヤフオク' },
      { key: 'rakuma', name: 'ラクマ' },
    ];

    let html = '<div class="maxprice-grid">';
    platforms.forEach(p => {
      const maxPrice = Research.calcMaxPurchasePrice(salePrice, targetMargin, p.key);
      html += `
        <div class="maxprice-card">
          <div class="maxprice-platform">${p.name}で売る場合</div>
          <div class="maxprice-value">¥${fmt(maxPrice)}</div>
          <div class="maxprice-label">まで仕入れOK</div>
        </div>
      `;
    });
    html += '</div>';

    const resultEl = document.getElementById('rs-maxprice-result');
    resultEl.innerHTML = html;
    resultEl.classList.remove('hidden');
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
