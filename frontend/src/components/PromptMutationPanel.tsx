import React, { useState } from 'react';
import { Box, Heading, VStack, Input, Textarea, Button, FormControl, FormLabel, Select, Spinner, Divider, Text, HStack } from '@chakra-ui/react';
import axios from 'axios';

const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const defaultModels = ['gpt-3.5-turbo', 'gpt-4'];
const defaultMutations = [
  'rewrite in fewer tokens',
  'make more formal',
  'add more detail',
];

export default function PromptMutationPanel() {
  const [prompt, setPrompt] = useState('');
  const [mutations, setMutations] = useState(defaultMutations);
  const [models, setModels] = useState(defaultModels);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<Record<number, { rating: string; annotation: string; suggestion: string }>>({});
  const [fbLoading, setFbLoading] = useState<Record<number, boolean>>({});
  const [fbSuccess, setFbSuccess] = useState<Record<number, boolean>>({});

  const handleRun = async () => {
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const res = await axios.post(`${base}/api/prompt/mutate-analyze`, {
        prompt,
        mutations,
        models,
      });
      setResults(res.data.results);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to run mutation analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackChange = (idx: number, field: string, value: string) => {
    setFeedback(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        [field]: value,
      },
    }));
  };

  const handleSubmitFeedback = async (idx: number) => {
    const r = results[idx];
    const fb = feedback[idx];
    if (!fb || !fb.rating) {
      setError('Please select a rating before submitting feedback.');
      return;
    }
    setFbLoading(prev => ({ ...prev, [idx]: true }));
    setError('');
    try {
      await axios.post(`${base}/api/prompt/feedback`, {
        prompt,
        mutation: r.mutation,
        mutated_prompt: r.mutated_prompt,
        rating: fb.rating,
        annotation: fb.annotation,
        suggestion: fb.suggestion,
      });
      setFbSuccess(prev => ({ ...prev, [idx]: true }));
      setFeedback(prev => ({ ...prev, [idx]: { rating: '', annotation: '', suggestion: '' } }));
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to submit feedback.');
    } finally {
      setFbLoading(prev => ({ ...prev, [idx]: false }));
    }
  };

  return (
    <Box maxW="900px" mx="auto" py={8}>
      <Heading size="lg" mb={6} color="teal.700">Prompt Mutation & Analysis</Heading>
      <VStack spacing={4} align="stretch">
        <FormControl>
          <FormLabel>Base Prompt</FormLabel>
          <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} placeholder="Enter your prompt here..." />
        </FormControl>
        <FormControl>
          <FormLabel>Mutations (one per line)</FormLabel>
          <Textarea value={mutations.join('\n')} onChange={e => setMutations(e.target.value.split('\n'))} rows={3} />
        </FormControl>
        <FormControl>
          <FormLabel>Models</FormLabel>
          <Select multiple value={models} onChange={e => setModels(Array.from(e.target.selectedOptions, o => o.value))}>
            {defaultModels.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </FormControl>
        <Button colorScheme="teal" onClick={handleRun} isLoading={loading}>Run Mutation Analysis</Button>
        {error && <Text color="red.500">{error}</Text>}
        {loading && <Spinner />}
        {results.length > 0 && results.map((r, idx) => (
          <Box key={idx} p={4} bg="gray.50" rounded="md" mb={4}>
            <Heading size="sm" mb={2}>Mutation: {r.mutation}</Heading>
            <Text fontWeight="bold" mb={2}>Mutated Prompt: {r.mutated_prompt}</Text>
            <Divider mb={2} />
            {r.outputs.map((o: any, i: number) => (
              <Box key={i} mb={2}>
                <Text><b>Model:</b> {o.model}</Text>
                <Text><b>Output:</b> {o.output}</Text>
                <Text><b>Tokens Used:</b> {o.tokens_used}</Text>
                <Text><b>Token Efficiency:</b> {o.token_efficiency.toFixed(3)}</Text>
              </Box>
            ))}
            {r.similarity !== null && <Text color="blue.600" mt={2}><b>Semantic Similarity:</b> {r.similarity.toFixed(3)}</Text>}
            {r.diff.length > 0 && (
              <Box mt={2}>
                <Text fontWeight="bold">Visual Diff:</Text>
                {r.diff.map((d: any, i: number) => (
                  <Text key={i} fontSize="sm" color="orange.700">Line {d.line}: <b>Model1:</b> {d.model1} <b>Model2:</b> {d.model2}</Text>
                ))}
              </Box>
            )}
            <Divider my={3} />
            <Box>
              <Heading size="xs" mb={2}>Your Feedback</Heading>
              <VStack align="stretch" spacing={2}>
                <FormControl>
                  <FormLabel>Rating</FormLabel>
                  <Select
                    placeholder="Select rating"
                    value={feedback[idx]?.rating || ''}
                    onChange={e => handleFeedbackChange(idx, 'rating', e.target.value)}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="poor">Poor</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Annotation</FormLabel>
                  <Textarea
                    placeholder="Add annotation (optional)"
                    value={feedback[idx]?.annotation || ''}
                    onChange={e => handleFeedbackChange(idx, 'annotation', e.target.value)}
                    size="sm"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Suggestion</FormLabel>
                  <Input
                    placeholder="Suggest improvement (optional)"
                    value={feedback[idx]?.suggestion || ''}
                    onChange={e => handleFeedbackChange(idx, 'suggestion', e.target.value)}
                    size="sm"
                  />
                </FormControl>
                <HStack>
                  <Button
                    colorScheme="teal"
                    size="sm"
                    onClick={() => handleSubmitFeedback(idx)}
                    isLoading={fbLoading[idx]}
                  >
                    Submit Feedback
                  </Button>
                  {fbSuccess[idx] && <Text color="green.500" fontSize="sm">Feedback submitted!</Text>}
                </HStack>
              </VStack>
            </Box>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
