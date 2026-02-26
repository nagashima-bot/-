/**
 * ローカルストレージによるデータ永続化
 */
const Storage = (() => {
  const KEYS = {
    PRODUCTS: 'sedori_products',
    SETTINGS: 'sedori_settings',
    HISTORY: 'sedori_calc_history',
    RESEARCH: 'sedori_research',
  };

  function save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  }

  function load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  }

  // --- 商品管理 ---
  function getProducts() {
    return load(KEYS.PRODUCTS, []);
  }

  function saveProducts(products) {
    return save(KEYS.PRODUCTS, products);
  }

  function addProduct(product) {
    const products = getProducts();
    product.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    product.createdAt = new Date().toISOString();
    product.updatedAt = new Date().toISOString();
    products.unshift(product);
    saveProducts(products);
    return product;
  }

  function updateProduct(id, updates) {
    const products = getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
    saveProducts(products);
    return products[index];
  }

  function deleteProduct(id) {
    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
  }

  // --- 設定 ---
  function getSettings() {
    return load(KEYS.SETTINGS, {
      amazonSellerType: 'professional',
      amazonCategory: 'other',
      useFba: false,
      monthlyVolume: 30,
      yahooPremium: true,
      mercariShipping: 'nekopos',
      packagingCost: 30,
      domesticShipping: 0,
      importShipping: 800,
      importTaxRate: 10,
      storageCost: 0,
      targetProfitRate: 20,
      darkMode: false,
    });
  }

  function saveSettings(settings) {
    return save(KEYS.SETTINGS, settings);
  }

  // --- 計算履歴 ---
  function getHistory() {
    return load(KEYS.HISTORY, []);
  }

  function addHistory(entry) {
    const history = getHistory();
    entry.id = Date.now().toString(36);
    entry.timestamp = new Date().toISOString();
    history.unshift(entry);
    // 最大100件保持
    if (history.length > 100) history.length = 100;
    save(KEYS.HISTORY, history);
    return entry;
  }

  function clearHistory() {
    save(KEYS.HISTORY, []);
  }

  // --- リサーチデータ ---
  function getResearchItems() {
    return load(KEYS.RESEARCH, []);
  }

  function addResearchItem(item) {
    const items = getResearchItems();
    item.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    item.createdAt = new Date().toISOString();
    items.unshift(item);
    if (items.length > 200) items.length = 200;
    save(KEYS.RESEARCH, items);
    return item;
  }

  function clearResearchItems() {
    save(KEYS.RESEARCH, []);
  }

  // --- エクスポート/インポート ---
  function exportAll() {
    return {
      products: getProducts(),
      settings: getSettings(),
      history: getHistory(),
      research: getResearchItems(),
      exportedAt: new Date().toISOString(),
    };
  }

  function importAll(data) {
    if (data.products) saveProducts(data.products);
    if (data.settings) saveSettings(data.settings);
    if (data.history) save(KEYS.HISTORY, data.history);
    if (data.research) save(KEYS.RESEARCH, data.research);
  }

  // --- ダッシュボード統計 ---
  function getStats() {
    const products = getProducts();
    const totalInvestment = products
      .filter(p => p.status === 'purchased' || p.status === 'listed' || p.status === 'sold')
      .reduce((sum, p) => sum + (p.purchasePrice || 0), 0);

    const totalRevenue = products
      .filter(p => p.status === 'sold')
      .reduce((sum, p) => sum + (p.actualSalePrice || p.salePrice || 0), 0);

    const totalFees = products
      .filter(p => p.status === 'sold')
      .reduce((sum, p) => sum + (p.actualFees || 0), 0);

    const totalProfit = products
      .filter(p => p.status === 'sold')
      .reduce((sum, p) => sum + (p.actualProfit || 0), 0);

    const inStock = products.filter(p => p.status === 'purchased' || p.status === 'listed').length;
    const soldCount = products.filter(p => p.status === 'sold').length;
    const researchCount = products.filter(p => p.status === 'research').length;

    return {
      totalInvestment,
      totalRevenue,
      totalFees,
      totalProfit,
      profitRate: totalRevenue > 0 ? Math.round(totalProfit / totalRevenue * 1000) / 10 : 0,
      roi: totalInvestment > 0 ? Math.round(totalProfit / totalInvestment * 1000) / 10 : 0,
      inStock,
      soldCount,
      researchCount,
      totalProducts: products.length,
    };
  }

  return {
    getProducts,
    saveProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getSettings,
    saveSettings,
    getHistory,
    addHistory,
    clearHistory,
    getResearchItems,
    addResearchItem,
    clearResearchItems,
    exportAll,
    importAll,
    getStats,
  };
})();

if (typeof module !== 'undefined') module.exports = Storage;
