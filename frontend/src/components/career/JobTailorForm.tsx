import React, { useState } from 'react';
import { Box, Heading, VStack, Input, Textarea, Button, FormControl, FormLabel, Text } from '@chakra-ui/react';

export default function JobTailorForm() {
  const [form, setForm] = useState({
    jobDescription: '',
    company: '',
    recruiter: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{cv: string; cover_letter: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
  const res = await fetch('http://localhost:8000/api/career/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_description: form.jobDescription,
          company: form.company,
          recruiter: form.recruiter,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate CV');
      }
      const data = await res.json();
      setResult(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
  <Box maxW="2xl" mx="auto" mt={10} p={8} bgGradient="linear(to-br, teal.100, blue.50)" rounded="2xl" boxShadow="2xl" border="2px solid" borderColor="teal.300">
      <Heading size="lg" mb={6} textAlign="center">Tailor CV & Cover Letter for a Job</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={5} align="stretch">
          <FormControl>
            <FormLabel>Job Description</FormLabel>
            <Textarea name="jobDescription" value={form.jobDescription} onChange={handleChange} rows={5} placeholder="Paste the job description here..." />
          </FormControl>
          <FormControl>
            <FormLabel>Company Name</FormLabel>
            <Input name="company" value={form.company} onChange={handleChange} placeholder="Company name (optional)" />
          </FormControl>
          <FormControl>
            <FormLabel>Recruiter Name/Info</FormLabel>
            <Input name="recruiter" value={form.recruiter} onChange={handleChange} placeholder="Recruiter name or info (optional)" />
          </FormControl>
          <Button type="submit" colorScheme="blue" size="lg" isLoading={submitting}>Generate Tailored CV & Cover Letter</Button>
          {error && <Text color="red.500" fontWeight="bold" textAlign="center">{error}</Text>}
          {result && (
            <Box mt={6} p={4} bg="gray.50" rounded="md" boxShadow="md">
              <Heading size="md" mb={2}>Preview: Tailored CV</Heading>
              <Text whiteSpace="pre-wrap" fontFamily="mono" fontSize="sm" mb={4}>
                {typeof result.cv === 'string'
                  ? result.cv
                  : Object.entries(result.cv).map(([key, value]) => (
                      <React.Fragment key={key}>
                        <strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}<br />
                      </React.Fragment>
                    ))}
              </Text>
              <Heading size="md" mb={2}>Preview: Cover Letter</Heading>
              <Text whiteSpace="pre-wrap" fontFamily="mono" fontSize="sm" mb={4}>{result.cover_letter}</Text>
              <Button colorScheme="teal" size="sm" onClick={() => {
                const blob = new Blob([
                  `CV:\n${result.cv}\n\nCover Letter:\n${result.cover_letter}`
                ], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tailored_cv_cover_letter.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}>Download as TXT</Button>
            </Box>
          )}
          {success && !result && <Text color="green.600" fontWeight="bold" textAlign="center">Request submitted!</Text>}
        </VStack>
      </form>
    </Box>
  );
}
