import React, { useRef, useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  Icon,
  Input,
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';

const FileUpload = ({ 
  onFileSelect, 
  isLoading = false, 
  accept = ".xlsx, .xls, .csv" 
}) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEvent = (e, state) => {
    e.preventDefault();
    setIsDragOver(state);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) onFileSelect && onFileSelect(files[0]);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) onFileSelect && onFileSelect(files[0]);
    e.target.value = ''; // Reset input
  };

  return (
    <Box w="100%">
      <Box
        border="2px dashed"
        borderColor={isDragOver ? "brand.500" : "brand.300"}
        borderRadius="xl"
        bg={isDragOver ? "brand.100" : "brand.50"}
        py={10}
        px={6}
        textAlign="center"
        transition="all 0.2s"
        onDragOver={(e) => handleDragEvent(e, true)}
        onDragLeave={(e) => handleDragEvent(e, false)}
        onDrop={handleDrop}
        _hover={{ borderColor: 'brand.400', bg: 'brand.100' }}
        cursor="pointer"
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <VStack spacing={4}>
          <Icon 
            as={AttachmentIcon} 
            w={12} 
            h={12} 
            color={isDragOver ? "brand.600" : "brand.500"} 
          />
          <Box>
            <Text fontSize="lg" fontWeight="bold" color="brand.700">
              {isDragOver ? "释放文件以解析" : "点击或拖拽上传数据文件"}
            </Text>
            <Text fontSize="sm" color="gray.500" mt={1}>
              支持 {accept} 格式
            </Text>
          </Box>
          <Button
            size="md"
            colorScheme="brand"
            isLoading={isLoading}
            loadingText="处理中..."
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            选择文件
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            display="none"
          />
        </VStack>
      </Box>
      <Box id="file-upload-slot" />
    </Box>
  );
};

export default FileUpload;