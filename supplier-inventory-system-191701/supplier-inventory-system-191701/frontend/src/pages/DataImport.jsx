import React, { useState, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Container,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { DownloadIcon, AttachmentIcon, CheckCircleIcon, WarningIcon, RepeatIcon } from '@chakra-ui/icons';
import { parseImportData, generateTemplate } from '../utils/dataParser';
import useStore from '../store/store';

const DataImport = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();
  
  // 从 Store 获取批量导入方法
  const importTransactions = useStore((state) => state.importTransactions);

  // 处理模板下载
  const handleDownloadTemplate = () => {
    try {
      generateTemplate();
      toast({
        title: '模板下载成功',
        description: '请在本地打开 Excel 文件进行编辑',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: '下载失败',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // 处理文件选择
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setImportResult(null);

    try {
      // 模拟一点延迟以展示加载状态
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = await parseImportData(file);
      setImportResult(result);
      
      if (result.success && result.validCount > 0) {
        toast({
          title: '解析完成',
          description: `成功解析 ${result.validCount} 条数据，发现 ${result.errorCount} 条错误`,
          status: result.errorCount > 0 ? 'warning' : 'success',
          duration: 3000,
          isClosable: true,
        });
      } else if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: '解析失败',
        description: error.message || '文件格式不正确',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      // 清空 input 允许重复上传同一文件
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 确认导入数据到系统
  const handleConfirmImport = () => {
    if (!importResult?.data || importResult.data.length === 0) return;

    try {
      if (importTransactions) {
        importTransactions(importResult.data);
        toast({
          title: '导入成功',
          description: `已将 ${importResult.data.length} 条记录写入系统`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setImportResult(null); // 重置状态
      } else {
        console.warn('Store action "importTransactions" not found');
        toast({
          title: '系统错误',
          description: '无法连接数据存储服务',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: '导入异常',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  // 重置页面
  const handleReset = () => {
    setImportResult(null);
    setIsUploading(false);
  };

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2} color="brand.800">数据导入</Heading>
          <Text color="gray.600">批量导入采购、销售及挂账记录，支持 Excel/CSV 格式</Text>
        </Box>

        {/* 操作卡片 */}
        <Card variant="outline" borderColor="brand.200">
          <CardHeader bg="brand.50" borderBottomWidth="1px" borderColor="brand.100" py={4}>
            <HStack justify="space-between">
              <Heading size="md" color="brand.700">上传向导</Heading>
              <Button 
                leftIcon={<DownloadIcon />} 
                size="sm" 
                variant="outline"
                colorScheme="brand"
                onClick={handleDownloadTemplate}
              >
                下载标准模板
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            {!importResult ? (
              <Box 
                border="2px dashed" 
                borderColor="brand.300" 
                borderRadius="xl" 
                py={10} 
                textAlign="center"
                bg="brand.50"
                _hover={{ bg: 'brand.100', borderColor: 'brand.400' }}
                transition="all 0.2s"
              >
                <VStack spacing={4}>
                  <Icon as={AttachmentIcon} w={10} h={10} color="brand.500" />
                  <Box>
                    <Text fontSize="lg" fontWeight="bold" color="brand.700">点击上传数据文件</Text>
                    <Text fontSize="sm" color="gray.500">支持 .xlsx, .csv 格式文件</Text>
                  </Box>
                  <Button 
                    colorScheme="brand" 
                    isLoading={isUploading}
                    loadingText="解析中..."
                    onClick={() => fileInputRef.current.click()}
                  >
                    选择文件
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls, .csv"
                    style={{ display: 'none' }}
                  />
                </VStack>
              </Box>
            ) : (
              <VStack spacing={6} align="stretch">
                {/* 结果概览 */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
                  <Stat 
                    p={4} 
                    border="1px solid" 
                    borderColor="brand.200" 
                    borderRadius="md"
                    bg="white"
                  >
                    <StatLabel color="gray.500">解析总行数</StatLabel>
                    <StatNumber color="brand.800">{importResult.total}</StatNumber>
                    <StatHelpText>Excel 总数据量</StatHelpText>
                  </Stat>
                  <Stat 
                    p={4} 
                    border="1px solid" 
                    borderColor="green.200" 
                    borderRadius="md"
                    bg="green.50"
                  >
                    <StatLabel color="green.600">有效数据</StatLabel>
                    <StatNumber color="green.700">{importResult.validCount}</StatNumber>
                    <StatHelpText>待导入系统</StatHelpText>
                  </Stat>
                  <Stat 
                    p={4} 
                    border="1px solid" 
                    borderColor="red.200" 
                    borderRadius="md"
                    bg="red.50"
                  >
                    <StatLabel color="red.600">异常数据</StatLabel>
                    <StatNumber color="red.700">{importResult.errorCount}</StatNumber>
                    <StatHelpText>将被跳过</StatHelpText>
                  </Stat>
                </SimpleGrid>

                {/* 错误详情 */}
                {importResult.errorCount > 0 && (
                  <Alert status="warning" variant="subtle" flexDirection="column" alignItems="start" borderRadius="md">
                    <HStack mb={2}>
                      <AlertIcon />
                      <AlertTitle>发现 {importResult.errorCount} 条格式错误</AlertTitle>
                    </HStack>
                    <Box w="100%" maxH="200px" overflowY="auto" border="1px solid" borderColor="orange.200" borderRadius="sm">
                      <Table size="sm" variant="simple" bg="white">
                        <Thead bg="orange.50">
                          <Tr>
                            <Th>行号</Th>
                            <Th>错误详情</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {importResult.errors.map((err, idx) => (
                            <Tr key={idx}>
                              <Td w="100px">Row {err.row}</Td>
                              <Td color="red.500">
                                {err.messages.join('; ')}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </Alert>
                )}

                {/* 成功数据预览 (仅展示前5条) */}
                {importResult.validCount > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2} color="brand.700">数据预览 (前5条)</Text>
                    <Box overflowX="auto" border="1px solid" borderColor="brand.100" borderRadius="md">
                      <Table size="sm" variant="striped" colorScheme="gray">
                        <Thead>
                          <Tr>
                            <Th>日期</Th>
                            <Th>供应商/客户</Th>
                            <Th>商品ID</Th>
                            <Th isNumeric>数量</Th>
                            <Th isNumeric>价格</Th>
                            <Th>挂账</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {importResult.data.slice(0, 5).map((row, i) => (
                            <Tr key={i}>
                              <Td>{row.date}</Td>
                              <Td>{row.customerId || row.supplierId}</Td>
                              <Td>{row.productId}</Td>
                              <Td isNumeric>{row.quantity}</Td>
                              <Td isNumeric>{row.price}</Td>
                              <Td>
                                {row.isCredit ? (
                                  <Badge colorScheme="purple">是</Badge>
                                ) : (
                                  <Badge colorScheme="gray">否</Badge>
                                )}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </Box>
                )}

                <Divider />

                {/* 底部操作 */}
                <HStack justify="flex-end" spacing={4}>
                  <Button leftIcon={<RepeatIcon />} variant="ghost" onClick={handleReset}>
                    重新上传
                  </Button>
                  <Button
                    leftIcon={<CheckCircleIcon />}
                    colorScheme="accent"
                    onClick={handleConfirmImport}
                    isDisabled={importResult.validCount === 0}
                    size="lg"
                  >
                    确认导入 {importResult.validCount} 条数据
                  </Button>
                </HStack>
              </VStack>
            )}
          </CardBody>
        </Card>

        {/* 动态插槽：用于扩展导入功能的提示或广告位 */}
        <Box id="import-slot-bottom" />
      </VStack>
    </Container>
  );
};

export default DataImport;