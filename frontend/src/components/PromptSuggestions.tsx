import React from 'react'
import { Box, Heading, List, ListItem, Text, Badge } from '@chakra-ui/react'
import type { Log } from '../types'

function getSuggestions(logs: Log[]) {
  // Suggest prompts with lowest avg tokens and latency, and those with high error rates
  const byPrompt: Record<string, Log[]> = {}
  logs.forEach(l => {
    const key = l.prompt.trim()
    byPrompt[key] = byPrompt[key] || []
    byPrompt[key].push(l)
  })
  // Find prompts with high tokens/latency
  const suggestions: { prompt: string, reason: string }[] = []
  Object.entries(byPrompt).forEach(([prompt, ls]) => {
    const avgTokens = ls.reduce((a, b) => a + b.tokens, 0) / ls.length
    const avgLatency = ls.reduce((a, b) => a + b.latency_ms, 0) / ls.length
    if (avgTokens > 1000) suggestions.push({ prompt, reason: 'High token usage' })
    if (avgLatency > 10000) suggestions.push({ prompt, reason: 'High latency' })
    if (avgTokens < 100 && avgLatency < 1000) suggestions.push({ prompt, reason: 'Efficient prompt' })
  })
  return suggestions.slice(0, 8)
}

export default function PromptSuggestions({ logs }: { logs: Log[] }) {
  const suggestions = getSuggestions(logs)
  return (
    <Box bg="whiteAlpha.100" p={4} rounded="md" my={6}>
      <Heading size="sm" mb={3}>Prompt Suggestions</Heading>
      <List spacing={2}>
        {suggestions.length === 0 && <Text opacity={0.7}>No suggestions yet. Run more prompts!</Text>}
        {suggestions.map((s, i) => (
          <ListItem key={i}>
            <Badge colorScheme={s.reason === 'Efficient prompt' ? 'green' : 'red'} mr={2}>{s.reason}</Badge>
            <Text as="span" fontWeight="bold">{s.prompt}</Text>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
