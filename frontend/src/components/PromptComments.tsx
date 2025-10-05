import React, { useState } from 'react'
import { Box, Heading, VStack, Textarea, Button, Text, Divider, Avatar, HStack, Input } from '@chakra-ui/react'

interface Comment {
  user: string
  text: string
  timestamp: number
}

export default function PromptComments({ prompt }: { prompt: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [user, setUser] = useState('User')

  const addComment = () => {
    if (!text.trim()) return
    setComments([
      ...comments,
      { user, text, timestamp: Date.now() }
    ])
    setText('')
  }

  return (
    <Box bg="whiteAlpha.100" p={4} rounded="md" my={4}>
      <Heading size="xs" mb={2}>Comments for Prompt</Heading>
      <VStack align="stretch" spacing={3}>
        {comments.length === 0 && <Text opacity={0.7}>No comments yet. Be the first to discuss this prompt!</Text>}
        {comments.map((c, i) => (
          <Box key={i} bg="gray.50" p={2} rounded="md">
            <HStack>
              <Avatar size="xs" name={c.user} />
              <Text fontWeight="bold">{c.user}</Text>
              <Text fontSize="xs" opacity={0.7}>{new Date(c.timestamp).toLocaleString()}</Text>
            </HStack>
            <Divider my={1} />
            <Text>{c.text}</Text>
          </Box>
        ))}
        <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Add a comment..." rows={2} />
        <HStack>
          <Input value={user} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUser(e.target.value)} w="120px" placeholder="Your name" />
          <Button onClick={addComment} colorScheme="blue">Add Comment</Button>
        </HStack>
      </VStack>
    </Box>
  )
}
