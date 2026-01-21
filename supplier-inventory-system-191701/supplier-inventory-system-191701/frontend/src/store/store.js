import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 初始模拟数据生成器
const generateInitialData = () => {
  const products = [
    { id: 'P1001', name: '无线机械键盘', category: '电子配件', stock: 120, safeStock: 50, costPrice: 180, salePrice: 399 },
    { id: 'P1002', name: '人体工学椅', category: '办公家具', stock: 45, safeStock: 20, costPrice: 450, salePrice: 1299 },
    { id: 'P1003', name: '高清显示器 27寸', category: '电子配件', stock: 8, safeStock: 15, costPrice: 850, salePrice: 1599 },
    { id: 'P1004', name: 'Type-C扩展坞', category: '电子配件', stock: 200, safeStock: 30, costPrice: 65, salePrice: 159 },
    { id: 'P1005', name: '精品咖啡豆 500g', category: '食品饮料', stock: 0, safeStock: 20, costPrice: 45, salePrice: 98 },
  ];

  const customers = [
    { id: 'C001', name: '科技先锋有限公司', contact: '张经理', creditLimit: 50000, arBalance: 12500 },
    { id: 'C002', name: '未来网咖连锁', contact: '李店长', creditLimit: 20000, arBalance: 0 },
    { id: 'C003', name: '极客工作室', contact: '王总监', creditLimit: 100000, arBalance: 45000 },
    { id: 'C004', name: '汇通贸易', contact: '赵会计', creditLimit: 30000, arBalance: 8000 },
  ];

  const suppliers = [
    { id: 'S001', name: '深南电子厂', contact: '陈工' },
    { id: 'S002', name: '安吉家具直供', contact: '刘厂长' },
  ];

  const transactions = [];
  const arRecords = [];
  const outboundRecords = [];
  const inboundRecords = []; // 新增：入库记录初始数据
  const today = new Date();

  // 模拟 C001 的一笔未结清挂账 (逾期)
  const date1 = new Date(today);
  date1.setDate(today.getDate() - 45);
  const dateStr1 = date1.toISOString().split('T')[0];
  const amount1 = 20 * 399;
  transactions.push({
    id: 'TR-INIT-001', date: dateStr1, productId: 'P1001', quantity: 20, price: 399,
    customerId: 'C001', isCredit: true, amount: amount1
  });
  arRecords.push({
    id: 'AR-INIT-001', customerId: 'C001', amount: amount1, 
    date: dateStr1, dueDate: new Date(date1.setDate(date1.getDate() + 30)).toISOString().split('T')[0],
    status: 'pending'
  });

  // 模拟 C003 的一笔大额挂账 (未逾期)
  const date2 = new Date(today);
  date2.setDate(today.getDate() - 10);
  const dateStr2 = date2.toISOString().split('T')[0];
  const amount2 = 10 * 1599;
  transactions.push({
    id: 'TR-INIT-002', date: dateStr2, productId: 'P1003', quantity: 10, price: 1599,
    customerId: 'C003', isCredit: true, amount: amount2
  });
  arRecords.push({
    id: 'AR-INIT-002', customerId: 'C003', amount: amount2, 
    date: dateStr2, dueDate: new Date(date2.setDate(date2.getDate() + 30)).toISOString().split('T')[0],
    status: 'pending'
  });

  // 增加更多历史交易记录用于分析
  const date3 = new Date(today);
  date3.setDate(today.getDate() - 60);
  const dateStr3 = date3.toISOString().split('T')[0];
  const amount3 = 5 * 399;
  transactions.push({
    id: 'TR-INIT-003', date: dateStr3, productId: 'P1001', quantity: 5, price: 399,
    customerId: 'C001', isCredit: false, amount: amount3
  });

  const date4 = new Date(today);
  date4.setDate(today.getDate() - 5);
  const dateStr4 = date4.toISOString().split('T')[0];
  const amount4 = 15 * 159;
  transactions.push({
    id: 'TR-INIT-004', date: dateStr4, productId: 'P1004', quantity: 15, price: 159,
    customerId: 'C002', isCredit: false, amount: amount4
  });

  const date5 = new Date(today);
  date5.setDate(today.getDate() - 30);
  const dateStr5 = date5.toISOString().split('T')[0];
  const amount5 = 3 * 1299;
  transactions.push({
    id: 'TR-INIT-005', date: dateStr5, productId: 'P1002', quantity: 3, price: 1299,
    customerId: 'C003', isCredit: false, amount: amount5
  });

  const date6 = new Date(today);
  date6.setDate(today.getDate() - 20);
  const dateStr6 = date6.toISOString().split('T')[0];
  const amount6 = 10 * 159;
  const dueDate6 = new Date(date6);
  dueDate6.setDate(dueDate6.getDate() + 30);
  transactions.push({
    id: 'TR-INIT-006', date: dateStr6, productId: 'P1004', quantity: 10, price: 159,
    customerId: 'C004', isCredit: true, amount: amount6
  });
  arRecords.push({
    id: 'AR-INIT-003', customerId: 'C004', amount: amount6, 
    date: dateStr6, dueDate: dueDate6.toISOString().split('T')[0],
    status: 'pending'
  });

  customers[0].arBalance = amount1;
  customers[2].arBalance = amount2;  
  customers[3].arBalance = amount6;

  // 模拟入库记录
  const date7 = new Date(today);
  date7.setDate(today.getDate() - 3);
  const dateStr7 = date7.toISOString().split('T')[0];
  inboundRecords.push({
    id: 'IN-INIT-001', productId: 'P1001', productName: '无线机械键盘', quantity: 50, price: 180,
    supplierId: 'S001', supplierName: '深南电子厂', date: dateStr7, remark: '季度补货'
  });
  transactions.push({
    id: 'TR-IN-INIT-001', date: dateStr7, productId: 'P1001', quantity: 50, price: 180,
    supplierId: 'S001', isCredit: false, amount: 50 * 180
  });

  return { products, customers, suppliers, transactions, arRecords, outboundRecords, inboundRecords };
};

