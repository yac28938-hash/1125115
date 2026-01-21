import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Box, Center, Spinner, Text, VStack, Icon } from '@chakra-ui/react';
import { MdInsertChartOutlined } from 'react-icons/md';

// 预定义符合系统暖色调视觉风格的 ECharts 主题
export const chartTheme = {
  color: [
    '#A48660', // brand.500
    '#D14D72', // accent.500
    '#836B4D', // brand.600
    '#E2758F', // accent.400
    '#4A3B32', // brand.700
    '#E995A9', // accent.300
    '#DFD3C3', // brand.200
    '#7D2E44'  // accent.700
  ],
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#DFD3C3',
    borderWidth: 1,
    padding: [10, 15],
    textStyle: { color: '#4A3B32' },
    extraCssText: 'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); border-radius: 8px;'
  },
  grid: { top: 40, right: 20, bottom: 20, left: 40, containLabel: true },
  textStyle: { fontFamily: '"Inter", sans-serif' },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#B8A081' } },
    axisTick: { show: false },
    axisLabel: { color: '#836B4D' }
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: '#F2ECE4', type: 'dashed' } }, // brand.100
    axisLabel: { color: '#836B4D' }
  }
};

/**
 * 通用图表组件
 * 封装了加载状态、空数据状态及统一的视觉主题
 * 
 * @param {Object} option - ECharts 配置对象
 * @param {boolean} loading - 是否处于加载中
 * @param {boolean} empty - 是否无数据
 * @param {string} height - 容器高度，默认 350px
 * @param {string} emptyText - 空数据提示文案
 * @param {Object} onEvents - ECharts 事件监听对象
 */
const Chart = ({ 
  option, 
  loading = false, 
  empty = false, 
  height = "350px", 
  emptyText = "暂无相关数据分析",
  onEvents = {}
}) => {
  // 1. 加载状态渲染
  if (loading) {
    return (
      <Center h={height} w="100%">
        <Spinner color="brand.600" size="lg" thickness="3px" speed="0.8s" emptyColor="brand.100" />
      </Center>
    );
  }

  // 2. 空数据状态渲染
  if (empty || !option || (option.series && option.series.length === 0)) {
    return (
      <Center 
        h={height} 
        w="100%" 
        bg="brand.50" 
        borderRadius="lg" 
        border="1px dashed" 
        borderColor="brand.200"
      >
        <VStack spacing={2} color="brand.400">
          <Icon as={MdInsertChartOutlined} w={10} h={10} opacity={0.5} />
          <Text fontSize="sm" fontWeight="medium">{emptyText}</Text>
        </VStack>
      </Center>
    );
  }

  // 3. 图表渲染
  return (
    <Box h={height} w="100%" position="relative" className="chart-container">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        theme={chartTheme} // 注入自定义主题
        notMerge={true}
        lazyUpdate={true}
        onEvents={onEvents}
      />
      {/* 预留图表内部插槽 (如水印、覆盖按钮) */}
      <Box id="chart-internal-slot" position="absolute" top={2} right={2} zIndex={1} pointerEvents="none" />
    </Box>
  );
};

export default Chart;