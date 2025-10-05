import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import theme from './theme'
import './index.css'
import { useEffect } from 'react'

function Root() {
  // Bridge Chakra colorMode to Tailwind 'dark' class
  const applyDarkClass = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.documentElement.classList.contains('chakra-ui-dark')
    document.documentElement.classList.toggle('dark', isDark)
  }
  useEffect(() => {
    applyDarkClass()
    const obs = new MutationObserver(applyDarkClass)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    return () => obs.disconnect()
  }, [])
  return (
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ChakraProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
