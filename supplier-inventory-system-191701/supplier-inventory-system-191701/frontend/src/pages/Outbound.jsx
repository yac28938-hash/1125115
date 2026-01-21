import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  FormControl,
  FormLabel,
  Select,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  InputGroup,
  InputLeftElement,
  Divider,
  Alert,
  AlertIcon,
  AlertDescription,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  SearchIcon,
  DeleteIcon,
  CheckCircleIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import { MdOutbox, MdAttachMoney, MdInventory } from 'react-icons/md';
import useStore from '../store/store';
import { formatCurrency } from '../utils/calculations';

const Outbound = () => {
  const { products, customers, outboundRecords, addOutboundRecord, deleteOutboundRecord } = useStore();
  const toast = useToast();

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    customerId: '',
    price: '',
    remark: '',
    paymentMethod: '现金', // 默认为现金
  });
  const [searchTerm, setSearchTerm] = useState('');

  const selectedProduct = useMemo(() => {
    return products?.find(p => p.id === formData.productId) || null;
  }, [products, formData.productId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        setFormData(prev => ({ ...prev, price: product.salePrice }));
      }
    }
  };

  const handleSubmit = () => {
    if (!formData.productId || !formData.quantity) {
      toast({
        title: '请填写必填项',
        description: '商品和数量为必填项',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: '数量无效',
        description: '请输入有效的出库数量',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // 判断是否为挂账
    const isCredit = formData.paymentMethod === '挂账';

    if (isCredit && !formData.customerId) {
      toast({
        title: '挂账需要选择客户',
        description: '选择“挂账”付款方式时必须关联客户',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      addOutboundRecord({
        productId: formData.productId,
        quantity: qty,
        customerId: formData.customerId || null,
        price: Number(formData.price) || selectedProduct?.salePrice || 0,
        remark: formData.remark,
        paymentMethod: formData.paymentMethod,
        isCredit: isCredit,
      });

      toast({
        title: '出库成功',
        description: `已记录 ${selectedProduct?.name} 出库 ${qty} 件 (${formData.paymentMethod})`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setFormData({
        productId: '',
        quantity: '',
        customerId: '',
        price: '',
        remark: '',
        paymentMethod: '现金',
      });
    } catch (error) {
      toast({
        title: '出库失败',
        description: error.message || '操作失败，请稍后重试',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = (recordId) => {
    try {
      deleteOutboundRecord(recordId);
      toast({
        title: '删除成功',
        description: '出库记录已删除（不影响库存）',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: '删除失败',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const filteredRecords = useMemo(() => {
    if (!outboundRecords) return [];
    return outboundRecords
      .filter(record => {
        if (!searchTerm) return true;
        const productName = record.productName?.toLowerCase() || '';
        const customerName = record.customerName?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return productName.includes(search) || customerName.includes(search) || record.id.includes(search);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [outboundRecords, searchTerm]);

  const stats = useMemo(() => {
    if (!outboundRecords) return { totalCount: 0, totalAmount: 0, creditAmount: 0 };
    return outboundRecords.reduce((acc, record) => {
      acc.totalCount += 1;
      acc.totalAmount += record.amount || 0;
      if (record.isCredit) {
        acc.creditAmount += record.amount || 0;
      }
      return acc;
    }, { totalCount: 0, totalAmount: 0, creditAmount: 0 });
  }, [outboundRecords]);

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" color="brand.800" mb={2}>出库管理</Heading>
          <Text color="gray.600">记录商品出库信息，自动更新库存状态</Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
          <Card borderTop="4px solid" borderColor="brand.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">累计出库单数</StatLabel>
                <HStack>
                  <Icon as={MdOutbox} w={6} h={6} color="brand.500" />
                  <StatNumber color="brand.800">{stats.totalCount}</StatNumber>
                </HStack>
                <StatHelpText>历史出库记录</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderTop="4px solid" borderColor="green.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">累计销售金额</StatLabel>
                <HStack>
                  <Icon as={MdInventory} w={6} h={6} color="green.500" />
                  <StatNumber color="green.700">{formatCurrency(stats.totalAmount)}</StatNumber>
                </HStack>
                <StatHelpText>基于出库记录计算</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderTop="4px solid" borderColor="orange.400">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">挂账金额</StatLabel>
                <HStack>
                  <Icon as={MdAttachMoney} w={6} h={6} color="orange.400" />
                  <StatNumber color="orange.600">{formatCurrency(stats.creditAmount)}</StatNumber>
                </HStack>
                <StatHelpText>出库挂账总额</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card variant="outline">
          <CardHeader bg="brand.50" borderBottomWidth="1px" borderColor="brand.100">
            <Heading size="md" color="brand.700">新增出库单</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {selectedProduct && selectedProduct.stock <= 0 && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>
                    当前商品库存为 0，无法出库！
                  </AlertDescription>
                </Alert>
              )}

              {selectedProduct && selectedProduct.stock > 0 && selectedProduct.stock <= selectedProduct.safeStock && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>
                    当前库存 {selectedProduct.stock} 件，已低于安全库存线 ({selectedProduct.safeStock} 件)
                  </AlertDescription>
                </Alert>
              )}

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel color="brand.700">选择商品</FormLabel>
                  <Select
                    placeholder="请选择商品"
                    value={formData.productId}
                    onChange={(e) => handleInputChange('productId', e.target.value)}
                  >
                    {(products || []).map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} (库存: {product.stock})
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="brand.700">出库数量</FormLabel>
                  <Input
                    type="number"
                    placeholder="请输入数量"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    min={1}
                    max={selectedProduct?.stock || 999999}
                  />
                  {selectedProduct && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      可用库存: {selectedProduct.stock} 件
                    </Text>
                  )}
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="brand.700">付款方式</FormLabel>
                  <Select
                    value={formData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  >
                    <option value="现金">现金</option>
                    <option value="银行转账">银行转账</option>
                    <option value="微信/支付宝">微信/支付宝</option>
                    <option value="挂账">挂账 (记入应收账款)</option>
                  </Select>
                </FormControl>

                <FormControl isRequired={formData.paymentMethod === '挂账'}>
                  <FormLabel color="brand.700">关联客户</FormLabel>
                  <Select
                    placeholder="选择客户 (可选)"
                    value={formData.customerId}
                    onChange={(e) => handleInputChange('customerId', e.target.value)}
                  >
                    {(customers || []).map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="brand.700">销售单价</FormLabel>
                  <Input
                    type="number"
                    placeholder="请输入单价"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    min={0}
                    step={0.01}
                  />
                  {selectedProduct && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      建议售价: {formatCurrency(selectedProduct.salePrice)}
                    </Text>
                  )}
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel color="brand.700">备注</FormLabel>
                <Input
                  placeholder="可填写出库原因或其他信息"
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                />
              </FormControl>

              {formData.quantity && formData.price && (
                <Box bg="brand.50" p={4} borderRadius="md" border="1px solid" borderColor="brand.200">
                  <HStack justify="space-between">
                    <Text color="gray.600">预计出库金额</Text>
                    <Text fontSize="xl" fontWeight="bold" color="brand.700">
                      {formatCurrency(Number(formData.quantity) * Number(formData.price))}
                    </Text>
                  </HStack>
                </Box>
              )}

              <Divider />

              <HStack justify="flex-end" spacing={4}>
                <Button
                  variant="ghost"
                  onClick={() => setFormData({
                    productId: '',
                    quantity: '',
                    customerId: '',
                    price: '',
                    remark: '',
                    paymentMethod: '现金',
                  })}
                >
                  重置
                </Button>
                <Button
                  leftIcon={<CheckCircleIcon />}
                  colorScheme="brand"
                  onClick={handleSubmit}
                  isDisabled={!formData.productId || !formData.quantity || (selectedProduct?.stock || 0) <= 0}
                >
                  确认出库
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Card variant="outline">
          <CardHeader bg="brand.50" borderBottomWidth="1px" borderColor="brand.100">
            <HStack justify="space-between">
              <Heading size="md" color="brand.700">出库记录</Heading>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.300" />} />
                <Input
                  placeholder="搜索商品或客户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg="white"
                />
              </InputGroup>
            </HStack>
          </CardHeader>
          <CardBody p={0}>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="brand.50">
                  <Tr>
                    <Th>出库单号</Th>
                    <Th>商品名称</Th>
                    <Th isNumeric>数量</Th>
                    <Th isNumeric>单价</Th>
                    <Th isNumeric>金额</Th>
                    <Th>客户</Th>
                    <Th>付款方式</Th>
                    <Th>日期</Th>
                    <Th>状态</Th>
                    <Th>操作</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map(record => (
                      <Tr key={record.id}>
                        <Td fontSize="xs" fontWeight="medium">{record.id}</Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" color="brand.700">{record.productName}</Text>
                            <Text fontSize="xs" color="gray.500">ID: {record.productId}</Text>
                          </VStack>
                        </Td>
                        <Td isNumeric fontWeight="medium">{record.quantity}</Td>
                        <Td isNumeric>{formatCurrency(record.price)}</Td>
                        <Td isNumeric fontWeight="bold" color="brand.700">
                          {formatCurrency(record.amount)}
                        </Td>
                        <Td>
                          <Text fontSize="sm">{record.customerName || '-'}</Text>
                        </Td>
                        <Td>
                          <Badge variant="subtle" colorScheme="blue">{record.paymentMethod || '现结'}</Badge>
                        </Td>
                        <Td fontSize="sm">{record.date}</Td>
                        <Td>
                          {record.isCredit ? (
                            <Badge colorScheme="orange" variant="outline">挂账</Badge>
                          ) : (
                            <Badge colorScheme="green" variant="outline">已付</Badge>
                          )}
                        </Td>
                        <Td>
                          <Tooltip label="删除记录（不回滚库存）" placement="top">
                            <IconButton
                              icon={<DeleteIcon />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDelete(record.id)}
                              aria-label="删除出库记录"
                            />
                          </Tooltip>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={10} textAlign="center" py={10} color="gray.500">
                        <VStack spacing={2}>
                          <Icon as={WarningIcon} w={8} h={8} color="gray.300" />
                          <Text>暂无出库记录</Text>
                        </VStack>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>

        <Box id="outbound-slot-footer" />
      </VStack>
    </Container>
  );
};

export default Outbound;