import React, { useState } from "react";
import { Box, Heading, Textarea, Button, VStack, List, ListItem, Spinner } from "@chakra-ui/react";
import axios from "axios";
const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

const InterviewPrep: React.FC = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [profile, setProfile] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${base}/api/tailor/interview-questions`, {
        job_description: jobDescription,
        profile,
      });
      setQuestions(res.data.questions);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to fetch questions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="600px" mx="auto" mt={8} p={4} borderWidth={1} borderRadius="lg">
      <Heading size="md" mb={4}>Interview Preparation</Heading>
      <VStack spacing={4} align="stretch">
        <Textarea
          placeholder="Paste job description here..."
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
        />
        <Textarea
          placeholder="Paste your profile here (or leave blank to use uploaded profile)..."
          value={profile}
          onChange={e => setProfile(e.target.value)}
        />
        <Button colorScheme="blue" onClick={handleGenerate} isLoading={loading}>
          Generate Interview Questions
        </Button>
        {error && <Box color="red.500">{error}</Box>}
        {loading && <Spinner />}
        {questions.length > 0 && (
          <List spacing={2} mt={4}>
            {questions.map((q, i) => (
              <ListItem key={i}>• {q}</ListItem>
            ))}
          </List>
        )}
      </VStack>
    </Box>
  );
};

export default InterviewPrep;
