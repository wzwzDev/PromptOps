import { extendTheme, ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
}

const theme = extendTheme({
  config,
  fonts: {
    heading: 'Inter, system-ui, -apple-system, Segoe UI, Arial',
    body: 'Inter, system-ui, -apple-system, Segoe UI, Arial',
    mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  radii: {
    sm: '8px', md: '12px', lg: '16px', xl: '20px'
  },
  semanticTokens: {
    colors: {
      bgSubtle: {
        default: 'gray.50',
        _dark: 'gray.900',
      }
    }
  }
})
export default theme
