import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Select,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  Badge,
  IconButton,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Spinner,
  Center,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Divider
} from '@chakra-ui/react';
import { 
  AddIcon, 
  ViewIcon, 
  StarIcon,
  ChevronDownIcon,
  SearchIcon,
  CopyIcon,
  ExternalLinkIcon
} from '@chakra-ui/icons';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8000'
});

interface Template {
  id: number;
  name: string;
  description: string;
  template: string;
  category: string;
  tags: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface CustomizationField {
  key: string;
  label: string;
  value: string;
  placeholder: string;
}

const PromptTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [customizations, setCustomizations] = useState<CustomizationField[]>([]);
  const [customizedContent, setCustomizedContent] = useState('');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isPreviewOpen, 
    onOpen: onPreviewOpen, 
    onClose: onPreviewClose 
  } = useDisclosure();
  
  const toast = useToast();

  useEffect(() => {
    fetchTemplates();
  }, [searchQuery, categoryFilter]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: '0',
        limit: '50',
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter && { category: categoryFilter })
      });
      
      const response = await api.get(`/templates/?${params}`);
      setTemplates(response.data.items);
    } catch (error) {
      toast({
        title: 'Error fetching templates',
        description: 'Failed to load templates',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  const extractCustomizationFields = (template: string): CustomizationField[] => {
    const regex = /\{([^}]+)\}/g;
    const matches = template.match(regex);
    if (!matches) return [];
    
    const fields: CustomizationField[] = [];
    const seen = new Set<string>();
    
    matches.forEach(match => {
      const key = match.slice(1, -1); // Remove { and }
      if (!seen.has(key)) {
        seen.add(key);
        fields.push({
          key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: '',
          placeholder: `Enter ${key.replace(/_/g, ' ')}`
        });
      }
    });
    
    return fields;
  };

  const openCustomizeModal = (template: Template) => {
    setSelectedTemplate(template);
    const fields = extractCustomizationFields(template.template);
    setCustomizations(fields);
    setCustomizedContent(template.template);
    onOpen();
  };

  const updateCustomization = (key: string, value: string) => {
    setCustomizations(prev => 
      prev.map(field => 
        field.key === key ? { ...field, value } : field
      )
    );
    
    // Update preview
    if (selectedTemplate) {
      let content = selectedTemplate.template;
      customizations.forEach(field => {
        const fieldValue = field.key === key ? value : field.value;
        content = content.replace(new RegExp(`\\{${field.key}\\}`, 'g'), fieldValue);
      });
      setCustomizedContent(content);
    }
  };

  const createPromptFromTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      const customizationMap: Record<string, string> = {};
      customizations.forEach(field => {
        customizationMap[field.key] = field.value;
      });
      
      const response = await api.post(`/templates/${selectedTemplate.id}/use`, customizationMap);
      
      toast({
        title: 'Prompt created from template',
        description: 'Your customized prompt has been added to your library',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error creating prompt',
        description: error.response?.data?.detail || 'Failed to create prompt from template',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const previewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setCustomizedContent(template.template);
    onPreviewOpen();
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box>
      {/* Header with search and filters */}
      <HStack mb={6} spacing={4}>
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          flex="1"
        />
        <Select
          placeholder="All Categories"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          w="200px"
        >
          <option value="Job Search">Job Search</option>
          <option value="Interview Prep">Interview Prep</option>
          <option value="Resume">Resume</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Career Planning">Career Planning</option>
          <option value="Negotiation">Negotiation</option>
          <option value="Performance">Performance</option>
          <option value="Networking">Networking</option>
          <option value="Skill Development">Skill Development</option>
          <option value="Leadership">Leadership</option>
        </Select>
      </HStack>

      {/* Templates grid */}
      {loading ? (
        <Center py={10}>
          <Spinner size="lg" color="teal.500" />
        </Center>
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
          {templates.map((template) => (
            <GridItem key={template.id}>
              <Card h="100%" shadow="md" _hover={{ shadow: 'lg' }}>
                <CardHeader pb={2}>
                  <VStack align="start" spacing={2}>
                    <HStack justify="space-between" w="100%">
                      <Heading size="sm" noOfLines={2}>{template.name}</Heading>
                      <Badge colorScheme="blue">{template.category}</Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" noOfLines={3}>
                      {template.description}
                    </Text>
                  </VStack>
                </CardHeader>
                
                <CardBody pt={0}>
                  <VStack spacing={3} align="stretch">
                    {/* Tags */}
                    <Wrap>
                      {template.tags.map((tag) => (
                        <WrapItem key={tag}>
                          <Tag size="sm" colorScheme="gray">
                            <TagLabel>{tag}</TagLabel>
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                    
                    {/* Stats */}
                    <HStack>
                      <Stat size="sm">
                        <StatLabel>Used</StatLabel>
                        <StatNumber fontSize="sm">{template.usage_count} times</StatNumber>
                      </Stat>
                      <Badge variant="outline" colorScheme="green">
                        <StarIcon mr={1} boxSize={2} />
                        Popular
                      </Badge>
                    </HStack>
                    
                    {/* Template preview */}
                    <Box
                      bg="gray.50"
                      p={3}
                      borderRadius="md"
                      fontSize="xs"
                      fontFamily="mono"
                      maxH="100px"
                      overflow="hidden"
                      position="relative"
                    >
                      <Text noOfLines={4}>{template.template}</Text>
                      <Box
                        position="absolute"
                        bottom="0"
                        left="0"
                        right="0"
                        h="20px"
                        bgGradient="linear(to-t, gray.50, transparent)"
                      />
                    </Box>
                    
                    {/* Actions */}
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        leftIcon={<ViewIcon />}
                        onClick={() => previewTemplate(template)}
                        flex="1"
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<AddIcon />}
                        colorScheme="teal"
                        onClick={() => openCustomizeModal(template)}
                        flex="1"
                      >
                        Use Template
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>
          ))}
        </Grid>
      )}

      {/* Customize Template Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Customize Template: {selectedTemplate?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                Fill in the fields below to customize your prompt:
              </Text>
              
              {/* Customization fields */}
              {customizations.map((field) => (
                <FormControl key={field.key}>
                  <FormLabel fontSize="sm">{field.label}</FormLabel>
                  <Input
                    value={field.value}
                    onChange={(e) => updateCustomization(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    size="sm"
                  />
                </FormControl>
              ))}
              
              <Divider />
              
              {/* Preview */}
              <Box w="100%">
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold" fontSize="sm">Preview:</Text>
                  <IconButton
                    aria-label="Copy to clipboard"
                    icon={<CopyIcon />}
                    size="xs"
                    onClick={() => copyToClipboard(customizedContent)}
                  />
                </HStack>
                <Box
                  bg="gray.50"
                  p={3}
                  borderRadius="md"
                  fontSize="sm"
                  maxH="200px"
                  overflow="auto"
                  whiteSpace="pre-wrap"
                >
                  {customizedContent}
                </Box>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button
              colorScheme="teal"
              onClick={createPromptFromTemplate}
              isDisabled={customizations.some(field => !field.value.trim())}
            >
              Create Prompt
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Text>{selectedTemplate?.name}</Text>
              <Badge colorScheme="blue">{selectedTemplate?.category}</Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                {selectedTemplate?.description}
              </Text>
              
              {/* Tags */}
              <Wrap>
                {selectedTemplate?.tags.map((tag) => (
                  <WrapItem key={tag}>
                    <Tag size="sm" colorScheme="gray">
                      <TagLabel>{tag}</TagLabel>
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
              
              <Divider />
              
              {/* Template content */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold">Template Content:</Text>
                  <IconButton
                    aria-label="Copy to clipboard"
                    icon={<CopyIcon />}
                    size="sm"
                    onClick={() => copyToClipboard(selectedTemplate?.template || '')}
                  />
                </HStack>
                <Box
                  bg="gray.50"
                  p={4}
                  borderRadius="md"
                  fontSize="sm"
                  fontFamily="mono"
                  whiteSpace="pre-wrap"
                  maxH="300px"
                  overflow="auto"
                >
                  {selectedTemplate?.template}
                </Box>
              </Box>
              
              {/* Usage stats */}
              <HStack>
                <Stat size="sm">
                  <StatLabel>Times Used</StatLabel>
                  <StatNumber>{selectedTemplate?.usage_count}</StatNumber>
                </Stat>
                <Stat size="sm">
                  <StatLabel>Created</StatLabel>
                  <StatNumber fontSize="sm">
                    {selectedTemplate?.created_at 
                      ? new Date(selectedTemplate.created_at).toLocaleDateString()
                      : 'N/A'
                    }
                  </StatNumber>
                </Stat>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPreviewClose}>Close</Button>
            <Button
              colorScheme="teal"
              onClick={() => {
                onPreviewClose();
                if (selectedTemplate) openCustomizeModal(selectedTemplate);
              }}
            >
              Use This Template
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PromptTemplates;