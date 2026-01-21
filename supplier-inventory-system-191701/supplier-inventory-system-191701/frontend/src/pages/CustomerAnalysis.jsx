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
  HStack,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Container,
  Stack,
  Avatar,
  Progress,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
} from '@chakra-ui/react';
import { 
  MdPeople, 
  MdMoneyOff, 
  MdWarning, 
  MdTrendingUp, 
  MdStar 
} from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import useStore from '../store/store';
import { formatCurrency, calcRFM, isOverdue } from '../utils/calculations';

const CustomerAnalysis = () => {
  const { customers, transactions, arRecords } = useStore();

  React.useEffect(() => {
    console.log('=== 客户分析页面数据检查 ===');
    console.log('Customers:', customers?.length || 0, '条');
    console.log('Transactions:', transactions?.length || 0, '条');
    console.log('AR Records:', arRecords?.length || 0, '条');
  }, [customers, transactions, arRecords]);

  const hasData = useMemo(() => {
    return customers && customers.length > 0;
  }, [customers]);

  const customerStats = useMemo(() => {
    if (!hasData) {
      console.warn('客户数据为空，请先导入数据');
      return [];
    }

    const safeTransactions = transactions || [];
    const safeArRecords = arRecords || [];

    return customers.map(customer => {
      const customerOrders = safeTransactions.filter(t => t.customerId === customer.id);
      const rfm = calcRFM(customerOrders);

      const customerArs = safeArRecords.filter(ar => ar.customerId === customer.id && ar.status !== 'cleared');
      const totalDebt = customerArs.reduce((sum, ar) => sum + Number(ar.amount || 0), 0);
      const overdueDebt = customerArs
        .filter(ar => isOverdue(ar.dueDate))
        .reduce((sum, ar) => sum + Number(ar.amount || 0), 0);
      
      const isHighRisk = overdueDebt > 0;

      return {
        ...customer,
        rfm,
        orderCount: rfm.F,
        totalSpent: rfm.M,
        lastOrderDays: rfm.R,
        totalDebt,
        overdueDebt,
        isHighRisk,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, transactions, arRecords, hasData]);

  const kpi = useMemo(() => {
    if (!hasData) {
      return { totalCustomers: 0, activeDebtCustomers: 0, highRiskCustomers: 0, debtRatio: 0, avgSpent: 0 };
    }

    const totalCustomers = customerStats.length;
    const activeDebtCustomers = customerStats.filter(c => c.totalDebt > 0).length;
    const highRiskCustomers = customerStats.filter(c => c.isHighRisk).length;
    
    const debtRatio = totalCustomers > 0 ? activeDebtCustomers / totalCustomers : 0;
    const avgSpent = totalCustomers > 0 
      ? customerStats.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers 
      : 0;

    return { totalCustomers, activeDebtCustomers, highRiskCustomers, debtRatio, avgSpent };
  }, [customerStats, hasData]);

  const rfmChartOption = useMemo(() => {
    if (!hasData) return {};

    const scoreMap = { '高价值 (5分)': 0, '中等价值 (3-4分)': 0, '需挽留 (0-2分)': 0 };
    customerStats.forEach(c => {
      if (c.rfm.score >= 13) scoreMap['高价值 (5分)']++;
      else if (c.rfm.score >= 8) scoreMap['中等价值 (3-4分)']++;
      else scoreMap['需挽留 (0-2分)']++;
    });

    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          name: '客户价值分布',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: { 
            label: { show: true, fontSize: '18', fontWeight: 'bold' } 
          },
          data: [
            { value: scoreMap['高价值 (5分)'], name: '高价值', itemStyle: { color: '#A48660' } },
            { value: scoreMap['中等价值 (3-4分)'], name: '潜力', itemStyle: { color: '#CBB9A2' } },
            { value: scoreMap['需挽留 (0-2分)'], name: '流失风险', itemStyle: { color: '#DFD3C3' } },
          ]
        }
      ]
    };
  }, [customerStats, hasData]);

  const riskChartOption = useMemo(() => {
    if (!hasData) return {};

    const topRisk = [...customerStats]
      .filter(c => c.overdueDebt > 0)
      .sort((a, b) => b.overdueDebt - a.overdueDebt)
      .slice(0, 5);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'value', name: '逾期金额' },
      yAxis: { type: 'category', data: topRisk.map(c => c.name).reverse() },
      series: [
        {
          name: '逾期金额',
          type: 'bar',
          data: topRisk.map(c => c.overdueDebt).reverse(),
          itemStyle: { color: '#D14D72' },
          barWidth: '50%'
        }
      ]
    };
  }, [customerStats, hasData]);

  if (!hasData) {
    return (
      <Container maxW="container.xl" py={6}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" color="brand.800" mb={2}>客户分析</Heading>
            <Text color="gray.600">基于RFM模型与挂账状态，识别核心客户与潜在风险</Text>
          </Box>

          <Alert
            status="warning"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            minH="400px"
            borderRadius="lg"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              暂无客户数据
            </AlertTitle>
            <AlertDescription maxW="sm" mb={4}>
              系统检测到您还没有导入客户和交易数据。请先通过「数据导入」功能上传相关数据，才能查看客户分析报表。
            </AlertDescription>
            <Button
              as={RouterLink}
              to="/import"
              colorScheme="brand"
              size="lg"
              leftIcon={<Icon as={MdTrendingUp} />}
            >
              立即导入数据
            </Button>
          </Alert>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" color="brand.800" mb={2}>客户分析</Heading>
          <Text color="gray.600">基于RFM模型与挂账状态，识别核心客户与潜在风险</Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
          <Card borderTop="4px solid" borderColor="brand.600">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">客户总数</StatLabel>
                <HStack align="baseline">
                  <Icon as={MdPeople} w={6} h={6} color="brand.600" />
                  <StatNumber fontSize="2xl" color="brand.800">{kpi.totalCustomers}</StatNumber>
                </HStack>
                <StatHelpText>活跃度 100%</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderTop="4px solid" borderColor="orange.400">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">挂账客户占比</StatLabel>
                <HStack align="baseline">
                  <Icon as={MdMoneyOff} w={6} h={6} color="orange.400" />
                  <StatNumber fontSize="2xl" color="orange.600">
                    {((kpi.debtRatio || 0) * 100).toFixed(1)}%
                  </StatNumber>
                </HStack>
                <StatHelpText>{kpi.activeDebtCustomers} 位客户有欠款</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderTop="4px solid" borderColor="red.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">高风险客户</StatLabel>
                <HStack align="baseline">
                  <Icon as={MdWarning} w={6} h={6} color="red.500" />
                  <StatNumber fontSize="2xl" color="red.600">{kpi.highRiskCustomers}</StatNumber>
                </HStack>
                <StatHelpText>存在逾期欠款</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderTop="4px solid" borderColor="accent.400">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">平均客单总额</StatLabel>
                <HStack align="baseline">
                  <Icon as={MdTrendingUp} w={6} h={6} color="accent.400" />
                  <StatNumber fontSize="2xl" color="accent.600">{formatCurrency(kpi.avgSpent)}</StatNumber>
                </HStack>
                <StatHelpText>LTV (生命周期价值)</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Card variant="outline">
            <CardBody>
              <Heading size="md" mb={4} color="brand.700">客户价值分布 (RFM)</Heading>
              <Box h="300px">
                {customerStats.length > 0 ? (
                  <ReactECharts option={rfmChartOption} style={{ height: '100%', width: '100%' }} />
                ) : (
                  <Stack align="center" justify="center" h="100%" color="gray.400" spacing={3}>
                    <Icon as={MdPeople} w={12} h={12} />
                    <Text fontSize="sm" fontWeight="medium">暂无客户数据</Text>
                  </Stack>
                )}
              </Box>
            </CardBody>
          </Card>

          <Card variant="outline">
            <CardBody>
              <Heading size="md" mb={4} color="brand.700">高风险逾期排行 Top 5</Heading>
              <Box h="300px">
                {kpi.highRiskCustomers > 0 ? (
                  <ReactECharts option={riskChartOption} style={{ height: '100%', width: '100%' }} />
                ) : (
                  <Stack align="center" justify="center" h="100%" color="green.500" spacing={4}>
                    <Icon as={MdStar} w={12} h={12} />
                    <Text fontWeight="bold">目前没有逾期客户，经营状况良好！</Text>
                  </Stack>
                )}
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card variant="outline">
          <CardBody>
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color="brand.700">客户经营详情</Heading>
              <Badge colorScheme="brand" p={2} borderRadius="md">基于交易记录实时计算</Badge>
            </HStack>
            
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="brand.50">
                  <Tr>
                    <Th>客户名称</Th>
                    <Th>RFM 评分</Th>
                    <Th isNumeric>累计消费 (M)</Th>
                    <Th isNumeric>交易次数 (F)</Th>
                    <Th>最近购买 (R)</Th>
                    <Th isNumeric>挂账余额</Th>
                    <Th>状态评估</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {customerStats.slice(0, 10).map((customer) => (
                    <Tr key={customer.id}>
                      <Td>
                        <HStack>
                          <Avatar size="xs" name={customer.name} bg="brand.300" />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" fontSize="sm">{customer.name}</Text>
                            <Text fontSize="xs" color="gray.500">ID: {customer.id}</Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Text fontWeight="bold" color="brand.600">{customer.rfm.score}</Text>
                          <Text fontSize="xs" color="gray.400">/ 15</Text>
                        </HStack>
                        <Progress 
                          value={(customer.rfm.score / 15) * 100} 
                          size="xs" 
                          colorScheme={customer.rfm.score > 10 ? 'green' : 'orange'} 
                          mt={1} 
                          borderRadius="full"
                        />
                      </Td>
                      <Td isNumeric fontWeight="medium">{formatCurrency(customer.totalSpent)}</Td>
                      <Td isNumeric>{customer.orderCount} 次</Td>
                      <Td>
                        <Badge colorScheme={customer.lastOrderDays > 90 ? 'gray' : 'green'} variant="subtle">
                          {customer.lastOrderDays} 天前
                        </Badge>
                      </Td>
                      <Td isNumeric>
                        <Text color={customer.totalDebt > 0 ? 'orange.600' : 'gray.400'}>
                          {formatCurrency(customer.totalDebt)}
                        </Text>
                        {customer.overdueDebt > 0 && (
                          <Text fontSize="xs" color="red.500">逾期: {formatCurrency(customer.overdueDebt)}</Text>
                        )}
                      </Td>
                      <Td>
                        {customer.isHighRisk ? (
                          <Badge colorScheme="red">高风险</Badge>
                        ) : customer.rfm.score >= 12 ? (
                          <Badge colorScheme="purple">优质客户</Badge>
                        ) : customer.totalDebt > 0 ? (
                          <Badge colorScheme="orange">挂账中</Badge>
                        ) : (
                          <Badge colorScheme="green">正常</Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>

        <Box id="customer-analysis-slot" />
      </VStack>
    </Container>
  );
};

export default CustomerAnalysis;