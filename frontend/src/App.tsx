import PromptComparePanel from './components/PromptComparePanel'
import SidebarNav from './components/SidebarNav'
import HelpModal from './components/HelpModal'
import { Box, Container, Heading, Stack, SimpleGrid, useColorMode, useColorModeValue, Button, Flex, HStack, IconButton, Text, Select, Input, Badge } from '@chakra-ui/react'
import OnboardingTour from './components/OnboardingTour'
import FuturisticGlow from './components/FuturisticGlow'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Filters from './components/Filters'
import LogsTable from './components/LogsTable'
import MetricsCards from './components/MetricsCards'
import PromptLeaderboard from './components/PromptLeaderboard'
import PromptSuggestions from './components/PromptSuggestions'
import AdvancedAnalytics from './components/AdvancedAnalytics'
import VersionCompare from './components/VersionCompare'
import Runner from './components/Runner'
import Boards from './components/Boards'
import Experiment from './components/Experiment'
import Guide from './components/Guide'
import DailyRequestsChart from './charts/DailyRequestsChart'
import LatencyChart from './charts/LatencyChart'
import TokenUsageChart from './charts/TokenUsageChart'
import { fetchLogs, fetchMetrics, purgeAll, addLogToBoard, listBoards } from './lib/api'
import type { Log, Metrics, PaginatedLogs, Board } from './types'

