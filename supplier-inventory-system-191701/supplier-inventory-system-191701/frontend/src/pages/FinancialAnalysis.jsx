import React, { useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  HStack,
  VStack,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Container,
  Stack,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { MdAttachMoney, MdShowChart, MdPieChart, MdTrendingUp } from 'react-icons/md';
import ReactECharts from 'echarts-for-react';
import useStore from '../store/store';
import { formatCurrency, formatPercent, aggregateMonthlyStats } from '../utils/calculations';

const FinancialAnalysis = () => {
  // 从全局状态获取数据
  const { transactions, products } = useStore();

  // 1. 数据预处理：仅筛选销售记录(有客户ID)，并关联商品成本
  const salesData = useMemo(() => {
    if (!transactions || !transactions.length) return [];
    
    // 建立商品成本查询表
    const productCostMap = new Map();
    (products || []).forEach(p => {
      productCostMap.set(String(p.id), Number(p.costPrice || 0));
    });

    // 过滤出销售单并计算毛利（有客户ID的都是销售）
    return transactions
      .filter(t => t.customerId) // 仅销售
      .map(t => {
        const qty = Number(t.quantity || 0);
        const salePrice = Number(t.price || 0);
        const costPrice = productCostMap.get(String(t.productId)) || 0;
        
        const amount = qty * salePrice;
        const totalCost = qty * costPrice;
        
        return {
          ...t,
          date: t.date,
          amount, // 销售额
          cost: totalCost, // 成本
          profit: amount - totalCost // 毛利
        };
      });
  }, [transactions, products]);

  // 2. 核心指标计算
  const kpi = useMemo(() => {
    const totalSales = salesData.reduce((sum, item) => sum + item.amount, 0);
    const totalCost = salesData.reduce((sum, item) => sum + item.cost, 0);
    const totalProfit = totalSales - totalCost;
    const margin = totalSales > 0 ? totalProfit / totalSales : 0;
    const orderCount = salesData.length;

    return { totalSales, totalCost, totalProfit, margin, orderCount };
  }, [salesData]);

  // 3. 月度报表数据聚合
  const monthlyStats = useMemo(() => {
    return aggregateMonthlyStats(salesData);
  }, [salesData]);

  // 4. 图表配置：月度经营趋势
  const trendOption = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['销售额', '毛利润', '毛利率'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthlyStats.map(i => i.month),
      axisLine: { lineStyle: { color: '#A48660' } }
    },
    yAxis: [
      { type: 'value', name: '金额', axisLine: { show: false }, splitLine: { lineStyle: { type: 'dashed' } } },
      { type: 'value', name: '利率', max: 1, axisLabel: { formatter: (val) => (val * 100).toFixed(0) + '%' }, splitLine: { show: false } }
    ],
    series: [
      { name: '销售额', type: 'bar', data: monthlyStats.map(i => i.sales), itemStyle: { color: '#B8A081' }, barMaxWidth: 40 },
      { name: '毛利润', type: 'bar', data: monthlyStats.map(i => i.profit), itemStyle: { color: '#4A3B32' }, barMaxWidth: 40 },
      { name: '毛利率', type: 'line', yAxisIndex: 1, data: monthlyStats.map(i => i.sales > 0 ? (i.profit / i.sales) : 0), itemStyle: { color: '#D14D72' }, smooth: true }
    ]
  }), [monthlyStats]);

  // 5. 图表配置：成本/利润构成 (最近一个月)
  const pieOption = useMemo(() => {
    if (monthlyStats.length === 0) return {};
    const lastMonth = monthlyStats[monthlyStats.length - 1];
    return {
      title: { text: `${lastMonth.month} 盈亏构成`, left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'item' },
      series: [
        {
          name: '经营构成',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
          data: [
            { value: lastMonth.cost, name: '商品成本', itemStyle: { color: '#DFD3C3' } },
            { value: lastMonth.profit, name: '经营毛利', itemStyle: { color: '#D14D72' } },
          ]
        }
      ]
    };
  }, [monthlyStats]);

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" color="brand.800" mb={2}>经营分析</Heading>
          <Text color="gray.600">实时洞察销售业绩、成本结构与盈利能力</Text>
        </Box>

        {/* 核心KPI卡片 */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
          <Card bg="white" borderTop="4px solid" borderColor="brand.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">总销售额 (Revenue)</StatLabel>
                <HStack align="baseline">
                  <Icon as={MdAttachMoney} w={6} h={6} color="brand.500" />
                  <StatNumber fontSize="2xl" color="brand.800">{formatCurrency(kpi.totalSales)}</StatNumber>
                </HStack>
                <StatHelpText>累计订单 {kpi.orderCount} 笔</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg="white" borderTop="4px solid" borderColor="brand.300">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">总商品成本 (COGS)</StatLabel>
                <HStack align="baseline">
                  <Icon as={MdTrendingUp} w={6} h={6} color="brand.300" />
                  <StatNumber fontSize="2xl" color="brand.600">{formatCurrency(kpi.totalCost)}</StatNumber>
                </HStack>
                <StatHelpText>占比 {formatPercent(kpi.totalSales > 0 ? kpi.totalCost / kpi.totalSales : 0)}</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="white" borderTop="4px solid" borderColor="accent.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">毛利润 (Gross Profit)</StatLabel>
                <HStack align="baseline">
                  <Icon as={MdShowChart} w={6} h={6} color="accent.500" />
                  <StatNumber fontSize="2xl" color="accent.600">{formatCurrency(kpi.totalProfit)}</StatNumber>
                </HStack>
                <StatHelpText>
                  <StatArrow type={kpi.totalProfit >= 0 ? 'increase' : 'decrease'} />
                  净收益
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="white" borderTop="4px solid" borderColor="accent.300">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">平均毛利率</StatLabel>
                <HStack align="baseline">
                  <Icon as={MdPieChart} w={6} h={6} color="accent.300" />
                  <StatNumber fontSize="2xl" color="brand.700">{formatPercent(kpi.margin)}</StatNumber>
                </HStack>
                <StatHelpText>行业基准: 25%~35%</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* 图表区域 */}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
          {/* 左侧：主趋势图 */}
          <Card gridColumn={{ lg: "span 2" }} variant="outline">
            <CardBody>
              <Heading size="md" mb={4} color="brand.700">月度收支趋势</Heading>
              <Box h="350px">
                {monthlyStats.length > 0 ? (
                  <ReactECharts option={trendOption} style={{ height: '100%', width: '100%' }} />
                ) : (
                  <Stack align="center" justify="center" h="100%" color="gray.400">
                    <Icon as={MdShowChart} w={12} h={12} />
                    <Text>暂无销售数据，请先导入或录入订单</Text>
                  </Stack>
                )}
              </Box>
            </CardBody>
          </Card>

          {/* 右侧：近期盈亏构成 */}
          <Card variant="outline">
            <CardBody>
              <Heading size="md" mb={4} color="brand.700">近期构成</Heading>
              <Box h="350px">
                {monthlyStats.length > 0 ? (
                  <ReactECharts option={pieOption} style={{ height: '100%', width: '100%' }} />
                ) : (
                  <Stack align="center" justify="center" h="100%" color="gray.400">
                    <Icon as={MdPieChart} w={12} h={12} />
                    <Text>暂无数据</Text>
                  </Stack>
                )}
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* 详细月报表表格 */}
        <Card variant="outline">
          <CardBody>
            <Heading size="md" mb={4} color="brand.700">月度经营明细表</Heading>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="brand.50">
                  <Tr>
                    <Th>月份</Th>
                    <Th isNumeric>销售额</Th>
                    <Th isNumeric>成本 (COGS)</Th>
                    <Th isNumeric>毛利润</Th>
                    <Th isNumeric>毛利率</Th>
                    <Th>评级</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {monthlyStats.length > 0 ? (
                    [...monthlyStats].reverse().map((row, index) => {
                      const margin = row.sales > 0 ? row.profit / row.sales : 0;
                      return (
                        <Tr key={index}>
                          <Td fontWeight="medium">{row.month}</Td>
                          <Td isNumeric>{formatCurrency(row.sales)}</Td>
                          <Td isNumeric color="gray.500">{formatCurrency(row.cost)}</Td>
                          <Td isNumeric fontWeight="bold" color={row.profit >= 0 ? "brand.700" : "red.500"}>
                            {formatCurrency(row.profit)}
                          </Td>
                          <Td isNumeric>{formatPercent(margin)}</Td>
                          <Td>
                            {margin >= 0.3 ? (
                              <Badge colorScheme="green">优</Badge>
                            ) : margin >= 0.1 ? (
                              <Badge colorScheme="orange">良</Badge>
                            ) : (
                              <Badge colorScheme="red">需关注</Badge>
                            )}
                          </Td>
                        </Tr>
                      );
                    })
                  ) : (
                    <Tr><Td colSpan={6} textAlign="center" color="gray.500">暂无数据</Td></Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>

        {/* 动态插槽 */}
        <Box id="financial-slot-footer" />
      </VStack>
    </Container>
  );
};

export default FinancialAnalysis;