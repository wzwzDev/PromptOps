import React from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel, Box, Heading } from '@chakra-ui/react';
import LogsTable from '../components/LogsTable';
import PromptMutationPanel from '../components/PromptMutationPanel';
import PromptLibrary from '../components/PromptLibrary';
import PromptTemplates from '../components/PromptTemplates';
import PromptAnalytics from '../components/PromptAnalytics';
import PromptTesting from '../components/PromptTesting';
import PromptSharing from '../components/PromptSharing';

const PromptTools: React.FC = () => (
  <Box maxW="1200px" mx="auto" py={8}>
    <Heading size="lg" mb={6} color="teal.700">Prompt Tools</Heading>
    <Tabs variant="enclosed" colorScheme="teal" isFitted>
      <TabList>
        <Tab>My Prompts</Tab>
        <Tab>Templates</Tab>
        <Tab>Testing</Tab>
        <Tab>Analytics</Tab>
        <Tab>Sharing</Tab>
        <Tab>Mutation</Tab>
        <Tab>Logs</Tab>
      </TabList>
      <TabPanels>
        <TabPanel><PromptLibrary /></TabPanel>
        <TabPanel><PromptTemplates /></TabPanel>
        <TabPanel><PromptTesting /></TabPanel>
        <TabPanel><PromptAnalytics /></TabPanel>
        <TabPanel><PromptSharing /></TabPanel>
        <TabPanel><PromptMutationPanel /></TabPanel>
        <TabPanel><LogsTable logs={[]} /></TabPanel>
      </TabPanels>
    </Tabs>
  </Box>
);

export default PromptTools;
