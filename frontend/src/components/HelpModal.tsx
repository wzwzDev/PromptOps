import React from 'react'
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, List, ListItem, Text, Code, VStack } from '@chakra-ui/react'

export default function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>How to use PromptOps (simple mode)</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={3} mb={3}>
            <Text>Use this simple 3-step loop:</Text>
            <List spacing={2} styleType="decimal" pl={6}>
              <ListItem><b>Run</b> your task in Runner (add acceptance criteria in the prompt). Save good runs to a Board.</ListItem>
              <ListItem><b>Compare</b> two runs in Compare; pick the best by quality, tokens, and latency. Rate it in Logs.</ListItem>
              <ListItem><b>Adopt</b> the winner: keep its model/prompt version and iterate if needed.</ListItem>
            </List>
            <Text><b>Tips</b>: Keep acceptance criteria in the prompt. Change one thing per iteration. Use Rating to surface quality.</Text>
            <Text><b>Score</b> = tokens + latency_ms − rating×100 (lower is better).</Text>
            <Text><b>Weighted scoring</b> can be added later if you need custom priorities.</Text>
            <Text fontSize="sm" opacity={0.8}>Example acceptance block:</Text>
            <Code whiteSpace="pre-wrap" p={2}>{`Acceptance criteria:\n- Inputs/outputs\n- Edge cases\n- Tests expected\n- Error handling`}</Code>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
