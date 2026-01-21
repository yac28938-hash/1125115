import React from 'react';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Icon,
  Drawer,
  DrawerContent,
  useDisclosure,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  FiMenu,
  FiBell,
  FiChevronDown,
} from 'react-icons/fi';
import {
  MdDashboard,
  MdInventory,
  MdPeople,
  MdAnalytics,
  MdAttachMoney,
  MdImportExport,
  MdSettings,
  MdOutbox,
  MdMoveToInbox
} from 'react-icons/md';

// 导航配置
const LinkItems = [
  { name: '概览仪表盘', icon: MdDashboard, path: '/' },
  { name: '库存管理', icon: MdInventory, path: '/inventory' },
  { name: '入库管理', icon: MdMoveToInbox, path: '/inbound' },
  { name: '出库管理', icon: MdOutbox, path: '/outbound' },
  { name: '挂账管理', icon: MdAttachMoney, path: '/ar' },
  { name: '客户分析', icon: MdPeople, path: '/analysis/customer' },
  { name: '经营分析', icon: MdAnalytics, path: '/analysis/financial' },
  { name: '数据导入', icon: MdImportExport, path: '/import' },
];

// 侧边栏组件
const SidebarContent = ({ onClose, ...rest }) => {
  const location = useLocation();

  return (
    <Box
      transition="3s ease"
      bg="brand.700"
      color="white"
      borderRight="1px"
      borderRightColor="brand.800"
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      {...rest}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold" color="brand.50">
          HAISNAP
        </Text>
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onClose}
          variant="outline"
          colorScheme="whiteAlpha"
          aria-label="Close menu"
          icon={<Icon as={FiChevronDown} transform="rotate(90deg)" />}
        />
      </Flex>
      
      <VStack spacing={1} align="stretch" px={2} mt={4}>
        {LinkItems.map((link) => {
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
          return (
            <RouterLink key={link.name} to={link.path} onClick={onClose} style={{ textDecoration: 'none' }}>
              <Flex
                align="center"
                p="3"
                mx="2"
                borderRadius="lg"
                role="group"
                cursor="pointer"
                bg={isActive ? 'accent.500' : 'transparent'}
                color={isActive ? 'white' : 'brand.100'}
                _hover={{
                  bg: isActive ? 'accent.600' : 'brand.600',
                  color: 'white',
                }}
                transition="all 0.2s"
              >
                <Icon
                  mr="4"
                  fontSize="18"
                  as={link.icon}
                />
                <Text fontWeight={isActive ? '600' : '400'}>{link.name}</Text>
              </Flex>
            </RouterLink>
          );
        })}
      </VStack>

      {/* 动态插槽：侧边栏底部 */}
      <Box id="sidebar-slot-bottom" position="absolute" bottom="5" w="full" px="4" />
    </Box>
  );
};

// 移动端顶部导航
const MobileNav = ({ onOpen, ...rest }) => {
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg="brand.50"
      borderBottomWidth="1px"
      borderBottomColor="brand.200"
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      {...rest}
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
        color="brand.700"
        borderColor="brand.300"
      />

      <Text
        display={{ base: 'flex', md: 'none' }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
        color="brand.700"
      >
        HAISNAP
      </Text>

      <HStack spacing={{ base: '0', md: '6' }}>
        <IconButton
          size="lg"
          variant="ghost"
          aria-label="open menu"
          icon={<FiBell />}
          color="brand.600"
        />
        <Flex alignItems={'center'}>
          <Menu>
            <MenuButton py={2} transition="all 0.3s" _focus={{ boxShadow: 'none' }}>
              <HStack>
                <Avatar
                  size={'sm'}
                  src={'https://images.unsplash.com/photo-1619946794135-5bc917a27793?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9'}
                  border="2px solid"
                  borderColor="accent.300"
                />
                <VStack
                  display={{ base: 'none', md: 'flex' }}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2"
                >
                  <Text fontSize="sm" color="brand.800" fontWeight="bold">Admin User</Text>
                  <Text fontSize="xs" color="brand.500">
                    超级管理员
                  </Text>
                </VStack>
                <Box display={{ base: 'none', md: 'flex' }}>
                  <FiChevronDown color="#836B4D" />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList
              bg="white"
              borderColor="brand.200"
              boxShadow="lg"
            >
              <MenuItem icon={<MdSettings />} color="brand.700">系统设置</MenuItem>
              <MenuDivider />
              <MenuItem color="red.500">退出登录</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  );
};

const Layout = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box minH="100vh" bg="brand.50">
      <SidebarContent onClose={() => onClose} display={{ base: 'none', md: 'block' }} />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* 移动端顶部栏 */}
      <MobileNav onOpen={onOpen} />
      
      {/* 动态插槽：内容区顶部 */}
      <Box id="layout-slot-top" ml={{ base: 0, md: 60 }} />

      {/* 主内容区域 */}
      <Box ml={{ base: 0, md: 60 }} p="4">
        <Outlet />
      </Box>
      
      {/* 动态插槽：页脚 */}
      <Box id="layout-slot-footer" ml={{ base: 0, md: 60 }} />
    </Box>
  );
};

export default Layout;