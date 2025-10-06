import React, { useEffect, useState } from 'react'
import { Box, Button, FormControl, FormLabel, HStack, Input, Select, Textarea, useToast, VStack, Text, Code, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, Divider, Link, Tooltip, Badge } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { runModel, listProviderModels } from '../lib/api'
import { addLogToBoard, listBoards, fetchLogs } from '../lib/api'
import { getBaseline, setBaseline, getLog } from '../lib/api'
import { promptCoach } from '../lib/api'
import type { Board, Log, RunRequest, RunResponse } from '../types'

interface Props {
  onAfterRun?: () => void
}

export default function Runner({ onAfterRun }: Props) {
  const [provider, setProvider] = useState<RunRequest['provider']>('openai')
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState('')
  const [version, setVersion] = useState('v1')
  const [temperature, setTemperature] = useState(0.7)
  const [prompt, setPrompt] = useState('Summarize the benefits of prompt versioning for internal QA.')
  const [result, setResult] = useState<RunResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [boards, setBoards] = useState<Board[]>([])
  const [boardId, setBoardId] = useState<number | ''>('')
  const [recent, setRecent] = useState<Log[]>([])
  const [best, setBest] = useState<Log | null>(null)
  const [baselineLog, setBaselineLog] = useState<Log | null>(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<{prompt:string; rationale:string}[]>([])
  const toast = useToast()

  useEffect(() => {
    const loadModels = async () => {
      try {
        const list = await listProviderModels(provider as any)
        setModels(list)
        setModel(list[0] || '')
      } catch (e) {
        setModels([])
        setModel('')
      }
    }
    loadModels()
  }, [provider])

  useEffect(() => {
    const loadBoards = async () => {
      try {
        const bs = await listBoards()
        setBoards(bs)
      } catch {}
    }
    loadBoards()
  }, [])

  const onRun = async () => {
    setLoading(true)
    setResult(null)
    try {
      const payload: RunRequest = { provider, model, prompt, version, temperature }
  const res = await runModel(payload)
  setResult(res)
  toast({ title: 'Run saved', description: res.log_id ? `Log #${res.log_id}` : 'Completed', status: 'success', duration: 1800 })
      onAfterRun?.()
      // Load baseline for this prompt and fetch its log for diff
      try {
        const base = await getBaseline(prompt)
        if (base?.log_id) {
          const bLog = await getLog(base.log_id)
          setBaselineLog(bLog)
        } else {
          setBaselineLog(null)
        }
      } catch { setBaselineLog(null) }
      // Load recent runs for same prompt and pick a best suggestion
      try {
        const lp = await fetchLogs({ q: prompt, page_size: 50 })
        const items = (lp.items || []).filter(l => (l.prompt || '').trim() === prompt.trim())
        setRecent(items)
        if (items.length > 0) {
          const bestPick = [...items].sort((a, b) => (a.tokens - b.tokens) || (a.latency_ms - b.latency_ms))[0]
          setBest(bestPick)
        } else {
          setBest(null)
        }
      } catch {}
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to run'
      toast({ title: 'Run failed', description: String(msg), status: 'error', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const onSetBaseline = async () => {
    if (!result?.log_id) return
    try {
      await setBaseline(prompt, result.log_id)
      const b = await getLog(result.log_id)
      setBaselineLog(b)
      toast({ title: 'Baseline set', description: `Pinned log #${result.log_id} for this prompt`, status: 'success', duration: 1800 })
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to set baseline'
      toast({ title: 'Failed', description: String(msg), status: 'error' })
    }
  }

  return (
    <Box bg="whiteAlpha.100" p={4} rounded="md" mb={6}>
      <HStack justify="space-between" mb={3}>
        <Heading size="sm">Runner</Heading>
        <Tooltip label="Open guide for tips about Runner"><Link as={RouterLink} to="/guide#runner" color="teal.300">Guide: Runner</Link></Tooltip>
      </HStack>
      
      {/* Form Section */}
      <VStack align="stretch" spacing={4} mb={8}>
        <VStack align="stretch" flex={1} spacing={3}>
          <HStack>
            <FormControl w="220px">
              <FormLabel>Provider</FormLabel>
              <Select value={provider} onChange={(e) => setProvider(e.target.value as any)}>
                <option value="ollama">ollama</option>
                <option value="openai">openai</option>
              </Select>
            </FormControl>
            <FormControl w="260px">
              <FormLabel>Model</FormLabel>
              <Select placeholder={models.length ? 'Select model' : 'No models found'} value={model} onChange={(e) => setModel(e.target.value)}>
                {models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </FormControl>
            <FormControl w="160px">
              <FormLabel>Version</FormLabel>
              <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v1" />
            </FormControl>
            <FormControl w="160px">
              <FormLabel>Temperature</FormLabel>
              <Input type="number" step="0.1" min={0} max={2} value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} />
            </FormControl>
          </HStack>
          <FormControl>
            <FormLabel>Prompt</FormLabel>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
          </FormControl>
          <Button onClick={onRun} colorScheme="blue" isLoading={loading} isDisabled={!model} size="lg" w="200px" alignSelf="center">
            Run
          </Button>
        </VStack>
      </VStack>

      {/* Response Section - Centered and Prominent */}
      {result && (
        <Box w="100%" maxW="6xl" mx="auto" mt={8}>
          <Heading size="lg" mb={6} textAlign="center" color="blue.600">
            Model Response
          </Heading>
            <Tabs variant="enclosed" colorScheme="blue" size="lg" mt={4}>
              <TabList bg="gray.100" borderRadius="md" p={1}>
                <Tab _selected={{ bg: "blue.500", color: "white" }} fontWeight="medium">Preview</Tab>
                <Tab _selected={{ bg: "blue.500", color: "white" }} fontWeight="medium">Raw</Tab>
                <Tab _selected={{ bg: "blue.500", color: "white" }} fontWeight="medium">Meta</Tab>
                <Tab isDisabled={!baselineLog && !best} _selected={{ bg: "blue.500", color: "white" }} fontWeight="medium">Diff</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Box bg="blackAlpha.600" p={3} rounded="md" whiteSpace="pre-wrap">
                    <Box 
                      p={4} 
                      bg="gray.50" 
                      borderRadius="md" 
                      border="1px" 
                      borderColor="gray.200"
                      mb={4}
                    >
                      <Text fontSize="md" fontWeight="medium" mb={2} color="gray.700">
                        Response Preview:
                      </Text>
                      <Text fontSize="lg" lineHeight="1.6" color="gray.800">
                        {result.response.slice(0, 400)}{result.response.length > 400 ? '…' : ''}
                      </Text>
                    </Box>
                    <Divider my={4} />
                    <HStack spacing={6} py={2}>
                      <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                        <Text fontSize="sm"><b>Latency:</b> {result.latency_ms} ms</Text>
                      </Badge>
                      <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                        <Text fontSize="sm"><b>Tokens:</b> {result.tokens}</Text>
                      </Badge>
                      <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                        <Text fontSize="sm"><b>Model:</b> {result.model}</Text>
                      </Badge>
                    </HStack>
                    <HStack mt={3}>
                      <Select placeholder={boards.length ? 'Select board' : 'No boards yet'} value={boardId} onChange={(e) => setBoardId(e.target.value ? Number(e.target.value) : '')} w="220px">
                        {boards.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </Select>
                      <Button size="sm" onClick={async () => { if (!boardId) return; await addLogToBoard(Number(boardId), result.log_id); toast({ title: 'Saved to board', status: 'success', duration: 1200 }) }} isDisabled={!boardId}>Save to Board</Button>
                      <Button size="sm" variant="outline" onClick={onSetBaseline} isDisabled={!result?.log_id}>Set as Baseline</Button>
                    </HStack>
                    {recent.length > 0 && (
                      <Box mt={4} bg="whiteAlpha.100" p={3} rounded="md">
                        <HStack justify="space-between" mb={2}>
                          <Heading size="xs">Compare & Suggest</Heading>
                          <Link as={RouterLink} to="/guide#compare" color="teal.300" fontSize="xs">Guide: Compare</Link>
                        </HStack>
                        {best && (
                          <Text fontSize="sm" mb={2}><b>Best:</b> {best.model}{best.version ? ` (${best.version})` : ''} · Tokens {best.tokens} · Latency {best.latency_ms} ms</Text>
                        )}
                        <VStack align="stretch" spacing={2}>
                          {[...recent].slice(0, 3).map((l) => (
                            <HStack key={l.id} justify="space-between">
                              <Text fontSize="xs">{new Date(l.timestamp).toLocaleString()}</Text>
                              <Text fontSize="xs">{l.model}{l.version ? ` (${l.version})` : ''}</Text>
                              <Text fontSize="xs">Tok {l.tokens}</Text>
                              <Text fontSize="xs">{l.latency_ms} ms</Text>
                            </HStack>
                          ))}
                        </VStack>
                        <Divider my={3} />
                        <HStack justify="space-between" align="center">
                          <Heading size="xs">Prompt Coach</Heading>
                          <Button size="xs" variant="outline" onClick={async()=>{
                            setCoachLoading(true)
                            try {
                              const r = await promptCoach({ prompt, provider, model, count: 3 })
                              setSuggestions(r.suggestions || [])
                            } finally { setCoachLoading(false) }
                          }} isLoading={coachLoading}>Suggest Improvements</Button>
                        </HStack>
                        <VStack align="stretch" spacing={2} mt={2}>
                          {suggestions.map((s, idx) => (
                            <Box key={idx} bg="blue.50" p={5} rounded="2xl" boxShadow="sm" mb={3}>
                              <Text fontSize="lg" fontWeight="semibold" color="blue.700" mb={2}>
                                {s.rationale}
                              </Text>
                              <Text fontSize="xl" color="gray.900" whiteSpace="pre-wrap" mb={2}>
                                {s.prompt}
                              </Text>
                              <HStack mt={2}>
                                <Button size="md" colorScheme="blue" onClick={async()=>{ setPrompt(s.prompt); await onRun() }}>Run this</Button>
                              </HStack>
                            </Box>
                          ))}
                          {(!suggestions || suggestions.length === 0) && (
                            <Text fontSize="md" opacity={0.7} textAlign="center">
                              Click “Suggest Improvements” to generate 2–3 better prompt variants.
                            </Text>
                          )}
                        </VStack>
                      </Box>
                    )}
                  </Box>
                </TabPanel>
                <TabPanel p={0}>
                  <Box 
                    bg="gray.50" 
                    p={6} 
                    borderRadius="md" 
                    border="1px" 
                    borderColor="gray.200"
                    minH="300px"
                  >
                    <Text fontSize="xl" lineHeight="1.8" color="gray.800" whiteSpace="pre-wrap">
                      {result.response}
                    </Text>
                  </Box>
                </TabPanel>
                <TabPanel p={0}>
                  <VStack align="stretch" spacing={4}>
                    <Box bg="blue.50" p={4} borderRadius="md" border="1px" borderColor="blue.200">
                      <Text fontSize="lg" fontWeight="bold" mb={3} color="blue.700">Model Information</Text>
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Text fontWeight="medium" color="gray.600">Provider:</Text>
                          <Text fontSize="lg" color="gray.800">{result.provider}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium" color="gray.600">Model:</Text>
                          <Text fontSize="lg" color="gray.800">{result.model}</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium" color="gray.600">Version:</Text>
                          <Text fontSize="lg" color="gray.800">{result.version || '-'}</Text>
                        </HStack>
                      </VStack>
                    </Box>
                    <Box bg="green.50" p={4} borderRadius="md" border="1px" borderColor="green.200">
                      <Text fontSize="lg" fontWeight="bold" mb={3} color="green.700">Performance Metrics</Text>
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Text fontWeight="medium" color="gray.600">Latency:</Text>
                          <Text fontSize="lg" color="gray.800">{result.latency_ms} ms</Text>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium" color="gray.600">Tokens:</Text>
                          <Text fontSize="lg" color="gray.800">{result.tokens}</Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </VStack>
                </TabPanel>
                <TabPanel>
                  {(baselineLog || best) ? (
                    <HStack align="start" spacing={4}>
                      <Box flex={1} bg="blackAlpha.600" p={3} rounded="md">
                        <Heading size="xs" mb={2}>Current</Heading>
                        <Text fontSize="xs" opacity={0.8}>{result.model}{result.version ? ` (${result.version})` : ''} · Tok {result.tokens} · {result.latency_ms} ms</Text>
                        <Divider my={2} />
                        <Text whiteSpace="pre-wrap" fontSize="sm">{result.response}</Text>
                      </Box>
                      <Box flex={1} bg="blackAlpha.500" p={3} rounded="md">
                        <Heading size="xs" mb={2}>{baselineLog ? 'Baseline' : 'Best recent'}</Heading>
                        <Text fontSize="xs" opacity={0.8}>
                          {baselineLog ? (
                            <>
                              {baselineLog.model}{baselineLog.version ? ` (${baselineLog.version})` : ''} · Tok {baselineLog.tokens} · {baselineLog.latency_ms} ms
                            </>
                          ) : (
                            <>
                              {best!.model}{best!.version ? ` (${best!.version})` : ''} · Tok {best!.tokens} · {best!.latency_ms} ms
                            </>
                          )}
                        </Text>
                        <Divider my={2} />
                        <Text whiteSpace="pre-wrap" fontSize="sm">{baselineLog ? baselineLog.response : best!.response}</Text>
                      </Box>
                    </HStack>
                  ) : (
                    <Text opacity={0.7}>No baseline or comparable runs yet.</Text>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
        </Box>
      )}

      {!result && (
        <Box w="100%" maxW="6xl" mx="auto" mt={8} textAlign="center">
          <Text opacity={0.7} fontSize="lg">Run to see the model response here.</Text>
        </Box>
      )}
    </Box>
  )
}
