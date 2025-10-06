import React from 'react'
import { Box, VStack, Button } from '@chakra-ui/react'

const DEFAULT_ITEMS = [
  { key: 'runner', label: 'Runner' },
  { key: 'filters', label: 'Filters' },
  { key: 'metrics', label: 'Metrics' },
  { key: 'leaderboard', label: 'Leaderboard' },
  { key: 'suggestions', label: 'Suggestions' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'compare', label: 'Compare' },
  { key: 'logs', label: 'Logs' },
  { key: 'boards', label: 'Boards' },
  { key: 'interview-prep', label: 'Interview Prep' },
]

export default function SidebarNav({ active, onSelect, items = DEFAULT_ITEMS }: { active: string, onSelect: (key: string) => void, items?: { key: string, label: string }[] }) {
  return (
    <Box bg="gray.100" p={4} minH="100vh" borderRightWidth={1} borderColor="gray.200" w="220px">
      <VStack align="stretch" spacing={3}>
        {items.map(item => (
          <Button key={item.key} colorScheme={active === item.key ? 'blue' : 'gray'} variant={active === item.key ? 'solid' : 'ghost'} onClick={() => onSelect(item.key)}>
            {item.label}
          </Button>
        ))}
      </VStack>
    </Box>
  )
}
