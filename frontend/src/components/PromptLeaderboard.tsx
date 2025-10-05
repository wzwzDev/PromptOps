import React from 'react'
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, Stat, StatLabel, StatNumber, StatHelpText, Badge, Text } from '@chakra-ui/react'
import type { Log } from '../types'

function getLeaderboard(logs: Log[]) {
  // Group by prompt text
  const byPrompt: Record<string, Log[]> = {}
  logs.forEach(l => {
    const key = l.prompt.trim()
    byPrompt[key] = byPrompt[key] || []
    byPrompt[key].push(l)
  })
  // Score: lower avg latency, lower avg tokens, higher count
  return Object.entries(byPrompt).map(([prompt, ls]) => ({
    prompt,
    count: ls.length,
    avgTokens: Math.round(ls.reduce((a, b) => a + b.tokens, 0) / ls.length),
    avgLatency: Math.round(ls.reduce((a, b) => a + b.latency_ms, 0) / ls.length),
    model: ls[0].model,
    version: ls[0].version || '-',
  })).sort((a, b) => b.count - a.count).slice(0, 10)
}

export default function PromptLeaderboard({ logs }: { logs: Log[] }) {
  const rows = getLeaderboard(logs)
  return (
    <Box bg="whiteAlpha.100" p={4} rounded="md" my={6}>
      <Heading size="sm" mb={3}>Prompt Leaderboard</Heading>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Prompt</Th>
            <Th>Model</Th>
            <Th>Version</Th>
            <Th isNumeric>Runs</Th>
            <Th isNumeric>Avg Tokens</Th>
            <Th isNumeric>Avg Latency (ms)</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((r, i) => (
            <Tr key={i}>
              <Td maxW="320px"><Text noOfLines={2}>{r.prompt}</Text></Td>
              <Td>{r.model}</Td>
              <Td>{r.version}</Td>
              <Td isNumeric><Badge colorScheme="green">{r.count}</Badge></Td>
              <Td isNumeric>{r.avgTokens}</Td>
              <Td isNumeric>{r.avgLatency}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
