import React, { useEffect, useMemo, useState } from 'react'
import { Box, Heading, HStack, VStack, Text, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Button, Divider, useToast, Select, Badge, Link } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import Runner from './Runner'
import { fetchLogs, addLogToBoard } from '../lib/api'
import type { Log } from '../types'
import { listBoards } from '../lib/api'

export default function Experiment() {
  const toast = useToast()
  const [logs, setLogs] = useState<Log[]>([])
  const [wTokens, setWTokens] = useState(1)
  const [wLatency, setWLatency] = useState(1)
  const [wRating, setWRating] = useState(100)
  const [boardId, setBoardId] = useState<number|''>('')
  const [boards, setBoards] = useState<{id:number,name:string}[]>([])

  const reload = async () => {
    const lp = await fetchLogs({ page: 1, page_size: 100 })
    setLogs(lp.items)
  }
  useEffect(() => {
    // load persisted weights
    try {
      const saved = JSON.parse(localStorage.getItem('experimentWeights') || 'null')
      if (saved) {
        if (typeof saved.wTokens === 'number') setWTokens(saved.wTokens)
        if (typeof saved.wLatency === 'number') setWLatency(saved.wLatency)
        if (typeof saved.wRating === 'number') setWRating(saved.wRating)
      }
    } catch {}
    reload(); (async()=> setBoards(await listBoards()))()
  }, [])

  useEffect(() => {
    const payload = { wTokens, wLatency, wRating }
    try { localStorage.setItem('experimentWeights', JSON.stringify(payload)) } catch {}
  }, [wTokens, wLatency, wRating])

  const score = (l: Log) => (l.tokens * wTokens + l.latency_ms * wLatency - (l.rating ? l.rating * wRating : 0))
  const top = useMemo(() => [...logs].sort((a,b)=> score(a)-score(b)).slice(0, 5), [logs, wTokens, wLatency, wRating])

  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md">Experiment Mode</Heading>
      <Text>One page to run → compare → save → rate. Adjust weights to reflect what you value.</Text>
      <Box bg="whiteAlpha.100" p={3} rounded="md">
        <HStack justify="space-between" mb={2}>
          <Heading size="sm">Weights</Heading>
          <Link as={RouterLink} to="/guide#score" color="teal.300" fontSize="sm">How scoring works</Link>
        </HStack>
        <VStack align="stretch">
          <HStack><Text w="120px">Tokens</Text><Slider value={wTokens} min={0} max={5} step={1} onChange={setWTokens}><SliderTrack><SliderFilledTrack/></SliderTrack><SliderThumb/></Slider></HStack>
          <HStack><Text w="120px">Latency</Text><Slider value={wLatency} min={0} max={5} step={1} onChange={setWLatency}><SliderTrack><SliderFilledTrack/></SliderTrack><SliderThumb/></Slider></HStack>
          <HStack><Text w="120px">Rating</Text><Slider value={wRating} min={0} max={200} step={10} onChange={setWRating}><SliderTrack><SliderFilledTrack/></SliderTrack><SliderThumb/></Slider></HStack>
        </VStack>
      </Box>
      <Box bg="whiteAlpha.100" p={3} rounded="md">
        <Heading size="sm" mb={2}>Run</Heading>
        <Runner onAfterRun={reload} />
      </Box>
      <Box bg="whiteAlpha.100" p={3} rounded="md">
        <Heading size="sm" mb={2}>Top candidates</Heading>
        <VStack align="stretch" spacing={2}>
          {top.map(l => (
            <HStack key={l.id} justify="space-between" bg="blackAlpha.500" p={2} rounded="md">
              <HStack>
                <Badge colorScheme="green">Score {score(l)}</Badge>
                <Text fontSize="sm">#{l.id} · {l.model}{l.version?` (${l.version})`:''} · tok {l.tokens} · {l.latency_ms} ms · rating {l.rating ?? '-'}</Text>
              </HStack>
              <HStack>
                <Select placeholder="Save to board" w="220px" value={boardId} onChange={(e)=> setBoardId(e.target.value?Number(e.target.value):'')}>
                  {boards.map(b=> <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
                <Button size="sm" onClick={async()=>{ if(!boardId) return; await addLogToBoard(Number(boardId), l.id); toast({title:'Saved to board',status:'success'}) }}>Save</Button>
              </HStack>
            </HStack>
          ))}
          {top.length===0 && <Text opacity={0.7}>Run something to see candidates here.</Text>}
        </VStack>
      </Box>
    </VStack>
  )
}
