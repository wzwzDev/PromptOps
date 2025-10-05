import React, { useEffect, useState } from 'react'
import { Box, Button, FormControl, FormLabel, HStack, Input, Select, Textarea, useToast, VStack, Text, Code, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, Divider, Link, Tooltip } from '@chakra-ui/react'
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
      <HStack align="flex-start" spacing={6}>
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
          <Button onClick={onRun} colorScheme="blue" isLoading={loading} isDisabled={!model}>Run</Button>
        </VStack>
        <Box flex={1}>
          <Text fontWeight="bold" mb={2}>Response</Text>
          {result ? (
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>Preview</Tab>
                <Tab>Raw</Tab>
                <Tab>Meta</Tab>
                <Tab isDisabled={!baselineLog && !best}>Diff</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Box bg="blackAlpha.600" p={3} rounded="md" whiteSpace="pre-wrap">
                    <Text fontSize="sm" mb={2} opacity={0.8}>{result.response.slice(0, 200)}{result.response.length > 200 ? '…' : ''}</Text>
                    <Divider my={2} />
                    <Text fontSize="xs" opacity={0.8}><b>Latency:</b> {result.latency_ms} ms · <b>Tokens:</b> {result.tokens} · <b>Model:</b> {result.model}</Text>
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
                          {suggestions.map((s, idx)=>(
                            <Box key={idx} bg="blackAlpha.500" p={2} rounded="md">
                              <Text fontSize="xs" opacity={0.8} mb={1}>{s.rationale}</Text>
                              <Text fontSize="sm" whiteSpace="pre-wrap">{s.prompt}</Text>
                              <HStack mt={2}>
                                <Button size="xs" onClick={async()=>{ setPrompt(s.prompt); await onRun() }}>Run this</Button>
                              </HStack>
                            </Box>
                          ))}
                          {(!suggestions || suggestions.length===0) && <Text fontSize="xs" opacity={0.7}>Click “Suggest Improvements” to generate 2–3 better prompt variants.</Text>}
                        </VStack>
                      </Box>
                    )}
                  </Box>
                </TabPanel>
                <TabPanel>
                  <Box bg="blackAlpha.600" p={3} rounded="md" fontFamily="mono" whiteSpace="pre-wrap">
                    <Code whiteSpace="pre-wrap">{result.response}</Code>
                  </Box>
                </TabPanel>
                <TabPanel>
                  <Text><b>Provider:</b> {result.provider}</Text>
                  <Text><b>Model:</b> {result.model}</Text>
                  <Text><b>Version:</b> {result.version || '-'}</Text>
                  <Text><b>Latency:</b> {result.latency_ms} ms</Text>
                  <Text><b>Tokens:</b> {result.tokens}</Text>
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
          ) : (
            <Text opacity={0.7}>Run to see the model response here.</Text>
          )}
        </Box>
      </HStack>
    </Box>
  )
}
