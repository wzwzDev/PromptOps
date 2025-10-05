import React from 'react'
import { Box, Heading, Stack } from '@chakra-ui/react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import type { Log } from '../types'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259F7', '#F24E1E', '#E9A800', '#43BCCD']

function getModelStats(logs: Log[]) {
  const byModel: Record<string, Log[]> = {}
  logs.forEach(l => {
    byModel[l.model] = byModel[l.model] || []
    byModel[l.model].push(l)
  })
  return Object.entries(byModel).map(([model, ls]) => ({
    model,
    count: ls.length,
    avgTokens: Math.round(ls.reduce((a, b) => a + b.tokens, 0) / ls.length),
    avgLatency: Math.round(ls.reduce((a, b) => a + b.latency_ms, 0) / ls.length),
  }))
}

function getErrorRates(logs: Log[]) {
  // Example: count logs with error responses
  return logs.filter(l => l.response?.toLowerCase().includes('error')).length / (logs.length || 1)
}

export default function AdvancedAnalytics({ logs }: { logs: Log[] }) {
  const modelStats = getModelStats(logs)
  const errorRate = getErrorRates(logs)
  return (
    <Box bg="whiteAlpha.100" p={4} rounded="md" my={6}>
      <Heading size="sm" mb={3}>Advanced Analytics</Heading>
      <Stack direction={{ base: 'column', md: 'row' }} spacing={6}>
        <Box flex={1} minW={0}>
          <Heading size="xs" mb={2}>Model Usage</Heading>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={modelStats} dataKey="count" nameKey="model" cx="50%" cy="50%" outerRadius={70} label>
                {modelStats.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Box flex={2} minW={0}>
          <Heading size="xs" mb={2}>Model Comparison (Tokens & Latency)</Heading>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={modelStats} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgTokens" fill="#8884d8" name="Avg Tokens" />
              <Bar dataKey="avgLatency" fill="#82ca9d" name="Avg Latency (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Box flex={1} minW={0}>
          <Heading size="xs" mb={2}>Error Rate</Heading>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={[{ name: 'Errors', value: errorRate }]}>
              <XAxis dataKey="name" />
              <YAxis domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} />
              <Tooltip />
              <Bar dataKey="value" fill="#F24E1E" name="Error Rate" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Stack>
    </Box>
  )
}
