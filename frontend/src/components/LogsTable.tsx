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
    <Box className="pro-card">
      <Table size="sm" variant="simple" className="border-collapse border border-slate-200 dark:border-slate-700">
        <Thead className="bg-slate-100 dark:bg-slate-800">
          <Tr>
            <Th className="border border-slate-200 dark:border-slate-700">Time</Th>
            <Th className="border border-slate-200 dark:border-slate-700">Model</Th>
            <Th className="border border-slate-200 dark:border-slate-700">Prompt</Th>
            <Th className="border border-slate-200 dark:border-slate-700">Response</Th>
            <Th isNumeric className="border border-slate-200 dark:border-slate-700">Tokens</Th>
            <Th isNumeric className="border border-slate-200 dark:border-slate-700">Latency (ms)</Th>
            <Th isNumeric className="border border-slate-200 dark:border-slate-700">Score</Th>
            <Th className="border border-slate-200 dark:border-slate-700">Rating</Th>
            {onSave && <Th className="border border-slate-200 dark:border-slate-700">Actions</Th>}
                <Th className="border border-slate-200 dark:border-slate-700">
                  <Link as={RouterLink} to="/guide#score" className="text-teal-400 hover:text-teal-300">Guide</Link>
                </Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((log) => (
            <Tr key={log.id} bg={log.id === bestId ? 'green.900' : undefined} className={log.id === bestId ? 'bg-green-100 dark:bg-green-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}>
              <Td className="border border-slate-200 dark:border-slate-700">{new Date(log.timestamp).toLocaleString()}</Td>
              <Td className="border border-slate-200 dark:border-slate-700">{log.model}</Td>
              <Td maxW="300px" className="border border-slate-200 dark:border-slate-700"><Text noOfLines={2}>{log.prompt}</Text></Td>
              <Td maxW="300px" className="border border-slate-200 dark:border-slate-700"><Text noOfLines={2}>{log.response}</Text></Td>
              <Td isNumeric className="border border-slate-200 dark:border-slate-700">{log.tokens}</Td>
              <Td isNumeric className="border border-slate-200 dark:border-slate-700">{log.latency_ms}</Td>
              <Td isNumeric className="border border-slate-200 dark:border-slate-700">{score(log)}</Td>
              <Td className="border border-slate-200 dark:border-slate-700">
                <Select size="xs" w="80px" value={log.rating ?? ''} onChange={async (e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined
                  if (val) await updateLogRating(log.id, val)
                }} className="pro-focus">
                  <option value="">-</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </Select>
              </Td>
              {onSave && (
                <Td className="border border-slate-200 dark:border-slate-700">
                  <Button size="xs" onClick={() => onSave(log.id)} className="pro-focus bg-blue-500 hover:bg-blue-600 text-white">Save</Button>
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}
