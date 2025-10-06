import React from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel, Box, Heading } from '@chakra-ui/react';
import Runner from '../components/Runner';
import Experiment from '../components/Experiment';
import PromptLeaderboard from '../components/PromptLeaderboard';
import PromptSuggestions from '../components/PromptSuggestions';
import LogsTable from '../components/LogsTable';
import SmartAssistant from '../components/SmartAssistant';

const PromptTools: React.FC = () => (
  <Box maxW="900px" mx="auto" py={8}>
    <Heading size="lg" mb={6} color="teal.700">Prompt Tools</Heading>
    <Tabs variant="enclosed" colorScheme="teal" isFitted>
      <TabList>
        <Tab>Runner</Tab>
        <Tab>Experiment</Tab>
        <Tab>Leaderboard</Tab>
        <Tab>Suggestions</Tab>
        <Tab>Logs</Tab>
        <Tab>AI Assistant</Tab>
      </TabList>
      <TabPanels>
        <TabPanel><Runner /></TabPanel>
        <TabPanel><Experiment /></TabPanel>
        <TabPanel><PromptLeaderboard logs={[]} /></TabPanel>
        <TabPanel><PromptSuggestions logs={[]} /></TabPanel>
        <TabPanel><LogsTable logs={[]} /></TabPanel>
        <TabPanel><SmartAssistant /></TabPanel>
      </TabPanels>
    </Tabs>
  </Box>
);

export default PromptTools;
