import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Text,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Icon,
  VStack,
  HStack,
  Center,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

/**
 * 通用数据表格组件
 * @param {string} title - 表格标题
 * @param {Array} data - 数据源数组
 * @param {Array} columns - 列配置 [{ header: string, accessor: string, render: func, isNumeric: bool }]
 * @param {string} emptyText - 无数据时的提示文案
 * @param {ReactNode} action - 标题栏右侧的操作按钮区域
 */
const DataTable = ({ 
  title, 
  data = [], 
  columns = [], 
  emptyText = "暂无相关数据", 
  action = null 
}) => {
  return (
    <Card variant="outline" w="100%" overflow="hidden" borderColor="brand.200">
      {(title || action) && (
        <CardHeader bg="brand.50" py={4} borderBottomWidth="1px" borderColor="brand.100">
          <HStack justify="space-between">
            {title && <Heading size="md" color="brand.700">{title}</Heading>}
            {action && <Box>{action}</Box>}
          </HStack>
        </CardHeader>
      )}
      
      <CardBody p={0}>
        <Box overflowX="auto">
          <Table variant="simple" size="md">
            <Thead bg="brand.50">
              <Tr>
                {columns.map((col, index) => (
                  <Th 
                    key={index} 
                    isNumeric={col.isNumeric} 
                    color="brand.600" 
                    whiteSpace="nowrap"
                    py={4}
                  >
                    {col.header}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {data && data.length > 0 ? (
                data.map((row, rowIndex) => (
                  <Tr key={row.id || rowIndex} _hover={{ bg: "brand.50" }} transition="background 0.2s">
                    {columns.map((col, colIndex) => (
                      <Td 
                        key={`${rowIndex}-${colIndex}`} 
                        isNumeric={col.isNumeric}
                        color="brand.800"
                        borderColor="brand.100"
                      >
                        {col.render 
                          ? col.render(row, rowIndex) 
                          : (col.accessor ? row[col.accessor] : '-')
                        }
                      </Td>
                    ))}
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={columns.length} p={0}>
                    <Center py={10} bg="white">
                      <VStack spacing={3} color="gray.400">
                        <Icon as={InfoIcon} w={8} h={8} opacity={0.6} />
                        <Text fontSize="sm">{emptyText}</Text>
                      </VStack>
                    </Center>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
        
        {/* 动态内容插槽 */}
        <Box id="datatable-slot-footer" />
      </CardBody>
    </Card>
  );
};

export default DataTable;