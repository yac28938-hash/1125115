import React, { useState, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Input,
  Select,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Card,
  CardBody,
  InputGroup,
  InputLeftElement,
  Divider,
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  CheckCircleIcon, 
  TimeIcon, 
  WarningTwoIcon
} from '@chakra-ui/icons';
import useStore from '../store/store';
import { formatCurrency, isOverdue, getOverdueDays } from '../utils/calculations';

const AccountsReceivable = () => {
  // 状态管理
  const { arRecords, customers, settleArRecord } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, overdue, cleared
  
  // 结清弹窗状态
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  const toast = useToast();

  // 1. 数据过滤与处理
  const filteredData = useMemo(() => {
    if (!arRecords) return [];
    
    return arRecords.filter(record => {
      // 关联客户信息
      const customer = customers.find(c => c.id === record.customerId);
      const customerName = customer ? customer.name : '未知客户';
      const searchMatch = 
        record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase());
        
      if (!searchMatch) return false;

      const isRecordOverdue = record.status !== 'cleared' && isOverdue(record.dueDate);

      if (statusFilter === 'all') return true;
      if (statusFilter === 'cleared') return record.status === 'cleared';
      if (statusFilter === 'pending') return record.status !== 'cleared' && !isRecordOverdue;
      if (statusFilter === 'overdue') return isRecordOverdue;
      
      return true;
    }).map(record => {
        // 补充显示字段
        const customer = customers.find(c => c.id === record.customerId);
        return {
            ...record,
            customerName: customer ? customer.name : record.customerId,
            isOverdue: record.status !== 'cleared' && isOverdue(record.dueDate),
            overdueDays: record.status !== 'cleared' ? getOverdueDays(record.dueDate) : 0
        };
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // 按日期倒序
  }, [arRecords, customers, searchTerm, statusFilter]);

  // 2. 统计数据计算
  const stats = useMemo(() => {
    const total = (arRecords || []).reduce((acc, curr) => {
        const amt = Number(curr.amount || 0);
        if (curr.status !== 'cleared') {
            acc.pending += amt;
            if (isOverdue(curr.dueDate)) {
                acc.overdue += amt;
                acc.overdueCount += 1;
            }
        } else {
            acc.cleared += amt;
        }
        return acc;
    }, { pending: 0, overdue: 0, overdueCount: 0, cleared: 0 });
    return total;
  }, [arRecords]);

  // 3. 处理结清
  const handleOpenSettle = (record) => {
    setSelectedRecord(record);
    onOpen();
  };

  const handleConfirmSettle = () => {
    if (!selectedRecord) return;
    
    try {
        if (settleArRecord) {
            settleArRecord(selectedRecord.id);
            toast({
                title: '操作成功',
                description: `挂账单 ${selectedRecord.id} 已结清`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onClose();
        } else {
            console.error("Method settleArRecord not found in store");
        }
    } catch (error) {
        toast({
            title: '操作失败',
            description: '结清操作未能完成，请稍后重试',
            status: 'error',
            duration: 3000,
            isClosable: true,
        });
    }
  };

  // 状态徽章渲染器
  const StatusBadge = ({ record }) => {
    if (record.status === 'cleared') {
      return <Badge colorScheme="green" px={2} py={1} borderRadius="full"><CheckCircleIcon mr={1}/>已结清</Badge>;
    }
    if (record.isOverdue) {
      return <Badge colorScheme="red" px={2} py={1} borderRadius="full"><WarningTwoIcon mr={1}/>逾期 {record.overdueDays} 天</Badge>;
    }
    return <Badge colorScheme="orange" px={2} py={1} borderRadius="full"><TimeIcon mr={1}/>待结清</Badge>;
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Box>
            <Heading size="lg" color="brand.800">挂账管理</Heading>
            <Text color="gray.600" mt={1}>监控客户应收账款，管理账期与回款</Text>
          </Box>
          <Button leftIcon={<CheckCircleIcon />} colorScheme="accent" variant="solid" isDisabled>
            批量结清 (开发中)
          </Button>
        </HStack>

        {/* 顶部统计卡片 */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
            <Card borderTop="4px solid" borderColor="orange.400">
                <CardBody>
                    <Stat>
                        <StatLabel color="gray.500">待收总额 (未结清)</StatLabel>
                        <StatNumber color="orange.600">{formatCurrency(stats.pending)}</StatNumber>
                        <StatHelpText>
                             包含正常账期内款项
                        </StatHelpText>
                    </Stat>
                </CardBody>
            </Card>
            <Card borderTop="4px solid" borderColor="red.500">
                <CardBody>
                    <Stat>
                        <StatLabel color="gray.500">逾期金额</StatLabel>
                        <StatNumber color="red.600">{formatCurrency(stats.overdue)}</StatNumber>
                        <StatHelpText>
                            <StatArrow type="increase" />
                            共 {stats.overdueCount} 笔逾期单据
                        </StatHelpText>
                    </Stat>
                </CardBody>
            </Card>
            <Card borderTop="4px solid" borderColor="green.500">
                <CardBody>
                    <Stat>
                        <StatLabel color="gray.500">历史已收回</StatLabel>
                        <StatNumber color="green.600">{formatCurrency(stats.cleared)}</StatNumber>
                        <StatHelpText>累计已结清金额</StatHelpText>
                    </Stat>
                </CardBody>
            </Card>
        </SimpleGrid>

        {/* 筛选与操作栏 */}
        <Card>
            <CardBody py={4}>
                <HStack spacing={4} wrap="wrap">
                    <InputGroup maxW="300px">
                        <InputLeftElement pointerEvents="none" children={<SearchIcon color="gray.300" />} />
                        <Input 
                            placeholder="搜索客户名或单号..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                    
                    <Select 
                        maxW="200px" 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">全部状态</option>
                        <option value="pending">待结清 (正常)</option>
                        <option value="overdue">已逾期</option>
                        <option value="cleared">已结清</option>
                    </Select>
                </HStack>
            </CardBody>
        </Card>

        {/* 挂账列表 */}
        <Card overflow="hidden">
            <Table variant="simple" size="md">
                <Thead bg="brand.50">
                    <Tr>
                        <Th>挂账单号</Th>
                        <Th>客户名称</Th>
                        <Th isNumeric>挂账金额</Th>
                        <Th>生成日期</Th>
                        <Th>到期日</Th>
                        <Th>状态</Th>
                        <Th>操作</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {filteredData.length > 0 ? (
                        filteredData.map((record) => (
                            <Tr key={record.id}>
                                <Td fontWeight="medium" fontSize="sm">{record.id}</Td>
                                <Td>
                                    <VStack align="start" spacing={0}>
                                        <Text fontWeight="bold" color="brand.700">{record.customerName}</Text>
                                        <Text fontSize="xs" color="gray.500">ID: {record.customerId}</Text>
                                    </VStack>
                                </Td>
                                <Td isNumeric fontWeight="bold">{formatCurrency(record.amount)}</Td>
                                <Td fontSize="sm">{record.date}</Td>
                                <Td fontSize="sm">
                                    <Text color={record.isOverdue ? "red.500" : "inherit"} fontWeight={record.isOverdue ? "bold" : "normal"}>
                                        {record.dueDate}
                                    </Text>
                                </Td>
                                <Td>
                                    <StatusBadge record={record} />
                                </Td>
                                <Td>
                                    {record.status !== 'cleared' && (
                                        <Button 
                                            size="xs" 
                                            colorScheme="brand" 
                                            variant="outline"
                                            onClick={() => handleOpenSettle(record)}
                                        >
                                            结清
                                        </Button>
                                    )}
                                    {record.status === 'cleared' && (
                                        <Text fontSize="xs" color="gray.400">已归档</Text>
                                    )}
                                </Td>
                            </Tr>
                        ))
                    ) : (
                        <Tr>
                            <Td colSpan={7} textAlign="center" py={10} color="gray.500">
                                暂无符合条件的挂账记录
                            </Td>
                        </Tr>
                    )}
                </Tbody>
            </Table>
        </Card>

        {/* 动态插槽 */}
        <Box id="ar-slot-footer" />
      </VStack>

      {/* 结清确认弹窗 */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>确认结清款项</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRecord && (
                <VStack spacing={4} align="stretch" bg="brand.50" p={4} borderRadius="md" border="1px dashed" borderColor="brand.200">
                    <HStack justify="space-between">
                        <Text color="gray.500">单号</Text>
                        <Text fontWeight="bold">{selectedRecord.id}</Text>
                    </HStack>
                    <HStack justify="space-between">
                        <Text color="gray.500">客户</Text>
                        <Text fontWeight="bold">{selectedRecord.customerName}</Text>
                    </HStack>
                    <Divider borderColor="brand.200" />
                    <HStack justify="space-between">
                        <Text color="gray.500">应付金额</Text>
                        <Text fontSize="xl" fontWeight="bold" color="brand.700">
                            {formatCurrency(selectedRecord.amount)}
                        </Text>
                    </HStack>
                </VStack>
            )}
            <Text mt={4} fontSize="sm" color="gray.500">
                点击确认后，该笔挂账单状态将变更为“已结清”，客户挂账余额将自动扣减。
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>取消</Button>
            <Button colorScheme="brand" onClick={handleConfirmSettle}>
              确认已收款
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AccountsReceivable;