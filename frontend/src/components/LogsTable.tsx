import { Box, Table, Thead, Tbody, Tr, Th, Td, Text, Button, Select, Link } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import React, { useMemo, useState } from 'react'
import type { Log } from '../types'
import { updateLogRating } from '../lib/api'

export default function LogsTable({ logs, onSave }: { logs: Log[]; onSave?: (logId: number) => void }) {
  const score = (l: Log) => (l.tokens + l.latency_ms - (l.rating ? l.rating * 100 : 0))
  const rows = useMemo(() => [...logs].sort((a,b) => score(a) - score(b)), [logs])
  const bestId = rows[0]?.id
  return (
    <Box bg="whiteAlpha.100" p={4} rounded="md">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Time</Th>
            <Th>Model</Th>
            <Th>Prompt</Th>
            <Th>Response</Th>
            <Th isNumeric>Tokens</Th>
            <Th isNumeric>Latency (ms)</Th>
            <Th isNumeric>Score</Th>
            <Th>Rating</Th>
            {onSave && <Th>Actions</Th>}
                <Th>
                  <Link as={RouterLink} to="/guide#score">Guide</Link>
                </Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((log) => (
            <Tr key={log.id} bg={log.id === bestId ? 'green.900' : undefined}>
              <Td>{new Date(log.timestamp).toLocaleString()}</Td>
              <Td>{log.model}</Td>
              <Td maxW="300px"><Text noOfLines={2}>{log.prompt}</Text></Td>
              <Td maxW="300px"><Text noOfLines={2}>{log.response}</Text></Td>
              <Td isNumeric>{log.tokens}</Td>
              <Td isNumeric>{log.latency_ms}</Td>
              <Td isNumeric>{score(log)}</Td>
              <Td>
                <Select size="xs" w="80px" value={log.rating ?? ''} onChange={async (e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined
                  if (val) await updateLogRating(log.id, val)
                }}>
                  <option value="">-</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </Select>
              </Td>
              {onSave && (
                <Td>
                  <Button size="xs" onClick={() => onSave(log.id)}>Save</Button>
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
