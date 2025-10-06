import React, { useEffect, useState } from 'react'
import { Box, Button, Heading, HStack, Input, List, ListItem, Stack, Text, Select, VStack, Divider, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, Code } from '@chakra-ui/react'
import { createBoard, listBoards, listBoardItems, removeBoardItem } from '../lib/api'
import type { Board, BoardItemView } from '../types'

export default function Boards() {
  const [boards, setBoards] = useState<Board[]>([])
  const [name, setName] = useState('My Board')
  const [activeBoard, setActiveBoard] = useState<number | ''>('')
  const [items, setItems] = useState<BoardItemView[]>([])
  const [viewItem, setViewItem] = useState<BoardItemView | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const load = async () => {
    const bs = await listBoards()
    setBoards(bs)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const loadItems = async () => {
      if (!activeBoard) { setItems([]); return }
      try { setItems(await listBoardItems(Number(activeBoard))) } catch { setItems([]) }
    }
    loadItems()
  }, [activeBoard])

  return (
    <Box className="pro-card">
      <Heading size="md" mb={4}>Boards</Heading>
      <HStack mb={3}>
        <Input value={name} onChange={(e) => setName(e.target.value)} w="300px" placeholder="Board name" className="pro-focus" />
        <Button colorScheme="blue" onClick={async () => { await createBoard(name); setName(''); await load() }} className="pro-focus">Create</Button>
      </HStack>
      <Stack spacing={4}>
        {boards.length === 0 ? (
          <Text opacity={0.7}>No boards yet. Create one above.</Text>
        ) : (
          <HStack>
            <Text>Select a board</Text>
            <Select w="260px" placeholder="Select board" value={activeBoard} onChange={(e) => setActiveBoard(e.target.value ? Number(e.target.value) : '')} className="pro-focus">
              {boards.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </HStack>
        )}
        {activeBoard && (
          <Box className="glass p-3 rounded-md bg-white/30 dark:bg-slate-800/30">
            <Heading size="sm" mb={2}>Items</Heading>
            <HStack mb={2}>
              <Button size="sm" onClick={() => {
                const data = JSON.stringify(items, null, 2)
                const blob = new Blob([data], { type: 'application/json;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = `board-${activeBoard}.json`; a.click(); URL.revokeObjectURL(url)
              }} className="pro-focus bg-brand-500 hover:bg-brand-600 text-white">Export JSON</Button>
              <Button size="sm" onClick={() => {
                const header = ['id','created_at','prompt','response','model','version','tokens','latency_ms','timestamp']
                const rows = items.map(it => [
                  it.id,
                  it.created_at,
                  JSON.stringify(it.log.prompt).slice(1,-1),
                  JSON.stringify(it.log.response).slice(1,-1),
                  it.log.model,
                  it.log.version || '',
                  it.log.tokens,
                  it.log.latency_ms,
                  it.log.timestamp,
                ])
                const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = `board-${activeBoard}.csv`; a.click(); URL.revokeObjectURL(url)
              }} className="pro-focus bg-green-500 hover:bg-green-600 text-white">Export CSV</Button>
            </HStack>
            {items.length === 0 ? (
              <Text opacity={0.7}>No items on this board yet.</Text>
            ) : (
              <VStack align="stretch" spacing={2}>
                {items.map(it => (
                  <Box key={it.id} className="glass p-2 rounded-md hover:shadow-md transition-shadow bg-slate-50/50 dark:bg-slate-800/50">
                    <HStack justify="space-between">
                      <Text fontSize="xs" opacity={0.8}>{new Date(it.created_at).toLocaleString()}</Text>
                      <HStack>
                        <Button size="xs" onClick={() => { setViewItem(it); onOpen() }} className="pro-focus bg-blue-500 hover:bg-blue-600 text-white">View</Button>
                        <Button size="xs" colorScheme="red" variant="outline" onClick={async () => { await removeBoardItem(Number(activeBoard), it.id); setItems(items.filter(x => x.id !== it.id)) }} className="pro-focus">Remove</Button>
                      </HStack>
                    </HStack>
                    <Divider my={2} />
                    <Text fontSize="sm" noOfLines={2}><b>Prompt:</b> {it.log.prompt}</Text>
                    <Text fontSize="sm" noOfLines={3}><b>Response:</b> {it.log.response}</Text>
                    <Text fontSize="xs" opacity={0.8}><b>Model:</b> {it.log.model}{it.log.version ? ` (${it.log.version})` : ''} · <b>Tok:</b> {it.log.tokens} · <b>Latency:</b> {it.log.latency_ms} ms</Text>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        )}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Log details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {viewItem && (
              <VStack align="stretch" spacing={3}>
                <Text><b>ID:</b> {viewItem.id}</Text>
                <Text><b>Created:</b> {new Date(viewItem.created_at).toLocaleString()}</Text>
                <Text><b>Model:</b> {viewItem.log.model}{viewItem.log.version ? ` (${viewItem.log.version})` : ''}</Text>
                <Text><b>Tokens:</b> {viewItem.log.tokens} · <b>Latency:</b> {viewItem.log.latency_ms} ms</Text>
                <Text><b>Timestamp:</b> {new Date(viewItem.log.timestamp).toLocaleString()}</Text>
                <Box>
                  <Text mb={1}><b>Prompt</b></Text>
                  <Code display="block" whiteSpace="pre-wrap" p={2}>{viewItem.log.prompt}</Code>
                </Box>
                <Box>
                  <Text mb={1}><b>Response</b></Text>
                  <Code display="block" whiteSpace="pre-wrap" p={2}>{viewItem.log.response}</Code>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      </Stack>
    </Box>
  )
}
