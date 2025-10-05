import React from 'react'
import { Box, Heading, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import type { Log } from '../types'

function average(nums: number[]) { return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : 0 }

export default function VersionCompare({ logs }: { logs: Log[] }) {
  const byVersion = logs.reduce<Record<string, Log[]>>((acc, l) => {
    const v = l.version || 'unversioned'
    acc[v] = acc[v] || []
    acc[v].push(l)
    return acc
  }, {})

  const rows = Object.entries(byVersion).map(([v, ls]) => ({
    version: v,
    count: ls.length,
    avgTokens: Math.round(average(ls.map(l => l.tokens))),
    avgLatency: Math.round(average(ls.map(l => l.latency_ms))),
  })).sort((a,b) => a.version.localeCompare(b.version))

  return (
    <Box bg="whiteAlpha.100" p={4} rounded="md" my={6}>
      <Heading size="sm" mb={3}>Version Comparison</Heading>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Version</Th>
            <Th isNumeric>Count</Th>
            <Th isNumeric>Avg Tokens</Th>
            <Th isNumeric>Avg Latency (ms)</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map(r => (
            <Tr key={r.version}>
              <Td>{r.version}</Td>
              <Td isNumeric>{r.count}</Td>
              <Td isNumeric>{r.avgTokens}</Td>
              <Td isNumeric>{r.avgLatency}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
