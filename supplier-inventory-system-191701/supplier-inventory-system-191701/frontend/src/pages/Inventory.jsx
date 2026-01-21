import React, { useState, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  VStack,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Switch,
  FormControl,
  FormLabel,
  Progress,
  Container,
  Icon,
} from '@chakra-ui/react';
import { SearchIcon, WarningIcon, CheckCircleIcon, InfoIcon } from '@chakra-ui/icons';
import { MdInventory, MdWarning, MdAttachMoney } from 'react-icons/md';
import useStore from '../store/store';
import { formatCurrency } from '../utils/calculations';

const Inventory = () => {
  const { products } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // 提取所有分类
  const categories = useMemo(() => {
    if (!products) return [];
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [products]);

  // 过滤数据
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product => {
      const matchesSearch = 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        product.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      
      const isLowStock = (product.stock || 0) <= (product.safeStock || 0);
      const matchesLowStock = !showLowStockOnly || isLowStock;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, searchTerm, filterCategory, showLowStockOnly]);

  // 统计数据
  const stats = useMemo(() => {
    if (!products) return { totalSku: 0, lowStockCount: 0, totalCost: 0, totalValue: 0 };
    
    return products.reduce((acc, curr) => {
      const stock = Number(curr.stock || 0);
      const cost = Number(curr.costPrice || 0);
      const price = Number(curr.salePrice || 0);
      const safe = Number(curr.safeStock || 0);

      acc.totalSku += 1;
      if (stock <= safe) acc.lowStockCount += 1;
      acc.totalCost += stock * cost;
      acc.totalValue += stock * price;
      return acc;
    }, { totalSku: 0, lowStockCount: 0, totalCost: 0, totalValue: 0 });
  }, [products]);

  // 库存状态渲染组件
  const StockStatus = ({ current, safe }) => {
    const safeNum = Number(safe || 0);
    const currentNum = Number(current || 0);
    const ratio = safeNum > 0 ? (currentNum / safeNum) * 100 : 100;
    const isLow = currentNum <= safeNum;
    
    return (
      <VStack align="start" spacing={1} w="100%">
        <HStack justify="space-between" w="100%">
            <Text fontSize="sm" fontWeight={isLow ? "bold" : "normal"} color={isLow ? "red.500" : "inherit"}>
                {currentNum} / {safeNum} (安全线)
            </Text>
            {isLow && <Icon as={WarningIcon} color="red.500" w={3} h={3} />}
        </HStack>
        <Progress 
            value={ratio > 100 ? 100 : ratio} 
            size="xs" 
            colorScheme={isLow ? "red" : "green"} 
            w="100%" 
            borderRadius="full"
            bg="gray.100"
        />
      </VStack>
    );
  };

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" color="brand.800" mb={2}>库存管理</Heading>
          <Text color="gray.600">实时监控商品库存水平，预警缺货风险</Text>
        </Box>

        {/* 统计看板 */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
          <Card borderTop="4px solid" borderColor="brand.600">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">库存 SKU 总数</StatLabel>
                <HStack>
                    <Icon as={MdInventory} w={6} h={6} color="brand.600" />
                    <StatNumber color="brand.800">{stats.totalSku}</StatNumber>
                </HStack>
                <StatHelpText>在售商品种类</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderTop="4px solid" borderColor="red.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">库存预警商品</StatLabel>
                <HStack>
                    <Icon as={MdWarning} w={6} h={6} color="red.500" />
                    <StatNumber color="red.600">{stats.lowStockCount}</StatNumber>
                </HStack>
                <StatHelpText>
                   库存低于安全线
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderTop="4px solid" borderColor="brand.400">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">库存总成本 (资金占用)</StatLabel>
                <HStack>
                    <Icon as={MdAttachMoney} w={6} h={6} color="brand.400" />
                    <StatNumber color="brand.700">{formatCurrency(stats.totalCost)}</StatNumber>
                </HStack>
                <StatHelpText>基于成本价计算</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

           <Card borderTop="4px solid" borderColor="green.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">预计销售总值</StatLabel>
                <HStack>
                    <Icon as={CheckCircleIcon} w={6} h={6} color="green.500" />
                    <StatNumber color="green.700">{formatCurrency(stats.totalValue)}</StatNumber>
                </HStack>
                <StatHelpText>基于销售价计算</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* 筛选工具栏 */}
        <Card variant="outline">
            <CardBody py={4}>
                <HStack spacing={6} wrap="wrap">
                    <InputGroup maxW="300px">
                        <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.300" />} />
                        <Input 
                            placeholder="搜索商品名称或ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>

                    <Select 
                        maxW="200px" 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? '全部分类' : cat}
                            </option>
                        ))}
                    </Select>

                    <FormControl display="flex" alignItems="center" w="auto">
                        <Switch 
                            id="low-stock-switch" 
                            colorScheme="red" 
                            isChecked={showLowStockOnly}
                            onChange={(e) => setShowLowStockOnly(e.target.checked)} 
                        />
                        <FormLabel htmlFor="low-stock-switch" mb="0" ml={2} color="gray.600" cursor="pointer">
                            仅显示库存预警
                        </FormLabel>
                    </FormControl>
                </HStack>
            </CardBody>
        </Card>

        {/* 库存列表 */}
        <Card overflow="hidden" variant="outline">
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="brand.50">
                <Tr>
                  <Th>商品信息</Th>
                  <Th>分类</Th>
                  <Th isNumeric>成本价</Th>
                  <Th isNumeric>销售价</Th>
                  <Th w="250px">库存状态 (当前 / 安全线)</Th>
                  <Th>状态</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <Tr key={product.id}>
                      <Td>
                        <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" color="brand.800">{product.name}</Text>
                            <Text fontSize="xs" color="gray.500">ID: {product.id} | 规格: {product.spec || '-'}</Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge variant="subtle" colorScheme="brand">{product.category}</Badge>
                      </Td>
                      <Td isNumeric color="gray.600">{formatCurrency(product.costPrice)}</Td>
                      <Td isNumeric fontWeight="medium">{formatCurrency(product.salePrice)}</Td>
                      <Td>
                        <StockStatus current={product.stock} safe={product.safeStock} />
                      </Td>
                      <Td>
                         {(product.stock || 0) <= 0 ? (
                             <Badge colorScheme="red" variant="solid">缺货</Badge>
                         ) : (product.stock || 0) <= (product.safeStock || 0) ? (
                             <Badge colorScheme="orange" variant="outline">低库存</Badge>
                         ) : (
                             <Badge colorScheme="green" variant="outline">充足</Badge>
                         )}
                      </Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={10} color="gray.500">
                        <VStack spacing={2}>
                            <Icon as={InfoIcon} w={8} h={8} color="gray.300" />
                            <Text>没有找到符合条件的商品</Text>
                        </VStack>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Box>
        </Card>

        {/* 动态插槽 */}
        <Box id="inventory-slot-footer" />
      </VStack>
    </Container>
  );
};

export default Inventory;