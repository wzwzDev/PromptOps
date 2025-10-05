import React, { useState } from 'react'
import { Box, HStack, Button, Badge, Text } from '@chakra-ui/react'

const TAGS = ['Good', 'Bad', 'Needs Review', 'Experiment', 'Golden']

export default function TagPrompt({ tags, onTag }: { tags: string[], onTag: (tag: string) => void }) {
  const [selected, setSelected] = useState<string[]>(tags)

  const toggleTag = (tag: string) => {
    let next
    if (selected.includes(tag)) {
      next = selected.filter(t => t !== tag)
    } else {
      next = [...selected, tag]
    }
    setSelected(next)
    onTag(tag)
  }

  return (
    <Box>
      <Text fontSize="sm" mb={1}>Tags:</Text>
      <HStack>
        {TAGS.map(tag => (
          <Button key={tag} size="xs" colorScheme={selected.includes(tag) ? 'blue' : 'gray'} variant={selected.includes(tag) ? 'solid' : 'outline'} onClick={() => toggleTag(tag)}>
            {tag}
          </Button>
        ))}
      </HStack>
      <HStack mt={2}>
        {selected.map(tag => (
          <Badge key={tag} colorScheme="blue">{tag}</Badge>
        ))}
      </HStack>
    </Box>
  )
}
