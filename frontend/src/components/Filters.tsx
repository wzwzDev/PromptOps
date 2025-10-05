import { Box, Button, Flex, HStack, Input, Select, Text, useToast } from '@chakra-ui/react'
import React, { useState } from 'react'
import { createLog } from '../lib/api'

interface Props {
  onFilter: (params: Record<string, any>) => void
  onRefresh?: () => void
  count?: number
}

export default function Filters({ onFilter, onRefresh, count }: Props) {
  const [model, setModel] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [minTokens, setMinTokens] = useState('')
  const [maxTokens, setMaxTokens] = useState('')
  const [q, setQ] = useState('')
  const [version, setVersion] = useState('')
  const toast = useToast()

  const apply = () => {
    const params: Record<string, any> = {}
    if (model) params.model = model
    if (start) params.start = start
    if (end) params.end = end
    if (minTokens) params.min_tokens = Number(minTokens)
    if (maxTokens) params.max_tokens = Number(maxTokens)
    if (q) params.q = q
    if (version) params.version = version
    onFilter(params)
  }

  const reset = () => {
    setModel(''); setStart(''); setEnd(''); setMinTokens(''); setMaxTokens(''); setQ(''); setVersion('')
    onFilter({})
  }

  const last24h = () => {
    const d = new Date(Date.now() - 24*60*60*1000)
    const iso = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16)
    setStart(iso)
  }

  const addSample = async () => {
    try {
      await createLog({
        prompt: 'Quick test prompt',
        response: 'Quick test response',
        model: model || 'gpt-5',
        version: version || 'v1',
        tokens: 123,
        latency_ms: 350,
        temperature: 0.7,
      })
      toast({ title: 'Sample log added', status: 'success', duration: 2000 })
      onRefresh?.()
    } catch (e) {
      toast({ title: 'Failed to add log', status: 'error', duration: 3000 })
    }
  }

  return (
    <Box bg="whiteAlpha.100" p={4} rounded="md" mb={6}>
      <Flex direction={{ base: 'column', md: 'row' }} gap={3} align={{ base: 'stretch', md: 'center' }}>
        <HStack spacing={3} flexWrap="wrap">
          <Select placeholder="Model" value={model} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setModel(e.target.value)} w="200px">
            <option value="gpt-5">gpt-5</option>
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            <option value="llama3-70b">llama3-70b</option>
          </Select>
          <Input type="datetime-local" value={start} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStart(e.target.value)} />
          <Input type="datetime-local" value={end} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)} />
          <Input placeholder="Min tokens" value={minTokens} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinTokens(e.target.value)} w="150px" />
          <Input placeholder="Max tokens" value={maxTokens} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxTokens(e.target.value)} w="150px" />
          <Input placeholder="Search prompt (q)" value={q} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)} w="260px" />
          <Input placeholder="Version (v1/v2/v3)" value={version} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVersion(e.target.value)} w="200px" />
        </HStack>
        <HStack>
          <Button onClick={apply} colorScheme="blue">Apply</Button>
          <Button onClick={last24h} variant="outline">Last 24h</Button>
          <Button onClick={reset} variant="outline">Reset</Button>
          {onRefresh && <Button onClick={onRefresh} variant="ghost">Refresh</Button>}
          <Button onClick={addSample} colorScheme="green" variant="solid">Add sample log</Button>
        </HStack>
        <Text fontSize="sm" opacity={0.8}>{typeof count === 'number' ? `${count} logs` : ''}</Text>
      </Flex>
    </Box>
  )
}