const initialData = generateInitialData();

const useStore = create(
  persist(
    (set, get) => ({
      products: initialData.products,
      customers: initialData.customers,
      suppliers: initialData.suppliers,
      transactions: initialData.transactions,
      arRecords: initialData.arRecords,
      outboundRecords: initialData.outboundRecords,
      inboundRecords: initialData.inboundRecords, // 新增：状态绑定

      // --------------------------------------------------------
      // Action: 批量导入交易数据
      // --------------------------------------------------------
      importTransactions: (newData) => set((state) => {
        const updatedProducts = [...state.products];
        const updatedCustomers = [...state.customers];
        const updatedSuppliers = [...state.suppliers];
        const updatedTransactions = [...state.transactions];
        const updatedArRecords = [...state.arRecords];

        newData.forEach((row, index) => {
            let pIdx = updatedProducts.findIndex(p => p.id === row.productId);
            if (pIdx === -1) {
                updatedProducts.push({
                    id: row.productId,
                    name: `新商品 ${row.productId}`,
                    category: '未分类',
                    stock: 0,
                    safeStock: 10,
                    costPrice: 0,
                    salePrice: 0
                });
                pIdx = updatedProducts.length - 1;
            }

            const qty = Number(row.quantity);
            const price = Number(row.price);

            if (row.supplierId) {
                updatedProducts[pIdx].stock += qty;
                updatedProducts[pIdx].costPrice = price;
                
                if (!updatedSuppliers.find(s => s.id === row.supplierId)) {
                    updatedSuppliers.push({ id: row.supplierId, name: `供应商 ${row.supplierId}`, contact: '-' });
                }
            }

            if (row.customerId) {
                updatedProducts[pIdx].stock -= qty;
                updatedProducts[pIdx].salePrice = price;
                
                let cIdx = updatedCustomers.findIndex(c => c.id === row.customerId);
                if (cIdx === -1) {
                    updatedCustomers.push({
                        id: row.customerId,
                        name: `客户 ${row.customerId}`,
                        contact: '-',
                        creditLimit: 10000,
                        arBalance: 0
                    });
                    cIdx = updatedCustomers.length - 1;
                }

                if (row.isCredit) {
                    const amount = qty * price;
                    updatedCustomers[cIdx].arBalance += amount;
                    
                    updatedArRecords.push({
                        id: `AR-${Date.now()}-${index}`,
                        customerId: row.customerId,
                        amount: amount,
                        date: row.date,
                        dueDate: row.dueDate || row.date,
                        status: 'pending'
                    });
                }
            }

            updatedTransactions.push({
                ...row,
                id: `TR-${Date.now()}-${index}`
            });
        });

        return {
            products: updatedProducts,
            customers: updatedCustomers,
            suppliers: updatedSuppliers,
            transactions: updatedTransactions,
            arRecords: updatedArRecords
        };
      }),

      // --------------------------------------------------------
      // Action: 添加出库记录 (已更新支持 paymentMethod)
      // --------------------------------------------------------
      addOutboundRecord: (record) => set((state) => {
        const product = state.products.find(p => p.id === record.productId);
        
        if (!product) {
          throw new Error('商品不存在');
        }

        if (product.stock < record.quantity) {
          throw new Error('库存不足，无法出库');
        }

        // 确定是否挂账
        // 优先使用 isCredit 参数，如果未提供，则根据 paymentMethod === '挂账' 判断
        const isCredit = record.isCredit !== undefined 
          ? record.isCredit 
          : record.paymentMethod === '挂账';
        
        // 确定付款方式
        const paymentMethod = record.paymentMethod || (isCredit ? '挂账' : '现金');

        const newRecord = {
          id: `OUT-${Date.now()}`,
          productId: record.productId,
          productName: product.name,
          quantity: record.quantity,
          customerId: record.customerId || null,
          customerName: record.customerId 
            ? state.customers.find(c => c.id === record.customerId)?.name || '未知客户'
            : '直接销售',
          date: record.date || new Date().toISOString().split('T')[0],
          price: record.price || product.salePrice,
          amount: record.quantity * (record.price || product.salePrice),
          remark: record.remark || '',
          isCredit: isCredit,
          paymentMethod: paymentMethod
        };

        const updatedProducts = state.products.map(p => 
          p.id === record.productId 
            ? { ...p, stock: p.stock - record.quantity }
            : p
        );

        const updatedOutboundRecords = [...state.outboundRecords, newRecord];

        const updatedTransactions = [
          ...state.transactions,
          {
            id: `TR-OUT-${Date.now()}`,
            date: newRecord.date,
            productId: newRecord.productId,
            quantity: newRecord.quantity,
            price: newRecord.price,
            customerId: newRecord.customerId,
            isCredit: newRecord.isCredit,
            amount: newRecord.amount
          }
        ];

        let updatedArRecords = [...state.arRecords];
        let updatedCustomers = [...state.customers];

        if (newRecord.isCredit && newRecord.customerId) {
          const cIdx = updatedCustomers.findIndex(c => c.id === newRecord.customerId);
          if (cIdx !== -1) {
            updatedCustomers[cIdx].arBalance += newRecord.amount;
            
            const dueDate = new Date(newRecord.date);
            dueDate.setDate(dueDate.getDate() + 30);
            
            updatedArRecords.push({
              id: `AR-OUT-${Date.now()}`,
              customerId: newRecord.customerId,
              amount: newRecord.amount,
              date: newRecord.date,
              dueDate: dueDate.toISOString().split('T')[0],
              status: 'pending'
            });
          }
        }

        return {
          products: updatedProducts,
          outboundRecords: updatedOutboundRecords,
          transactions: updatedTransactions,
          arRecords: updatedArRecords,
          customers: updatedCustomers
        };
      }),

      // --------------------------------------------------------
      // Action: 添加入库记录
      // --------------------------------------------------------
      addInboundRecord: (record) => set((state) => {
        const product = state.products.find(p => p.id === record.productId);
        
        // 如果商品不存在，通常需要先去创建商品基础信息，这里假设只能对已有商品入库，或者自动容错
        // 简单处理：如果商品不存在，抛出错误让前端引导去新建商品
        if (!product) {
            throw new Error('商品不存在，请先在基础数据中添加该商品');
        }

        const newRecord = {
          id: `IN-${Date.now()}`,
          productId: record.productId,
          productName: product.name,
          quantity: record.quantity,
          supplierId: record.supplierId || null,
          supplierName: record.supplierId 
            ? state.suppliers.find(s => s.id === record.supplierId)?.name || '未知供应商'
            : '市场采购',
          date: record.date || new Date().toISOString().split('T')[0],
          price: record.price || product.costPrice,
          amount: record.quantity * (record.price || product.costPrice),
          remark: record.remark || ''
        };

        // 更新商品：库存增加，更新最新成本价
        const updatedProducts = state.products.map(p => 
          p.id === record.productId 
            ? { ...p, stock: Number(p.stock) + Number(record.quantity), costPrice: record.price }
            : p
        );

        const updatedInboundRecords = [...state.inboundRecords, newRecord];

        // 添加入库流水到 transactions
        const updatedTransactions = [
          ...state.transactions,
          {
            id: `TR-IN-${Date.now()}`,
            date: newRecord.date,
            productId: newRecord.productId,
            quantity: newRecord.quantity,
            price: newRecord.price,
            supplierId: newRecord.supplierId,
            isCredit: false, // 默认入库不记供应商挂账(简化)
            amount: newRecord.amount
          }
        ];

        return {
          products: updatedProducts,
          inboundRecords: updatedInboundRecords,
          transactions: updatedTransactions
        };
      }),

      // --------------------------------------------------------
      // Action: 删除出库记录（仅用于纠错，不回滚库存）
      // --------------------------------------------------------
      deleteOutboundRecord: (recordId) => set((state) => ({
        outboundRecords: state.outboundRecords.filter(r => r.id !== recordId)
      })),

      // --------------------------------------------------------
      // Action: 删除入库记录（仅用于纠错，不回滚库存）
      // --------------------------------------------------------
      deleteInboundRecord: (recordId) => set((state) => ({
        inboundRecords: state.inboundRecords.filter(r => r.id !== recordId)
      })),

      // --------------------------------------------------------
      // Action: 结清挂账单
      // --------------------------------------------------------
      settleArRecord: (recordId) => set((state) => {
          const record = state.arRecords.find(r => r.id === recordId);
          if (!record || record.status === 'cleared') return state;

          const updatedArRecords = state.arRecords.map(r => 
              r.id === recordId ? { ...r, status: 'cleared' } : r
          );

          const updatedCustomers = state.customers.map(c => {
              if (c.id === record.customerId) {
                  const newBalance = Math.max(0, c.arBalance - record.amount);
                  return { ...c, arBalance: newBalance };
              }
              return c;
          });

          return {
              arRecords: updatedArRecords,
              customers: updatedCustomers
          };
      }),

      // --------------------------------------------------------
      // Action: 重置系统数据 (调试用)
      // --------------------------------------------------------
      resetSystem: () => set({ ...initialData }),
    }),
    {
      name: 'haisnap-inventory-storage', 
      storage: createJSONStorage(() => localStorage), 
      partialize: (state) => ({ 
          products: state.products, 
          customers: state.customers, 
          suppliers: state.suppliers, 
          transactions: state.transactions, 
          arRecords: state.arRecords,
          outboundRecords: state.outboundRecords,
          inboundRecords: state.inboundRecords
      }),
    }
  )
);

export default useStore;