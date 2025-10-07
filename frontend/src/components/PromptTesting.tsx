import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  Textarea,
  FormControl,
  FormLabel,
  useToast,
  Spinner,
  Divider,
  Badge,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Code,
  Grid,
  GridItem
} from '@chakra-ui/react';
import { 
  TriangleUpIcon, 
  CopyIcon, 
  SettingsIcon,
  InfoIcon,
  CheckIcon,
  WarningIcon
} from '@chakra-ui/icons';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8000'
});

interface TestResult {
  prompt: string;
  sample_input?: string;
  response: string;
  model: string;
  tokens: number;
  latency_ms: number;
  timestamp?: string;
}

interface SavedTest {
  id: string;
  name: string;
  prompt: string;
  sample_input?: string;
  model: string;
  temperature: number;
  results: TestResult[];
  created_at: string;
}

const PromptTesting: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [temperature, setTemperature] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [savedTests, setSavedTests] = useState<SavedTest[]>([]);
  const [testName, setTestName] = useState('');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    loadSavedTests();
  }, []);

  const loadSavedTests = () => {
    const saved = localStorage.getItem('promptTests');
    if (saved) {
      setSavedTests(JSON.parse(saved));
    }
  };

  const saveTest = () => {
    if (!testName.trim()) {
      toast({
        title: 'Test name required',
        description: 'Please enter a name for this test',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const newTest: SavedTest = {
      id: Date.now().toString(),
      name: testName,
      prompt,
      sample_input: sampleInput,
      model,
      temperature,
      results,
      created_at: new Date().toISOString()
    };

    const updated = [...savedTests, newTest];
    setSavedTests(updated);
    localStorage.setItem('promptTests', JSON.stringify(updated));
    
    toast({
      title: 'Test saved',
      description: `Test "${testName}" has been saved`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    setTestName('');
    onClose();
  };

  const loadTest = (test: SavedTest) => {
    setPrompt(test.prompt);
    setSampleInput(test.sample_input || '');
    setModel(test.model);
    setTemperature(test.temperature);
    setResults(test.results);
  };

  const deleteTest = (testId: string) => {
    const updated = savedTests.filter(test => test.id !== testId);
    setSavedTests(updated);
    localStorage.setItem('promptTests', JSON.stringify(updated));
    
    toast({
      title: 'Test deleted',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const runTest = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt required',
        description: 'Please enter a prompt to test',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await api.post('/prompts/test', {
        prompt,
        sample_input: sampleInput || undefined,
        model,
        temperature
      });
      
      const newResult: TestResult = {
        ...response.data,
        timestamp: new Date().toISOString()
      };
      
      setResults(prev => [newResult, ...prev]);
      
      toast({
        title: 'Test completed',
        description: `Response generated in ${newResult.latency_ms}ms`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error: any) {
      toast({
        title: 'Test failed',
        description: error.response?.data?.detail || 'Failed to run test',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    
    setIsLoading(false);
  };

  const runBatchTest = async (iterations: number = 3) => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt required',
        description: 'Please enter a prompt to test',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const batchResults: TestResult[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const response = await api.post('/prompts/test', {
          prompt,
          sample_input: sampleInput || undefined,
          model,
          temperature
        });
        
        batchResults.push({
          ...response.data,
          timestamp: new Date().toISOString()
        });
        
        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setResults(prev => [...batchResults, ...prev]);
      
      const avgLatency = batchResults.reduce((sum, r) => sum + r.latency_ms, 0) / batchResults.length;
      const avgTokens = batchResults.reduce((sum, r) => sum + r.tokens, 0) / batchResults.length;
      
      toast({
        title: 'Batch test completed',
        description: `${iterations} tests completed. Avg latency: ${avgLatency.toFixed(0)}ms, Avg tokens: ${avgTokens.toFixed(0)}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error: any) {
      toast({
        title: 'Batch test failed',
        description: error.response?.data?.detail || 'Failed to run batch test',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const clearResults = () => {
    setResults([]);
    toast({
      title: 'Results cleared',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const exportResults = () => {
    const data = {
      prompt,
      sampleInput,
      model,
      temperature,
      results,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-test-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Results exported',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 1000) return 'green';
    if (latency < 3000) return 'yellow';
    return 'red';
  };

  const getTokenColor = (tokens: number) => {
    if (tokens < 500) return 'green';
    if (tokens < 1000) return 'yellow';
    return 'red';
  };

  return (
    <Box>
      <Tabs variant="enclosed" colorScheme="teal">
        <TabList>
          <Tab>Test Sandbox</Tab>
          <Tab>Saved Tests ({savedTests.length})</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Grid templateColumns="1fr 1fr" gap={6} h="100%">
              {/* Test Configuration */}
              <GridItem>
                <Card>
                  <CardHeader>
                    <Heading size="md">Test Configuration</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel>Prompt</FormLabel>
                        <Textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Enter your prompt here..."
                          rows={6}
                          resize="vertical"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Sample Input (Optional)</FormLabel>
                        <Textarea
                          value={sampleInput}
                          onChange={(e) => setSampleInput(e.target.value)}
                          placeholder="Enter sample input to test with..."
                          rows={3}
                        />
                      </FormControl>
                      
                      <HStack w="100%">
                        <FormControl>
                          <FormLabel>Model</FormLabel>
                          <Select value={model} onChange={(e) => setModel(e.target.value)}>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                          </Select>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Temperature: {temperature}</FormLabel>
                          <Slider
                            value={temperature}
                            onChange={setTemperature}
                            min={0}
                            max={1}
                            step={0.1}
                            colorScheme="teal"
                          >
                            <SliderTrack>
                              <SliderFilledTrack />
                            </SliderTrack>
                            <SliderThumb />
                          </Slider>
                        </FormControl>
                      </HStack>
                      
                      <Divider />
                      
                      <VStack w="100%" spacing={2}>
                        <Button
                          leftIcon={<TriangleUpIcon />}
                          colorScheme="teal"
                          onClick={runTest}
                          isLoading={isLoading}
                          loadingText="Testing..."
                          w="100%"
                          size="lg"
                        >
                          Run Test
                        </Button>
                        
                        <HStack w="100%">
                          <Button
                            size="sm"
                            onClick={() => runBatchTest(3)}
                            isLoading={isLoading}
                            variant="outline"
                            flex="1"
                          >
                            Batch Test (3x)
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => runBatchTest(5)}
                            isLoading={isLoading}
                            variant="outline"
                            flex="1"
                          >
                            Batch Test (5x)
                          </Button>
                        </HStack>
                        
                        <HStack w="100%">
                          <Button
                            size="sm"
                            onClick={onOpen}
                            isDisabled={!prompt.trim() || results.length === 0}
                            flex="1"
                          >
                            Save Test
                          </Button>
                          <Button
                            size="sm"
                            onClick={exportResults}
                            isDisabled={results.length === 0}
                            flex="1"
                          >
                            Export Results
                          </Button>
                          <Button
                            size="sm"
                            onClick={clearResults}
                            isDisabled={results.length === 0}
                            colorScheme="red"
                            variant="outline"
                            flex="1"
                          >
                            Clear
                          </Button>
                        </HStack>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>
              
              {/* Results */}
              <GridItem>
                <Card h="100%">
                  <CardHeader>
                    <HStack justify="space-between">
                      <Heading size="md">Test Results ({results.length})</Heading>
                      {results.length > 0 && (
                        <HStack>
                          <Badge colorScheme="blue">
                            Avg: {(results.reduce((sum, r) => sum + r.latency_ms, 0) / results.length).toFixed(0)}ms
                          </Badge>
                          <Badge colorScheme="green">
                            Tokens: {(results.reduce((sum, r) => sum + r.tokens, 0) / results.length).toFixed(0)}
                          </Badge>
                        </HStack>
                      )}
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch" maxH="600px" overflow="auto">
                      {results.length === 0 ? (
                        <Box textAlign="center" py={8} color="gray.500">
                          <InfoIcon mb={2} />
                          <Text>No test results yet. Run a test to see results here.</Text>
                        </Box>
                      ) : (
                        results.map((result, index) => (
                          <Box
                            key={index}
                            p={4}
                            border="1px"
                            borderColor="gray.200"
                            borderRadius="md"
                            bg="white"
                          >
                            <HStack justify="space-between" mb={2}>
                              <HStack>
                                <Badge colorScheme={getLatencyColor(result.latency_ms)}>
                                  {result.latency_ms}ms
                                </Badge>
                                <Badge colorScheme={getTokenColor(result.tokens)}>
                                  {result.tokens} tokens
                                </Badge>
                                <Badge variant="outline">{result.model}</Badge>
                              </HStack>
                              <IconButton
                                aria-label="Copy response"
                                icon={<CopyIcon />}
                                size="sm"
                                onClick={() => copyToClipboard(result.response)}
                              />
                            </HStack>
                            
                            {result.sample_input && (
                              <Box mb={2}>
                                <Text fontSize="xs" color="gray.500" mb={1}>Input:</Text>
                                <Code fontSize="xs" p={2} w="100%" display="block">
                                  {result.sample_input}
                                </Code>
                              </Box>
                            )}
                            
                            <Box>
                              <Text fontSize="xs" color="gray.500" mb={1}>Response:</Text>
                              <Box
                                bg="gray.50"
                                p={3}
                                borderRadius="md"
                                fontSize="sm"
                                whiteSpace="pre-wrap"
                                maxH="200px"
                                overflow="auto"
                              >
                                {result.response}
                              </Box>
                            </Box>
                            
                            {result.timestamp && (
                              <Text fontSize="xs" color="gray.400" mt={2}>
                                {new Date(result.timestamp).toLocaleString()}
                              </Text>
                            )}
                          </Box>
                        ))
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </TabPanel>
          
          <TabPanel>
            <VStack spacing={4} align="stretch">
              {savedTests.length === 0 ? (
                <Box textAlign="center" py={8} color="gray.500">
                  <Text>No saved tests yet. Save a test from the sandbox to see it here.</Text>
                </Box>
              ) : (
                <Accordion allowToggle>
                  {savedTests.map((test) => (
                    <AccordionItem key={test.id}>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <HStack>
                            <Text fontWeight="bold">{test.name}</Text>
                            <Badge>{test.model}</Badge>
                            <Badge colorScheme="blue">{test.results.length} results</Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.500">
                            Created: {new Date(test.created_at).toLocaleDateString()}
                          </Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel>
                        <VStack spacing={4} align="stretch">
                          <Box>
                            <Text fontSize="sm" fontWeight="bold" mb={1}>Prompt:</Text>
                            <Code fontSize="sm" p={2} w="100%" display="block">
                              {test.prompt}
                            </Code>
                          </Box>
                          
                          {test.sample_input && (
                            <Box>
                              <Text fontSize="sm" fontWeight="bold" mb={1}>Sample Input:</Text>
                              <Code fontSize="sm" p={2} w="100%" display="block">
                                {test.sample_input}
                              </Code>
                            </Box>
                          )}
                          
                          <HStack>
                            <Text fontSize="sm"><strong>Model:</strong> {test.model}</Text>
                            <Text fontSize="sm"><strong>Temperature:</strong> {test.temperature}</Text>
                            <Text fontSize="sm"><strong>Results:</strong> {test.results.length}</Text>
                          </HStack>
                          
                          <HStack>
                            <Button
                              size="sm"
                              onClick={() => loadTest(test)}
                              colorScheme="teal"
                            >
                              Load Test
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => deleteTest(test.id)}
                              colorScheme="red"
                              variant="outline"
                            >
                              Delete
                            </Button>
                          </HStack>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Save Test Modal */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Save Test
            </AlertDialogHeader>
            <AlertDialogBody>
              <FormControl>
                <FormLabel>Test Name</FormLabel>
                <Input
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Enter a name for this test..."
                />
              </FormControl>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="teal" onClick={saveTest} ml={3}>
                Save
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default PromptTesting;