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
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  SearchIcon,
  DeleteIcon,
  AddIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import { MdMoveToInbox, MdAttachMoney, MdInventory } from 'react-icons/md';
import useStore from '../store/store';
import { formatCurrency } from '../utils/calculations';

const Inbound = () => {
  const { products, suppliers, inboundRecords, addInboundRecord, deleteInboundRecord } = useStore();
  const toast = useToast();

  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    supplierId: '',
    price: '',
    remark: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // 获取当前选中的商品信息，用于自动填充参考进价
  const selectedProduct = useMemo(() => {
    return products?.find(p => p.id === formData.productId) || null;
  }, [products, formData.productId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 选中商品时，自动填入当前成本价作为参考
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        setFormData(prev => ({ ...prev, price: product.costPrice }));
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
    const price = Number(formData.price);

    if (isNaN(qty) || qty <= 0) {
      toast({
        title: '数量无效',
        description: '请输入有效的入库数量',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isNaN(price) || price < 0) {
        toast({
          title: '价格无效',
          description: '请输入有效的进货单价',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

    try {
      if (addInboundRecord) {
        addInboundRecord({
            productId: formData.productId,
            quantity: qty,
            supplierId: formData.supplierId || null,
            price: price,
            remark: formData.remark,
            date: new Date().toISOString(),
        });

        toast({
            title: '入库成功',
            description: `已记录 ${selectedProduct?.name || '商品'} 入库 ${qty} 件`,
            status: 'success',
            duration: 3000,
            isClosable: true,
        });

        // 重置表单
        setFormData({
            productId: '',
            quantity: '',
            supplierId: '',
            price: '',
            remark: '',
        });
      } else {
          console.error("Store action 'addInboundRecord' is missing");
      }
    } catch (error) {
      toast({
        title: '入库失败',
        description: error.message || '操作失败，请稍后重试',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = (recordId) => {
    try {
      if (deleteInboundRecord) {
        deleteInboundRecord(recordId);
        toast({
            title: '删除成功',
            description: '入库记录已删除',
            status: 'info',
            duration: 3000,
            isClosable: true,
        });
      }
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
    if (!inboundRecords) return [];
    return inboundRecords
      .filter(record => {
        if (!searchTerm) return true;
        const productName = record.productName?.toLowerCase() || '';
        const supplierName = record.supplierName?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return productName.includes(search) || supplierName.includes(search) || record.id.includes(search);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [inboundRecords, searchTerm]);

  const stats = useMemo(() => {
    if (!inboundRecords) return { totalCount: 0, totalAmount: 0, totalQty: 0 };
    return inboundRecords.reduce((acc, record) => {
      acc.totalCount += 1;
      acc.totalAmount += (record.price || 0) * (record.quantity || 0);
      acc.totalQty += (record.quantity || 0);
      return acc;
    }, { totalCount: 0, totalAmount: 0, totalQty: 0 });
  }, [inboundRecords]);

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" color="brand.800" mb={2}>入库管理</Heading>
          <Text color="gray.600">记录商品采购入库信息，增加库存并更新成本</Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
          <Card borderTop="4px solid" borderColor="teal.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">累计入库单数</StatLabel>
                <HStack>
                  <Icon as={MdMoveToInbox} w={6} h={6} color="teal.500" />
                  <StatNumber color="brand.800">{stats.totalCount}</StatNumber>
                </HStack>
                <StatHelpText>历史采购记录</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderTop="4px solid" borderColor="blue.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">累计采购金额</StatLabel>
                <HStack>
                  <Icon as={MdAttachMoney} w={6} h={6} color="blue.500" />
                  <StatNumber color="blue.700">{formatCurrency(stats.totalAmount)}</StatNumber>
                </HStack>
                <StatHelpText>基于入库成本计算</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card borderTop="4px solid" borderColor="purple.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">入库商品总数</StatLabel>
                <HStack>
                  <Icon as={MdInventory} w={6} h={6} color="purple.500" />
                  <StatNumber color="purple.600">{stats.totalQty}</StatNumber>
                </HStack>
                <StatHelpText>件数统计</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card variant="outline">
          <CardHeader bg="brand.50" borderBottomWidth="1px" borderColor="brand.100">
            <Heading size="md" color="brand.700">新增入库单</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
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
                        {product.name} (当前库存: {product.stock})
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="brand.700">入库数量</FormLabel>
                  <Input
                    type="number"
                    placeholder="请输入数量"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    min={1}
                  />
                  {selectedProduct && (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        入库后预计库存: {Number(selectedProduct.stock) + Number(formData.quantity || 0)}
                      </Text>
                  )}
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="brand.700">进货单价 (成本)</FormLabel>
                  <Input
                    type="number"
                    placeholder="请输入单价"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    min={0}
                    step={0.01}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    将更新商品的最新成本价
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel color="brand.700">供应商</FormLabel>
                  <Select
                    placeholder="选择供应商 (可选)"
                    value={formData.supplierId}
                    onChange={(e) => handleInputChange('supplierId', e.target.value)}
                  >
                    {(suppliers || []).map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel color="brand.700">备注</FormLabel>
                <Input
                  placeholder="可填写采购批次号或备注信息"
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                />
              </FormControl>

              {formData.quantity && formData.price && (
                <Box bg="brand.50" p={4} borderRadius="md" border="1px solid" borderColor="brand.200">
                  <HStack justify="space-between">
                    <Text color="gray.600">本单采购总额</Text>
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
                    supplierId: '',
                    price: '',
                    remark: '',
                  })}
                >
                  重置
                </Button>
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="teal"
                  onClick={handleSubmit}
                  isDisabled={!formData.productId || !formData.quantity}
                >
                  确认入库
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        <Card variant="outline">
          <CardHeader bg="brand.50" borderBottomWidth="1px" borderColor="brand.100">
            <HStack justify="space-between">
              <Heading size="md" color="brand.700">入库记录</Heading>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.300" />} />
                <Input
                  placeholder="搜索商品或供应商..."
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
                    <Th>入库单号</Th>
                    <Th>商品名称</Th>
                    <Th isNumeric>入库数量</Th>
                    <Th isNumeric>进货单价</Th>
                    <Th isNumeric>采购总额</Th>
                    <Th>供应商</Th>
                    <Th>日期</Th>
                    <Th>备注</Th>
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
                        <Td isNumeric fontWeight="medium" color="teal.600">+{record.quantity}</Td>
                        <Td isNumeric>{formatCurrency(record.price)}</Td>
                        <Td isNumeric fontWeight="bold" color="brand.700">
                          {formatCurrency((record.price || 0) * (record.quantity || 0))}
                        </Td>
                        <Td>
                          <Text fontSize="sm">{record.supplierName || '-'}</Text>
                        </Td>
                        <Td fontSize="sm">{record.date ? record.date.substring(0, 10) : '-'}</Td>
                        <Td fontSize="sm" color="gray.500" maxW="150px" isTruncated>
                            {record.remark || '-'}
                        </Td>
                        <Td>
                          <Tooltip label="删除记录" placement="top">
                            <IconButton
                              icon={<DeleteIcon />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDelete(record.id)}
                              aria-label="删除入库记录"
                              isDisabled={!deleteInboundRecord} 
                            />
                          </Tooltip>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={9} textAlign="center" py={10} color="gray.500">
                        <VStack spacing={2}>
                          <Icon as={WarningIcon} w={8} h={8} color="gray.300" />
                          <Text>暂无入库记录</Text>
                        </VStack>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>

        <Box id="inbound-slot-footer" />
      </VStack>
    </Container>
  );
};

export default Inbound;