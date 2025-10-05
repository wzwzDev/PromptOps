import React, { useMemo, useState } from 'react'
import { Box, Heading, VStack, HStack, Select, Button, Text, Code, Stat, StatLabel, StatNumber, StatHelpText, Divider } from '@chakra-ui/react'
import type { Log } from '../types'

export default function PromptComparePanel({ logs }: { logs: Log[] }) {
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([])
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [leftId, setLeftId] = useState<number | ''>('')
  const [rightId, setRightId] = useState<number | ''>('')

  // Get unique prompts and models
  const prompts = Array.from(new Set(logs.map(l => l.prompt)))
  const models = Array.from(new Set(logs.map(l => l.model)))

  // Filter logs for selected prompts/models
  const filtered = logs.filter(l =>
    (selectedPrompts.length === 0 || selectedPrompts.includes(l.prompt)) &&
    (selectedModels.length === 0 || selectedModels.includes(l.model))
  )

  // Group by prompt+model
  const byCombo: Record<string, Log[]> = {}
  filtered.forEach(l => {
    const key = `${l.prompt}__${l.model}`
    byCombo[key] = byCombo[key] || []
    byCombo[key].push(l)
  })

  // Calculate stats
  const combos = Object.entries(byCombo).map(([key, ls]) => {
    const [prompt, model] = key.split('__')
    return {
      prompt,
      model,
      avgTokens: Math.round(ls.reduce((a, b) => a + b.tokens, 0) / ls.length),
      avgLatency: Math.round(ls.reduce((a, b) => a + b.latency_ms, 0) / ls.length),
      lastResponse: ls[ls.length - 1]?.response || '',
      count: ls.length,
    }
  })

  // Find best by lowest latency and tokens
  const best = combos.reduce((acc, c) => {
    if (!acc || (c.avgTokens + c.avgLatency) < (acc.avgTokens + acc.avgLatency)) return c
    return acc
  }, null as any)

  const sortedLogs = useMemo(() => [...logs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()), [logs])
  const pick = (id: number | '') => sortedLogs.find(l => l.id === id)
  const left = leftId ? pick(Number(leftId)) : undefined
  const right = rightId ? pick(Number(rightId)) : undefined
  const score = (l?: Log) => l ? (l.tokens + l.latency_ms) : Infinity
  const bestRunner = left && right ? (score(left) <= score(right) ? 'left' : 'right') : undefined

  return (
    <Box bg="whiteAlpha.100" p={4} rounded="md" my={6}>
      <Heading size="sm" mb={3}>Prompt & Model Comparison</Heading>
      <HStack mb={3}>
        <Select placeholder="Select prompts" multiple value={selectedPrompts} onChange={e => setSelectedPrompts(Array.from(e.target.selectedOptions, o => o.value))} w="300px">
          {prompts.map(p => <option key={p} value={p}>{p.slice(0, 60)}</option>)}
        </Select>
        <Select placeholder="Select models" multiple value={selectedModels} onChange={e => setSelectedModels(Array.from(e.target.selectedOptions, o => o.value))} w="220px">
          {models.map(m => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Button onClick={() => { setSelectedPrompts([]); setSelectedModels([]); }}>Reset</Button>
      </HStack>
      <Box bg="blackAlpha.300" p={3} rounded="md" mb={4}>
        <Heading size="xs" mb={2}>Compare any two runs</Heading>
        <HStack>
          <Select placeholder="Left run" value={leftId} onChange={e => setLeftId(e.target.value ? Number(e.target.value) : '')} w="300px">
            {sortedLogs.map(l => (
              <option key={l.id} value={l.id}>#{l.id} · {new Date(l.timestamp).toLocaleString()} · {l.model}{l.version ? ` (${l.version})` : ''}</option>
            ))}
          </Select>
          <Select placeholder="Right run" value={rightId} onChange={e => setRightId(e.target.value ? Number(e.target.value) : '')} w="300px">
            {sortedLogs.map(l => (
              <option key={l.id} value={l.id}>#{l.id} · {new Date(l.timestamp).toLocaleString()} · {l.model}{l.version ? ` (${l.version})` : ''}</option>
            ))}
          </Select>
        </HStack>
        {left && right && (
          <>
            <HStack align="start" spacing={4} mt={3}>
              <Box flex={1} bg={bestRunner==='left' ? 'green.900' : 'blackAlpha.500'} p={3} rounded="md">
                <Text fontWeight="bold">Left {bestRunner==='left' ? '· Best' : ''}</Text>
                <Text fontSize="xs" opacity={0.8}>{left.model}{left.version ? ` (${left.version})` : ''} · Tok {left.tokens} · {left.latency_ms} ms</Text>
                <Divider my={2} />
                <Code display="block" whiteSpace="pre-wrap">{left.response}</Code>
              </Box>
              <Box flex={1} bg={bestRunner==='right' ? 'green.900' : 'blackAlpha.500'} p={3} rounded="md">
                <Text fontWeight="bold">Right {bestRunner==='right' ? '· Best' : ''}</Text>
                <Text fontSize="xs" opacity={0.8}>{right.model}{right.version ? ` (${right.version})` : ''} · Tok {right.tokens} · {right.latency_ms} ms</Text>
                <Divider my={2} />
                <Code display="block" whiteSpace="pre-wrap">{right.response}</Code>
              </Box>
            </HStack>
          </>
        )}
      </Box>
      <VStack align="stretch" spacing={4}>
        {combos.map((c, i) => (
          <Box key={i} bg={best && c.prompt === best.prompt && c.model === best.model ? 'green.50' : 'gray.50'} p={3} rounded="md" borderWidth={best && c.prompt === best.prompt && c.model === best.model ? 2 : 1} borderColor={best && c.prompt === best.prompt && c.model === best.model ? 'green.400' : 'gray.200'}>
            <HStack justify="space-between">
              <Text fontWeight="bold">Prompt:</Text>
              <Text>{c.prompt.slice(0, 80)}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontWeight="bold">Model:</Text>
              <Text>{c.model}</Text>
            </HStack>
            <Stat>
              <StatLabel>Avg Tokens</StatLabel>
              <StatNumber>{c.avgTokens}</StatNumber>
              <StatHelpText>Avg Latency: {c.avgLatency} ms</StatHelpText>
            </Stat>
            <Text fontSize="sm" mt={2} opacity={0.8}>Last Response:</Text>
            <Code whiteSpace="pre-wrap" fontSize="sm">{c.lastResponse}</Code>
            <Text fontSize="xs" opacity={0.6}>Runs: {c.count}</Text>
            {best && c.prompt === best.prompt && c.model === best.model && <Text color="green.600" fontWeight="bold">Best Combination</Text>}
          </Box>
        ))}
        {combos.length === 0 && <Text opacity={0.7}>Select prompts and models to compare.</Text>}
      </VStack>
    </Box>
  )
}