export default function App() {
  const [logs, setLogs] = useState<Log[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [boards, setBoards] = useState<Board[]>([])
  const [boardId, setBoardId] = useState<number | ''>('')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [gotoPage, setGotoPage] = useState<string>('')
  const { colorMode, toggleColorMode } = useColorMode()
  const bg = useColorModeValue('gray.50', 'gray.900')
  const [showTour, setShowTour] = useState(false)
  const [activeSection, setActiveSection] = useState('experiment')
  const [essentials, setEssentials] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const location = useLocation()

  // ...existing code...
  const load = async (params?: Record<string, any>) => {
    const [lp, mt] = await Promise.all([
      fetchLogs({ page, page_size: pageSize, ...(params || {}) }),
      fetchMetrics()
    ])
    setLogs(lp.items)
    setPages(lp.pages)
    setMetrics(mt)
  }

  const refresh = () => load()

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    const loadBoards = async () => {
      try { setBoards(await listBoards()) } catch {}
    }
    loadBoards()
  }, [])

  // Expose Guide as a route: when path is /guide, switch section to Guide
  useEffect(() => {
    if (location.pathname === '/guide') {
      setActiveSection('guide')
      // scroll to hash after render
      requestAnimationFrame(() => {
        const hash = location.hash?.replace('#', '')
        if (hash) {
          const el = document.getElementById(hash)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    }
  }, [location.pathname, location.hash])

  return (
    <Flex minH="100vh" bg={bg} className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <SidebarNav
        active={activeSection}
        onSelect={setActiveSection}
        items={essentials ? [
          { key: 'experiment', label: 'Experiment' },
          { key: 'guide', label: 'Guide' },
          { key: 'runner', label: 'Runner' },
          { key: 'compare', label: 'Compare' },
          { key: 'logs', label: 'Logs' },
          { key: 'boards', label: 'Boards' },
        ] : undefined}
      />
      <Box flex={1} py={6}>
        <Container maxW="7xl">
              <div className="pro-header mb-6">
                <div className="flex items-center gap-3">
                  <span className="pro-badge">PRO</span>
                  <Heading size="lg" as="h1">PromptOps Dashboard</Heading>
                </div>
                <div className="flex items-center gap-2">
                  <Button className="pro-focus" onClick={toggleColorMode}>Toggle {colorMode === 'light' ? 'Dark' : 'Light'}</Button>
                  <Button className="pro-focus" colorScheme="red" variant="outline" onClick={async () => { await purgeAll(true); setPage(1); await load(); }}>Purge Data</Button>
                  <Button className="pro-focus" onClick={() => setEssentials(e => !e)}>{essentials ? 'Advanced Mode' : 'Essentials Mode'}</Button>
                  <Button className="pro-focus" colorScheme="teal" onClick={() => setShowHelp(true)}>Help</Button>
                </div>
              </div>
          <OnboardingTour run={false} onFinish={() => {}} />
          {essentials && (
            <Box bg="yellow.50" borderWidth={1} borderColor="yellow.200" p={3} rounded="md" mb={4}>
              <HStack justify="space-between">
                <Text>
                  <Badge colorScheme="yellow" mr={2}>Quick start</Badge>
                  1) Run your task in Runner  2) Compare two runs  3) Save winners to Boards  4) Rate in Logs
                </Text>
                <Button size="sm" onClick={() => setShowHelp(true)}>Learn more</Button>
              </HStack>
            </Box>
          )}
          <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
          {activeSection === 'experiment' && (
            <Box className="pro-card" p={4}>
              <Experiment />
            </Box>
          )}
          {activeSection === 'guide' && (
            <Box className="pro-card" p={4}>
              <Guide />
            </Box>
          )}
          {activeSection === 'runner' && (
            <Box className="pro-card" p={4}>
              <div data-tour="runner"><Runner onAfterRun={refresh} /></div>
            </Box>
          )}
          {activeSection === 'filters' && (
            <Box className="pro-card" p={4}>
              <div data-tour="filters"><Filters onFilter={load} onRefresh={refresh} count={logs.length} /></div>
            </Box>
          )}
          {activeSection === 'metrics' && (
            <Box className="pro-card" p={4}>
              <div data-tour="metrics"><MetricsCards metrics={metrics} /></div>
            </Box>
          )}
          {activeSection === 'leaderboard' && (
            <Box className="pro-card" p={4}>
              <PromptLeaderboard logs={logs} />
            </Box>
          )}
          {activeSection === 'suggestions' && (
            <Box className="pro-card" p={4}>
              <PromptSuggestions logs={logs} />
            </Box>
          )}
          {activeSection === 'analytics' && (
            <Box className="pro-card" p={4}>
              <AdvancedAnalytics logs={logs} />
            </Box>
          )}
          {activeSection === 'compare' && (
            <Box className="pro-card" p={4}>
              <PromptComparePanel logs={logs} />
            </Box>
          )}
          {activeSection === 'boards' && (
            <Boards />
          )}
          {activeSection === 'logs' && (
            <>
              <Stack direction={{ base: 'column', md: 'row' }} spacing={6} my={6} data-tour="charts">
                <Box flex="1" bg="whiteAlpha.100" p={4} rounded="md">
                  <DailyRequestsChart data={metrics?.prompts_per_day ?? []} />
                </Box>
                <Box flex="1" bg="whiteAlpha.100" p={4} rounded="md">
                  <LatencyChart logs={logs} />
                </Box>
                <Box flex="1" bg="whiteAlpha.100" p={4} rounded="md">
                  <TokenUsageChart logs={logs} />
                </Box>
              </Stack>
              <Box boxShadow="lg" borderRadius="xl" bgGradient="linear(to-br, gray.50, gray.200)" p={4} _hover={{ boxShadow: '2xl', transform: 'scale(1.02)' }} transition="all 0.2s">
                <div data-tour="versioncompare"><VersionCompare logs={logs} /></div>
              </Box>
              <Box boxShadow="lg" borderRadius="xl" bgGradient="linear(to-br, gray.50, gray.200)" p={4} _hover={{ boxShadow: '2xl', transform: 'scale(1.02)' }} transition="all 0.2s">
                <div data-tour="logstable"><LogsTable logs={logs} onSave={async (id) => { if (!boardId) return; await addLogToBoard(Number(boardId), id) }} /></div>
                <HStack justify="space-between" mt={4}>
                  <HStack>
                    <Text>Page {page} / {Math.max(pages, 1)}</Text>
                    <Text>·</Text>
                    <Text>Page size</Text>
                    <Select w="90px" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); load({ page: 1, page_size: Number(e.target.value) }) }}>
                      {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </HStack>
                  <HStack>
                    <HStack>
                      <Input w="80px" placeholder="#" value={gotoPage} onChange={(e) => setGotoPage(e.target.value)} />
                      <Button size="sm" onClick={() => { const n = parseInt(gotoPage || ''); if (!isNaN(n) && n >= 1) { setPage(pages ? Math.min(pages, n) : n) } }}>Go</Button>
                    </HStack>
                    <Button size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} isDisabled={page <= 1}>Prev</Button>
                    <Button size="sm" onClick={() => setPage(p => (pages ? Math.min(pages, p + 1) : p + 1))} isDisabled={pages > 0 ? page >= pages : false}>Next</Button>
                  </HStack>
                </HStack>
                <HStack mt={3}>
                  <Select placeholder={boards.length ? 'Select board to save logs' : 'No boards yet'} value={boardId} onChange={(e) => setBoardId(e.target.value ? Number(e.target.value) : '')} w="260px">
                    {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Select>
                  <Text opacity={0.7}>Use the Save button on each row to add logs to the selected board.</Text>
                </HStack>
              </Box>
            </>
          )}
        </Container>
      </Box>
    </Flex>
  )
}
