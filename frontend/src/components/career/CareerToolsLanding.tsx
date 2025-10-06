import React from "react";
import { Box, Heading, Text, Button, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const CareerToolsLanding: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box maxW="600px" mx="auto" mt={10} p={8} bgGradient="linear(to-br, teal.100, blue.50)" rounded="2xl" boxShadow="2xl">
      <Heading size="lg" mb={4} textAlign="center" color="teal.700">Career Tools</Heading>
      <Text fontSize="lg" mb={6} textAlign="center" color="gray.700">
        Unlock your career potential with AI-powered tools. Tailor your CV, prepare for interviews, and stand out in your job search.
      </Text>
      <VStack spacing={4}>
        <Button colorScheme="teal" size="lg" onClick={() => navigate('/career/tailor')}>Tailor My CV & Cover Letter</Button>
        <Button colorScheme="blue" size="lg" onClick={() => navigate('/career/interview-prep')}>Interview Preparation</Button>
      </VStack>
    </Box>
  );
};

export default CareerToolsLanding;
