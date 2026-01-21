import * as XLSX from 'xlsx';

// 解析Excel日期格式
const parseExcelDate = (input) => {
  if (!input) return null;
  if (typeof input === 'number') {
    // 转换Excel序列日期 (1900基准)
    return new Date(Math.round((input - 25569) * 86400 * 1000)).toISOString().split('T')[0];
  }
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};

// 校验必填字段
const checkRequired = (row, msgs) => {
  if (!row['供应商ID'] && !row['客户ID']) msgs.push('缺少交易方(供应商/客户ID)');
  ['商品ID', '数量', '价格', '日期'].forEach(f => {
    if (row[f] === undefined || row[f] === '' || row[f] === null) msgs.push(`${f}缺失`);
  });
};

// 校验数值合法性
const checkNumbers = (row, msgs) => {
  const qty = Number(row['数量']);
  const price = Number(row['价格']);
  if (isNaN(qty) || qty <= 0) msgs.push('数量需为正数');
  if (isNaN(price) || price < 0) msgs.push('价格无效');
  return { qty, price };
};

// 校验挂账逻辑
const checkCredit = (row, msgs) => {
  const isCredit = ['是', 'TRUE', true].includes(row['是否挂账']);
  const dateStr = parseExcelDate(row['日期']);
  const dueDateStr = parseExcelDate(row['到期日']);

  if (isCredit) {
    if (!row['客户ID']) msgs.push('挂账需关联客户');
    if (!dueDateStr) msgs.push('挂账需到期日');
    if (dateStr && dueDateStr && new Date(dueDateStr) <= new Date(dateStr)) {
      msgs.push('到期日需晚于交易日');
    }
  }
  return { isCredit, dateStr, dueDateStr };
};

// 格式化单行输出数据
const formatRow = (row, qty, price, isCredit, dateStr, dueDateStr) => ({
  supplierId: String(row['供应商ID'] || '').trim(),
  customerId: String(row['客户ID'] || '').trim(),
  productId: String(row['商品ID'] || '').trim(),
  quantity: qty,
  price: price,
  date: dateStr,
  isCredit: isCredit,
  creditDate: isCredit ? (parseExcelDate(row['挂账日期']) || dateStr) : null,
  dueDate: isCredit ? dueDateStr : null,
});

// 处理单行数据
const processRow = (row, index) => {
  const msgs = [];
  checkRequired(row, msgs);
  const { qty, price } = checkNumbers(row, msgs);
  const { isCredit, dateStr, dueDateStr } = checkCredit(row, msgs);

  if (msgs.length > 0) {
    return { valid: false, error: { row: index + 2, messages: msgs, raw: row } };
  }
  return { valid: true, data: formatRow(row, qty, price, isCredit, dateStr, dueDateStr) };
};

/**
 * 解析并校验上传文件
 * @param {File} file 
 */
export const parseImportData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
        
        const validData = [];
        const errors = [];
        rows.forEach((row, i) => {
          const res = processRow(row, i);
          res.valid ? validData.push(res.data) : errors.push(res.error);
        });

        resolve({ 
          success: true, 
          total: rows.length, 
          validCount: validData.length, 
          errorCount: errors.length, 
          data: validData, 
          errors 
        });
      } catch (err) {
        reject({ success: false, message: '解析异常: ' + err.message });
      }
    };
    reader.onerror = () => reject({ success: false, message: '文件读取失败' });
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 生成标准导入模板
 */
export const generateTemplate = () => {
  const headers = ['供应商ID', '商品ID', '数量', '价格', '日期', '客户ID', '是否挂账', '挂账日期', '到期日'];
  const sample = [['S001', 'P1001', 50, 10, '2026-01-15', 'C001', '是', '2026-01-15', '2026-02-14']];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 10 }];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "导入模板");
  XLSX.writeFile(wb, "Inventory_Import_Template.xlsx");
};