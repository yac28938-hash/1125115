import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './styles/theme';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Outbound from './pages/Outbound';
import Inbound from './pages/Inbound'; // 新增：入库管理页面
import AccountsReceivable from './pages/AccountsReceivable';
import CustomerAnalysis from './pages/CustomerAnalysis';
import FinancialAnalysis from './pages/FinancialAnalysis';
import DataImport from './pages/DataImport';

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="outbound" element={<Outbound />} />
            <Route path="inbound" element={<Inbound />} /> {/* 新增：入库管理路由 */}
            <Route path="ar" element={<AccountsReceivable />} />
            <Route path="analysis/customer" element={<CustomerAnalysis />} />
            <Route path="analysis/financial" element={<FinancialAnalysis />} />
            <Route path="import" element={<DataImport />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ChakraProvider>
  );
};

export default App;