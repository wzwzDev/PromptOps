import React from 'react'
import { Button } from '@chakra-ui/react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'

const steps: Step[] = [
  {
    target: 'h1',
    content: 'Welcome to PromptOps! This dashboard tracks all your AI prompts and responses.',
  },
  {
    target: '[data-tour="runner"]',
    content: 'Use the Runner panel to test prompts with different models and settings.',
  },
  {
    target: '[data-tour="filters"]',
    content: 'Filter logs by model, date, tokens, and more. Add sample logs for quick testing.',
  },
  {
    target: '[data-tour="metrics"]',
    content: 'See key metrics: average latency, tokens, and tracked days.',
  },
  {
    target: '[data-tour="charts"]',
    content: 'Visualize daily requests, latency, and token usage trends.',
  },
  {
    target: '[data-tour="versioncompare"]',
    content: 'Compare prompt versions to find the best-performing ones.',
  },
  {
    target: '[data-tour="logstable"]',
    content: 'Browse all prompt logs, responses, and performance details.',
  },
]

export default function OnboardingTour({ run, onFinish }: { run: boolean, onFinish?: () => void }) {
  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      styles={{ options: { zIndex: 10000 } }}
      callback={(data: CallBackProps) => {
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
          onFinish?.()
        }
      }}
    />
  )
}
