import React from 'react'
import { Box } from '@chakra-ui/react'

export default function FuturisticGlow({ children }: { children: React.ReactNode }) {
  return (
    <Box
      boxShadow="0 0 32px 8px #00eaff, 0 0 64px 16px #a259f7"
      borderRadius="lg"
      p={2}
      bgGradient="linear(to-r, #232526, #414345)"
      color="white"
      transition="box-shadow 0.3s"
      _hover={{ boxShadow: '0 0 48px 16px #00eaff, 0 0 96px 32px #a259f7' }}
    >
      {children}
    </Box>
  )
}
