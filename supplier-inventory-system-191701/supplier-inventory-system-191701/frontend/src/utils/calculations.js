/**
 * 业务计算工具库
 * 包含库存周转、资金分析、客户RFM模型等核心算法
 */

// 货币格式化
export const formatCurrency = (val) => 
  new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(val || 0);

// 百分比格式化
export const formatPercent = (val, decimals = 1) => {
  if (!isFinite(val)) return '0%';
  return `${(val * 100).toFixed(decimals)}%`;
};

// 1. 库存周转率 = 销售额 / 平均库存
export const calcTurnoverRate = (sales, avgInventory) => {
  if (!avgInventory || avgInventory <= 0) return 0;
  return Number((sales / avgInventory).toFixed(2));
};

// 2. 缺货率计算
export const calcStockoutRate = (products = []) => {
  if (!products.length) return 0;
  const zeroStock = products.filter(p => (p.stock || 0) <= 0).length;
  return zeroStock / products.length;
};

// 3. 毛利率 = (销售额 - 成本) / 销售额
export const calcGrossMargin = (revenue, cost) => {
  if (!revenue || revenue <= 0) return 0;
  return (revenue - cost) / revenue;
};

// 4. 逾期判断
export const isOverdue = (dueDateStr) => {
  if (!dueDateStr) return false;
  return new Date(dueDateStr) < new Date().setHours(0,0,0,0);
};

// 5. 计算逾期天数
export const getOverdueDays = (dueDateStr) => {
  if (!dueDateStr) return 0;
  const today = new Date().setHours(0,0,0,0);
  const due = new Date(dueDateStr).setHours(0,0,0,0);
  if (due >= today) return 0;
  return Math.ceil((today - due) / (86400000));
};

// 6. 客户挂账分析汇总
export const analyzeAR = (arRecords = []) => {
  return arRecords.reduce((acc, curr) => {
    if (curr.status !== 'cleared') {
      const amt = Number(curr.amount || 0);
      acc.total += amt;
      if (isOverdue(curr.dueDate)) {
        acc.overdue += amt;
        acc.overdueCount += 1;
      }
    }
    return acc;
  }, { total: 0, overdue: 0, overdueCount: 0 });
};

// 7. RFM模型计算 (Recency, Frequency, Monetary)
export const calcRFM = (orders = []) => {
  if (!orders.length) return { R: 0, F: 0, M: 0, score: 0 };
  
  const sorted = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
  const R = Math.ceil((new Date() - new Date(sorted[0].date)) / 86400000); // 天数
  const F = orders.length; // 频次
  const M = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0); // 金额

  // 简易评分 (1-5分)
  let score = 0;
  score += R <= 30 ? 5 : (R <= 90 ? 3 : 1);
  score += F >= 10 ? 5 : (F >= 3 ? 3 : 1);
  score += M >= 10000 ? 5 : (M >= 2000 ? 3 : 1);

  return { R, F, M, score };
};

// 8. 月度经营报表聚合
export const aggregateMonthlyStats = (records = []) => {
  const map = {};
  records.forEach(r => {
    const month = r.date.substring(0, 7);
    if (!map[month]) map[month] = { month, sales: 0, cost: 0, profit: 0 };
    
    const amt = Number(r.amount || 0);
    const cost = Number(r.cost || 0);
    map[month].sales += amt;
    map[month].cost += cost;
    map[month].profit += (amt - cost);
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
};