import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  useToast,
  Spinner,
  Center,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { InfoIcon, StarIcon, ArrowUpIcon } from '@chakra-ui/icons';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8000'
});

interface PromptAnalytics {
  id: number;
  prompt_id: number;
  date: string;
  usage_count: number;
  success_count: number;
  avg_rating: number;
  avg_latency: number;
  total_tokens: number;
}

interface Prompt {
  id: number;
  title: string;
  usage_count: number;
  success_rate: number;
  avg_rating: number;
  category?: string;
}

interface CategoryStats {
  category: string;
  count: number;
  avg_rating: number;
  total_usage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PromptAnalytics: React.FC = () => {
  const [selectedPrompt, setSelectedPrompt] = useState<number | ''>('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [analytics, setAnalytics] = useState<PromptAnalytics[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30'); // days
  
  const toast = useToast();

  useEffect(() => {
    fetchPrompts();
    fetchCategoryStats();
  }, []);

  useEffect(() => {
    if (selectedPrompt) {
      fetchAnalytics(selectedPrompt as number);
    }
  }, [selectedPrompt, timeRange]);

  const fetchPrompts = async () => {
    try {
      const response = await api.get('/prompts/?limit=100');
      setPrompts(response.data.items);
      
      // Auto-select the first prompt with analytics
      if (response.data.items.length > 0) {
        const promptWithUsage = response.data.items.find((p: Prompt) => p.usage_count > 0);
        if (promptWithUsage) {
          setSelectedPrompt(promptWithUsage.id);
        }
      }
    } catch (error) {
      toast({
        title: 'Error fetching prompts',
        description: 'Failed to load prompts',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchAnalytics = async (promptId: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/prompts/${promptId}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      toast({
        title: 'Error fetching analytics',
        description: 'Failed to load analytics data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  const fetchCategoryStats = async () => {
    try {
      const response = await api.get('/prompts/?limit=1000');
      const allPrompts = response.data.items;
      
      // Group by category
      const categoryMap = new Map<string, CategoryStats>();
      
      allPrompts.forEach((prompt: Prompt) => {
        const category = prompt.category || 'Uncategorized';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            count: 0,
            avg_rating: 0,
            total_usage: 0
          });
        }
        
        const stats = categoryMap.get(category)!;
        stats.count += 1;
        stats.total_usage += prompt.usage_count;
        stats.avg_rating = (stats.avg_rating * (stats.count - 1) + prompt.avg_rating) / stats.count;
      });
      
      setCategoryStats(Array.from(categoryMap.values()));
    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  };

  const getOverallStats = () => {
    if (analytics.length === 0) return null;
    
    const totalUsage = analytics.reduce((sum, a) => sum + a.usage_count, 0);
    const totalSuccess = analytics.reduce((sum, a) => sum + a.success_count, 0);
    const avgLatency = analytics.reduce((sum, a) => sum + a.avg_latency, 0) / analytics.length;
    const avgRating = analytics.reduce((sum, a) => sum + a.avg_rating, 0) / analytics.length;
    const totalTokens = analytics.reduce((sum, a) => sum + a.total_tokens, 0);
    const successRate = totalUsage > 0 ? (totalSuccess / totalUsage) * 100 : 0;
    
    return {
      totalUsage,
      successRate,
      avgLatency,
      avgRating,
      totalTokens
    };
  };

  const getChartData = () => {
    return analytics
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(a => ({
        date: new Date(a.date).toLocaleDateString(),
        usage: a.usage_count,
        success_rate: a.usage_count > 0 ? (a.success_count / a.usage_count) * 100 : 0,
        avg_rating: a.avg_rating,
        latency: a.avg_latency,
        tokens: a.total_tokens
      }));
  };

  const getTopPrompts = () => {
    return prompts
      .filter(p => p.usage_count > 0)
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);
  };

  const getBestRatedPrompts = () => {
    return prompts
      .filter(p => p.avg_rating > 0)
      .sort((a, b) => b.avg_rating - a.avg_rating)
      .slice(0, 10);
  };

  const getCategoryChartData = () => {
    return categoryStats.map(stat => ({
      name: stat.category,
      value: stat.total_usage,
      count: stat.count,
      rating: stat.avg_rating
    }));
  };

  const overallStats = getOverallStats();
  const chartData = getChartData();
  const topPrompts = getTopPrompts();
  const bestRatedPrompts = getBestRatedPrompts();
  const categoryChartData = getCategoryChartData();

  return (
    <Box>
      <Tabs variant="enclosed" colorScheme="teal">
        <TabList>
          <Tab>Prompt Analytics</Tab>
          <Tab>Overview Dashboard</Tab>
          <Tab>Category Analysis</Tab>
        </TabList>
        
        <TabPanels>
          {/* Individual Prompt Analytics */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              {/* Prompt Selector */}
              <HStack>
                <Select
                  placeholder="Select a prompt to analyze"
                  value={selectedPrompt}
                  onChange={(e) => setSelectedPrompt(e.target.value ? parseInt(e.target.value) : '')}
                  maxW="400px"
                >
                  {prompts
                    .filter(p => p.usage_count > 0)
                    .map(prompt => (
                      <option key={prompt.id} value={prompt.id}>
                        {prompt.title} ({prompt.usage_count} uses)
                      </option>
                    ))}
                </Select>
                
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  maxW="150px"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </Select>
              </HStack>

              {loading ? (
                <Center py={10}>
                  <Spinner size="lg" color="teal.500" />
                </Center>
              ) : selectedPrompt && overallStats ? (
                <>
                  {/* Overall Stats */}
                  <Grid templateColumns="repeat(5, 1fr)" gap={4}>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Total Usage</StatLabel>
                          <StatNumber>{overallStats.totalUsage}</StatNumber>
                          <StatHelpText>Times used</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                    
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Success Rate</StatLabel>
                          <StatNumber>{overallStats.successRate.toFixed(1)}%</StatNumber>
                          <StatHelpText>
                            <StatArrow type={overallStats.successRate > 80 ? 'increase' : 'decrease'} />
                            Success rate
                          </StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                    
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Avg Rating</StatLabel>
                          <StatNumber>{overallStats.avgRating.toFixed(1)}/5</StatNumber>
                          <StatHelpText>User satisfaction</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                    
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Avg Latency</StatLabel>
                          <StatNumber>{overallStats.avgLatency.toFixed(0)}ms</StatNumber>
                          <StatHelpText>Response time</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                    
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Total Tokens</StatLabel>
                          <StatNumber>{overallStats.totalTokens.toLocaleString()}</StatNumber>
                          <StatHelpText>Tokens used</StatHelpText>
                        </Stat>
                      </CardBody>
                    </Card>
                  </Grid>

                  {/* Charts */}
                  <Grid templateColumns="1fr 1fr" gap={6}>
                    <Card>
                      <CardHeader>
                        <Heading size="md">Usage Over Time</Heading>
                      </CardHeader>
                      <CardBody>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <RechartsTooltip />
                            <Area type="monotone" dataKey="usage" stroke="#0088FE" fill="#0088FE" fillOpacity={0.3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <Heading size="md">Performance Metrics</Heading>
                      </CardHeader>
                      <CardBody>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line type="monotone" dataKey="success_rate" stroke="#00C49F" name="Success Rate %" />
                            <Line type="monotone" dataKey="avg_rating" stroke="#FFBB28" name="Avg Rating" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardBody>
                    </Card>
                  </Grid>

                  <Grid templateColumns="1fr 1fr" gap={6}>
                    <Card>
                      <CardHeader>
                        <Heading size="md">Response Latency</Heading>
                      </CardHeader>
                      <CardBody>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <RechartsTooltip />
                            <Area type="monotone" dataKey="latency" stroke="#FF8042" fill="#FF8042" fillOpacity={0.3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <Heading size="md">Token Usage</Heading>
                      </CardHeader>
                      <CardBody>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <RechartsTooltip />
                            <Bar dataKey="tokens" fill="#8884D8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardBody>
                    </Card>
                  </Grid>
                </>
              ) : (
                <Center py={10}>
                  <VStack>
                    <InfoIcon boxSize={8} color="gray.400" />
                    <Text color="gray.500">
                      {prompts.filter(p => p.usage_count > 0).length === 0 
                        ? 'No prompts with usage data found. Use some prompts to see analytics.'
                        : 'Select a prompt to view its analytics'
                      }
                    </Text>
                  </VStack>
                </Center>
              )}
            </VStack>
          </TabPanel>

          {/* Overview Dashboard */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Grid templateColumns="1fr 1fr" gap={6}>
                {/* Top Performing Prompts */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Most Used Prompts</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      {topPrompts.map((prompt, index) => (
                        <HStack key={prompt.id} justify="space-between">
                          <HStack>
                            <Badge colorScheme="blue">{index + 1}</Badge>
                            <Text fontSize="sm" noOfLines={1} flex="1">
                              {prompt.title}
                            </Text>
                          </HStack>
                          <HStack>
                            <Badge>{prompt.usage_count} uses</Badge>
                            <Progress
                              value={(prompt.usage_count / topPrompts[0].usage_count) * 100}
                              size="sm"
                              colorScheme="blue"
                              w="50px"
                            />
                          </HStack>
                        </HStack>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Best Rated Prompts */}
                <Card>
                  <CardHeader>
                    <Heading size="md">Best Rated Prompts</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      {bestRatedPrompts.map((prompt, index) => (
                        <HStack key={prompt.id} justify="space-between">
                          <HStack>
                            <Badge colorScheme="yellow">{index + 1}</Badge>
                            <Text fontSize="sm" noOfLines={1} flex="1">
                              {prompt.title}
                            </Text>
                          </HStack>
                          <HStack>
                            <Badge colorScheme="yellow">
                              <StarIcon mr={1} boxSize={2} />
                              {prompt.avg_rating.toFixed(1)}
                            </Badge>
                            <Progress
                              value={(prompt.avg_rating / 5) * 100}
                              size="sm"
                              colorScheme="yellow"
                              w="50px"
                            />
                          </HStack>
                        </HStack>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>

              {/* Summary Stats Table */}
              <Card>
                <CardHeader>
                  <Heading size="md">Prompt Performance Summary</Heading>
                </CardHeader>
                <CardBody>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Prompt</Th>
                        <Th>Category</Th>
                        <Th isNumeric>Uses</Th>
                        <Th isNumeric>Success Rate</Th>
                        <Th isNumeric>Avg Rating</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {prompts
                        .filter(p => p.usage_count > 0)
                        .sort((a, b) => b.usage_count - a.usage_count)
                        .slice(0, 20)
                        .map(prompt => (
                          <Tr key={prompt.id}>
                            <Td>
                              <Text noOfLines={1} maxW="200px">
                                {prompt.title}
                              </Text>
                            </Td>
                            <Td>
                              <Badge size="sm">{prompt.category || 'Uncategorized'}</Badge>
                            </Td>
                            <Td isNumeric>{prompt.usage_count}</Td>
                            <Td isNumeric>
                              <Badge
                                colorScheme={prompt.success_rate > 0.8 ? 'green' : prompt.success_rate > 0.6 ? 'yellow' : 'red'}
                              >
                                {(prompt.success_rate * 100).toFixed(0)}%
                              </Badge>
                            </Td>
                            <Td isNumeric>
                              <Badge
                                colorScheme={prompt.avg_rating > 4 ? 'green' : prompt.avg_rating > 3 ? 'yellow' : 'red'}
                              >
                                {prompt.avg_rating.toFixed(1)}/5
                              </Badge>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  prompt.success_rate > 0.8 && prompt.avg_rating > 4 ? 'green' :
                                  prompt.usage_count > 10 ? 'blue' : 'gray'
                                }
                              >
                                {prompt.success_rate > 0.8 && prompt.avg_rating > 4 ? 'Excellent' :
                                 prompt.usage_count > 10 ? 'Popular' : 'Needs Work'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Category Analysis */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Grid templateColumns="1fr 1fr" gap={6}>
                <Card>
                  <CardHeader>
                    <Heading size="md">Usage by Category</Heading>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="md">Category Performance</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {categoryStats
                        .sort((a, b) => b.total_usage - a.total_usage)
                        .map(stat => (
                          <Box key={stat.category} p={3} border="1px" borderColor="gray.200" borderRadius="md">
                            <HStack justify="space-between" mb={2}>
                              <Text fontWeight="bold">{stat.category}</Text>
                              <Badge>{stat.count} prompts</Badge>
                            </HStack>
                            <HStack justify="space-between">
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" color="gray.600">Total Usage</Text>
                                <Text fontWeight="bold">{stat.total_usage}</Text>
                              </VStack>
                              <VStack align="end" spacing={0}>
                                <Text fontSize="sm" color="gray.600">Avg Rating</Text>
                                <HStack>
                                  <StarIcon color="yellow.400" boxSize={3} />
                                  <Text fontWeight="bold">{stat.avg_rating.toFixed(1)}</Text>
                                </HStack>
                              </VStack>
                            </HStack>
                          </Box>
                        ))}
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default PromptAnalytics;