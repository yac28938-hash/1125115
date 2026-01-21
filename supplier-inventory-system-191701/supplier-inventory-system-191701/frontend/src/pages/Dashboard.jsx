import React, { useMemo } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Icon,
  Button,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  MdAttachMoney, 
  MdInventory, 
  MdPeople, 
  MdWarning, 
  MdTrendingUp,
  MdImportExport 
} from 'react-icons/md';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import ReactECharts from 'echarts-for-react';
import useStore from '../store/store';
import { formatCurrency, isOverdue } from '../utils/calculations';

const Dashboard = () => {
  const { products, transactions, arRecords, customers } = useStore();

  // 1. 核心指标计算
  const stats = useMemo(() => {
    // 销售总额 (仅计算销售单，即有客户ID的)
    const totalSales = (transactions || [])
      .filter(t => t.customerId && !t.supplierId)
      .reduce((sum, t) => sum + Number(t.price || 0) * Number(t.quantity || 0), 0);

    // 待收账款 (挂账未结清)
    const pendingAR = (arRecords || [])
      .filter(r => r.status !== 'cleared')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    // 逾期账款
    const overdueAR = (arRecords || [])
      .filter(r => r.status !== 'cleared' && isOverdue(r.dueDate))
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    // 库存总成本
    const inventoryCost = (products || [])
      .reduce((sum, p) => sum + (Number(p.stock || 0) * Number(p.costPrice || 0)), 0);

    // 低库存预警数
    const lowStockCount = (products || [])
      .filter(p => (p.stock || 0) <= (p.safeStock || 0))
      .length;

    return { totalSales, pendingAR, overdueAR, inventoryCost, lowStockCount };
  }, [products, transactions, arRecords]);

  // 2. 销售趋势图表数据 (最近30天)
  const salesTrendOption = useMemo(() => {
    const dailyData = {};
    const today = new Date();
    const dates = [];
    
    // 初始化最近30天日期
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);
        dailyData[dateStr] = 0;
    }

    // 填充数据
    (transactions || []).forEach(t => {
        if (t.customerId && !t.supplierId && dailyData[t.date] !== undefined) {
            dailyData[t.date] += Number(t.price || 0) * Number(t.quantity || 0);
        }
    });

    return {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { 
            type: 'category', 
            data: dates.map(d => d.slice(5)), // 只显示 MM-DD
            axisLine: { lineStyle: { color: '#A48660' } }
        },
        yAxis: { 
            type: 'value', 
            splitLine: { lineStyle: { type: 'dashed' } } 
        },
        series: [{
            name: '销售额',
            type: 'line',
            smooth: true,
            data: dates.map(d => dailyData[d]),
            itemStyle: { color: '#D14D72' },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(209, 77, 114, 0.3)' },
                        { offset: 1, color: 'rgba(209, 77, 114, 0)' }
                    ]
                }
            }
        }]
    };
  }, [transactions]);

  // 3. 挂账构成饼图
  const arPieOption = useMemo(() => {
      const normal = stats.pendingAR - stats.overdueAR;
      
      return {
          tooltip: { trigger: 'item' },
          legend: { bottom: '0%' },
          series: [
              {
                  name: '挂账分布',
                  type: 'pie',
                  radius: ['40%', '70%'],
                  avoidLabelOverlap: false,
                  itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
                  label: { show: false, position: 'center' },
                  emphasis: {
                      label: { show: true, fontSize: '16', fontWeight: 'bold' }
                  },
                  data: [
                      { value: normal, name: '正常账期', itemStyle: { color: '#836B4D' } },
                      { value: stats.overdueAR, name: '已逾期', itemStyle: { color: '#D14D72' } },
                  ]
              }
          ]
      };
  }, [stats]);

  // 4. 最近交易记录 (前5条)
  const recentTransactions = useMemo(() => {
      return [...(transactions || [])]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5)
          .map(t => ({
              ...t,
              type: t.customerId ? '销售' : '采购',
              partner: t.customerId || t.supplierId
          }));
  }, [transactions]);

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" color="brand.800">概览仪表盘</Heading>
          <Text color="gray.600">欢迎回来，这里是您的生意经营全景视图</Text>
        </Box>

        {/* 核心指标卡片 */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
            {/* 销售总额 */}
            <Card borderTop="4px solid" borderColor="brand.500">
                <CardBody>
                    <Stat>
                        <StatLabel color="gray.500">累计销售额</StatLabel>
                        <Flex alignItems="center">
                            <Icon as={MdTrendingUp} w={6} h={6} color="brand.500" mr={2} />
                            <StatNumber fontSize="2xl" color="brand.800">
                                {formatCurrency(stats.totalSales)}
                            </StatNumber>
                        </Flex>
                        <StatHelpText>持续增长中</StatHelpText>
                    </Stat>
                </CardBody>
            </Card>

            {/* 待收账款 */}
            <Card borderTop="4px solid" borderColor={stats.overdueAR > 0 ? "red.500" : "orange.400"}>
                <CardBody>
                    <Stat>
                        <StatLabel color="gray.500">待收挂账总额</StatLabel>
                        <Flex alignItems="center">
                            <Icon as={MdAttachMoney} w={6} h={6} color={stats.overdueAR > 0 ? "red.500" : "orange.400"} mr={2} />
                            <StatNumber fontSize="2xl" color="brand.800">
                                {formatCurrency(stats.pendingAR)}
                            </StatNumber>
                        </Flex>
                        <StatHelpText color={stats.overdueAR > 0 ? "red.500" : "gray.500"}>
                            {stats.overdueAR > 0 ? (
                                <HStack spacing={1}>
                                    <Icon as={MdWarning} />
                                    <Text>逾期: {formatCurrency(stats.overdueAR)}</Text>
                                </HStack>
                            ) : "暂无逾期款项"}
                        </StatHelpText>
                    </Stat>
                </CardBody>
            </Card>

            {/* 库存预警 */}
            <Card borderTop="4px solid" borderColor={stats.lowStockCount > 0 ? "red.400" : "green.500"}>
                <CardBody>
                    <Stat>
                        <StatLabel color="gray.500">库存预警商品</StatLabel>
                        <Flex alignItems="center">
                            <Icon as={MdInventory} w={6} h={6} color={stats.lowStockCount > 0 ? "red.400" : "green.500"} mr={2} />
                            <StatNumber fontSize="2xl" color="brand.800">
                                {stats.lowStockCount} <Text as="span" fontSize="md" color="gray.400">个SKU</Text>
                            </StatNumber>
                        </Flex>
                        <StatHelpText>
                            {stats.lowStockCount > 0 ? "建议尽快补货" : "库存水平健康"}
                        </StatHelpText>
                    </Stat>
                </CardBody>
            </Card>

            {/* 客户总数 */}
            <Card borderTop="4px solid" borderColor="accent.400">
                <CardBody>
                    <Stat>
                        <StatLabel color="gray.500">活跃客户总数</StatLabel>
                        <Flex alignItems="center">
                            <Icon as={MdPeople} w={6} h={6} color="accent.400" mr={2} />
                            <StatNumber fontSize="2xl" color="brand.800">
                                {customers?.length || 0}
                            </StatNumber>
                        </Flex>
                        <StatHelpText>累计合作客户</StatHelpText>
                    </Stat>
                </CardBody>
            </Card>
        </SimpleGrid>

        {/* 图表区域 */}
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
            {/* 销售趋势 */}
            <Card gridColumn={{ lg: "span 2" }} variant="outline">
                <CardHeader pb={0}>
                    <Heading size="md" color="brand.700">近30天销售趋势</Heading>
                </CardHeader>
                <CardBody>
                    <Box h="300px">
                        <ReactECharts option={salesTrendOption} style={{ height: '100%', width: '100%' }} />
                    </Box>
                </CardBody>
            </Card>

            {/* 挂账分布 */}
            <Card variant="outline">
                <CardHeader pb={0}>
                    <Heading size="md" color="brand.700">挂账资金分布</Heading>
                </CardHeader>
                <CardBody>
                     <Box h="300px">
                        {stats.pendingAR > 0 ? (
                            <ReactECharts option={arPieOption} style={{ height: '100%', width: '100%' }} />
                        ) : (
                            <Flex h="100%" align="center" justify="center" direction="column" color="gray.400">
                                <Icon as={MdAttachMoney} w={12} h={12} mb={2} />
                                <Text>暂无挂账记录</Text>
                            </Flex>
                        )}
                    </Box>
                </CardBody>
            </Card>
        </SimpleGrid>

        {/* 底部功能区：快捷入口与最近记录 */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* 最近交易 */}
            <Card variant="outline">
                <CardHeader>
                    <Flex justify="space-between" align="center">
                        <Heading size="md" color="brand.700">最近交易动态</Heading>
                        <Button as={RouterLink} to="/inventory" size="xs" variant="ghost" rightIcon={<ArrowForwardIcon />}>
                            全部记录
                        </Button>
                    </Flex>
                </CardHeader>
                <CardBody pt={0}>
                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr>
                                <Th>日期</Th>
                                <Th>类型</Th>
                                <Th>对象</Th>
                                <Th isNumeric>金额</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {recentTransactions.length > 0 ? (
                                recentTransactions.map((t, idx) => (
                                    <Tr key={idx}>
                                        <Td color="gray.500">{t.date}</Td>
                                        <Td>
                                            <Badge colorScheme={t.type === '销售' ? 'green' : 'blue'}>
                                                {t.type}
                                            </Badge>
                                        </Td>
                                        <Td fontWeight="medium">{t.partner}</Td>
                                        <Td isNumeric fontWeight="bold" color={t.type === '销售' ? 'brand.600' : 'gray.600'}>
                                            {formatCurrency(Number(t.price) * Number(t.quantity))}
                                        </Td>
                                    </Tr>
                                ))
                            ) : (
                                <Tr><Td colSpan={4} textAlign="center" py={4} color="gray.400">暂无数据</Td></Tr>
                            )}
                        </Tbody>
                    </Table>
                </CardBody>
            </Card>

            {/* 快捷操作 */}
            <Card variant="outline" bg="brand.50">
                <CardHeader>
                    <Heading size="md" color="brand.700">常用操作</Heading>
                </CardHeader>
                <CardBody pt={0}>
                    <SimpleGrid columns={2} spacing={4}>
                        <Button 
                            as={RouterLink} 
                            to="/import" 
                            h="80px" 
                            colorScheme="brand" 
                            variant="solid"
                            leftIcon={<Icon as={MdImportExport} w={6} h={6} />}
                            justifyContent="flex-start"
                            pl={6}
                        >
                            <VStack align="start" spacing={0}>
                                <Text fontSize="md">导入数据</Text>
                                <Text fontSize="xs" fontWeight="normal" opacity={0.8}>Excel/CSV 批量上传</Text>
                            </VStack>
                        </Button>

                        <Button 
                            as={RouterLink} 
                            to="/inventory" 
                            h="80px" 
                            colorScheme="teal" 
                            variant="solid"
                            leftIcon={<Icon as={MdInventory} w={6} h={6} />}
                            justifyContent="flex-start"
                            pl={6}
                        >
                            <VStack align="start" spacing={0}>
                                <Text fontSize="md">库存盘点</Text>
                                <Text fontSize="xs" fontWeight="normal" opacity={0.8}>查看预警与补货</Text>
                            </VStack>
                        </Button>

                        <Button 
                            as={RouterLink} 
                            to="/ar" 
                            h="80px" 
                            colorScheme="orange" 
                            variant="solid"
                            leftIcon={<Icon as={MdAttachMoney} w={6} h={6} />}
                            justifyContent="flex-start"
                            pl={6}
                        >
                            <VStack align="start" spacing={0}>
                                <Text fontSize="md">挂账催收</Text>
                                <Text fontSize="xs" fontWeight="normal" opacity={0.8}>处理 {stats.overdueAR > 0 ? '逾期' : '待收'} 账款</Text>
                            </VStack>
                        </Button>

                        <Button 
                            as={RouterLink} 
                            to="/analysis/customer" 
                            h="80px" 
                            colorScheme="pink" 
                            variant="solid"
                            leftIcon={<Icon as={MdPeople} w={6} h={6} />}
                            justifyContent="flex-start"
                            pl={6}
                        >
                            <VStack align="start" spacing={0}>
                                <Text fontSize="md">客户分析</Text>
                                <Text fontSize="xs" fontWeight="normal" opacity={0.8}>查看RFM价值模型</Text>
                            </VStack>
                        </Button>
                    </SimpleGrid>
                </CardBody>
            </Card>
        </SimpleGrid>

        {/* 动态插槽 */}
        <Box id="dashboard-slot-bottom" />
      </VStack>
    </Container>
  );
};

export default Dashboard;