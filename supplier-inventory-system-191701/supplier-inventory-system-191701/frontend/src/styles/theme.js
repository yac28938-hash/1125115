import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#FDFBF7', // 奶油白背景
      100: '#F2ECE4',
      200: '#DFD3C3',
      300: '#CBB9A2',
      400: '#B8A081',
      500: '#A48660',
      600: '#836B4D',
      700: '#4A3B32', // 深可可主色
      800: '#312721',
      900: '#191411',
    },
    accent: {
      50: '#FCF5F7',
      100: '#F6D5DD',
      200: '#EFB5C3',
      300: '#E995A9',
      400: '#E2758F',
      500: '#D14D72', // 玫红色强调
      600: '#A73D5B',
      700: '#7D2E44',
      800: '#541F2E',
      900: '#2A0F17',
    },
  },
  fonts: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'brand.50',
        color: 'brand.800',
        lineHeight: 'base',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'md',
        fontWeight: '600',
      },
      variants: {
        solid: (props) => ({
          bg: props.colorScheme === 'accent' ? 'accent.500' : 'brand.700',
          color: 'white',
          _hover: {
            bg: props.colorScheme === 'accent' ? 'accent.600' : 'brand.600',
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          },
          _active: {
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s',
        }),
        outline: {
          borderColor: 'brand.700',
          color: 'brand.700',
          _hover: { bg: 'brand.100' },
        },
        ghost: {
          color: 'brand.700',
          _hover: { bg: 'brand.100' },
        },
      },
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          boxShadow: 'sm',
          borderRadius: 'lg',
          border: '1px solid',
          borderColor: 'brand.100',
        },
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            color: 'brand.600',
            borderColor: 'brand.200',
            fontSize: 'xs',
            textTransform: 'uppercase',
            letterSpacing: 'wider',
          },
          td: {
            borderColor: 'brand.100',
          },
          tbody: {
            tr: {
              _hover: { bg: 'brand.50' },
              transition: 'background-color 0.2s',
            },
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: 3,
        textTransform: 'none',
      },
    },
  },
});

export default theme;