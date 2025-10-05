import { Box, Grid, GridItem, Heading, Stat, StatHelpText, StatLabel, StatNumber } from '@chakra-ui/react'
import React from 'react'
import type { Metrics } from '../types'

export default function MetricsCards({ metrics }: { metrics: Metrics | null }) {
  return (
    <Box bg="whiteAlpha.100" p={4} rounded="md" my={6}>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
        <GridItem>
          <Heading size="sm" mb={2}>Average Latency</Heading>
          <Stat>
            <StatLabel>Avg Latency</StatLabel>
            <StatNumber>{Math.round(metrics?.avg_latency_ms ?? 0)} ms</StatNumber>
            <StatHelpText>across all prompts</StatHelpText>
          </Stat>
        </GridItem>
        <GridItem>
          <Heading size="sm" mb={2}>Average Tokens</Heading>
          <Stat>
            <StatLabel>Avg Tokens</StatLabel>
            <StatNumber>{Math.round(metrics?.avg_tokens ?? 0)}</StatNumber>
            <StatHelpText>per prompt</StatHelpText>
          </Stat>
        </GridItem>
        <GridItem>
          <Heading size="sm" mb={2}>Days Tracked</Heading>
          <Stat>
            <StatLabel>Days</StatLabel>
            <StatNumber>{metrics?.prompts_per_day?.length ?? 0}</StatNumber>
            <StatHelpText>with activity</StatHelpText>
          </Stat>
        </GridItem>
      </Grid>
    </Box>
  )
}
