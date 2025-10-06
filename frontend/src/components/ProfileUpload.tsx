import React, { useState } from 'react';
import { Box, Heading, VStack, Input, Textarea, Button, FormControl, FormLabel, SimpleGrid, Text } from '@chakra-ui/react';

export default function ProfileUpload() {
  const [form, setForm] = useState({
    introduction: '',
    experiences: '',
    skills: '',
    volunteering: '',
    internships: '',
    studies: '',
    languages: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    // TODO: Send form and file to backend API
    setTimeout(() => {
      setUploading(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <Box maxW="2xl" mx="auto" mt={10} p={8} bg="white" rounded="2xl" boxShadow="lg">
      <Heading size="lg" mb={6} textAlign="center">Upload Your CV & Profile</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={5} align="stretch">
          <FormControl>
            <FormLabel>Upload CV (PDF/DOCX)</FormLabel>
            <Input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
          </FormControl>
          <SimpleGrid columns={[1, 2]} spacing={5}>
            <FormControl>
              <FormLabel>Introduction</FormLabel>
              <Textarea name="introduction" value={form.introduction} onChange={handleChange} rows={2} />
            </FormControl>
            <FormControl>
              <FormLabel>Experiences</FormLabel>
              <Textarea name="experiences" value={form.experiences} onChange={handleChange} rows={2} />
            </FormControl>
            <FormControl>
              <FormLabel>Skills</FormLabel>
              <Textarea name="skills" value={form.skills} onChange={handleChange} rows={2} />
            </FormControl>
            <FormControl>
              <FormLabel>Volunteering</FormLabel>
              <Textarea name="volunteering" value={form.volunteering} onChange={handleChange} rows={2} />
            </FormControl>
            <FormControl>
              <FormLabel>Internships</FormLabel>
              <Textarea name="internships" value={form.internships} onChange={handleChange} rows={2} />
            </FormControl>
            <FormControl>
              <FormLabel>Studies</FormLabel>
              <Textarea name="studies" value={form.studies} onChange={handleChange} rows={2} />
            </FormControl>
            <FormControl>
              <FormLabel>Languages</FormLabel>
              <Textarea name="languages" value={form.languages} onChange={handleChange} rows={2} />
            </FormControl>
          </SimpleGrid>
          <Button type="submit" colorScheme="blue" size="lg" isLoading={uploading}>Submit Profile</Button>
          {success && <Text color="green.600" fontWeight="bold" textAlign="center">Profile uploaded successfully!</Text>}
        </VStack>
      </form>
    </Box>
  );
}
