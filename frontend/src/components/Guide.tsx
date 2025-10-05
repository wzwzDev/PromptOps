import React from 'react'
import { Box, Heading, Text, List, ListItem, Link, VStack, Divider, UnorderedList } from '@chakra-ui/react'

export default function Guide() {
  return (
    <Box bg="whiteAlpha.100" p={4} rounded="md">
      <Heading size="md" mb={2} id="top">User Guide</Heading>
      <Text mb={3} id="quickstart">A simple loop: Run → Compare → Save → Rate. Use Experiment for a one-page flow.</Text>
      <Box mb={4}>
        <Heading size="sm" mb={2}>On this page</Heading>
        <UnorderedList>
          <ListItem><Link href="#score" color="teal.300">Scoring and weights</Link></ListItem>
          <ListItem><Link href="#runner" color="teal.300">Runner</Link></ListItem>
          <ListItem><Link href="#compare" color="teal.300">Compare</Link></ListItem>
          <ListItem><Link href="#boards" color="teal.300">Boards</Link></ListItem>
          <ListItem><Link href="#baseline" color="teal.300">Baseline</Link></ListItem>
        </UnorderedList>
      </Box>
      <VStack align="stretch" spacing={3}>
        <Box>
          <Heading size="sm" id="score">Scoring and weights</Heading>
          <Text><b>Score</b> = tokens×wTokens + latency_ms×wLatency − rating×wRating (lower is better).</Text>
        </Box>
        <Divider/>
        <Box>
          <Heading size="sm" id="runner">Runner</Heading>
          <Text>Include acceptance criteria in the prompt; use Diff for quick comparisons.</Text>
        </Box>
        <Divider/>
        <Box>
          <Heading size="sm" id="compare">Compare</Heading>
          <Text>Pick any two runs; "Best" uses the same Score.</Text>
        </Box>
        <Divider/>
        <Box>
          <Heading size="sm" id="boards">Boards</Heading>
          <Text>Save wins; export JSON/CSV for sharing.</Text>
        </Box>
        <Divider/>
        <Box>
          <Heading size="sm" id="baseline">Baseline</Heading>
          <Text>Pin your best-known result for a prompt. New runs auto-diff against the pinned baseline.</Text>
        </Box>
        <Divider/>
        <Text>Full guide: <Link href="/docs/USER_GUIDE.md" color="teal.300">docs/USER_GUIDE.md</Link></Text>
      </VStack>
    </Box>
  )
}
