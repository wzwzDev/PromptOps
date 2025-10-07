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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
  Center
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  ViewIcon, 
  StarIcon, 
  TimeIcon,
  ChevronDownIcon,
  SearchIcon
} from '@chakra-ui/icons';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8000'
});

interface Prompt {
  id: number;
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags: string[];
  status: 'draft' | 'active' | 'archived';
  privacy: 'private' | 'public' | 'shared';
  usage_count: number;
  success_rate: number;
  avg_rating: number;
  created_at: string;
  updated_at: string;
  user_id?: number;
}

interface PromptVersion {
  id: number;
  version_number: number;
  content: string;
  changes_description?: string;
  created_at: string;
  prompt_id: number;
}

const PromptLibrary: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: '',
    category: '',
    tags: [] as string[],
    privacy: 'private' as 'private' | 'public' | 'shared'
  });
  const [newTag, setNewTag] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isDeleteOpen, 
    onOpen: onDeleteOpen, 
    onClose: onDeleteClose 
  } = useDisclosure();
  const { 
    isOpen: isVersionsOpen, 
    onOpen: onVersionsOpen, 
    onClose: onVersionsClose 
  } = useDisclosure();
  
  const toast = useToast();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchPrompts();
  }, [page, searchQuery, categoryFilter, statusFilter]);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: ((page - 1) * 20).toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter })
      });
      
      const response = await api.get(`/prompts/?${params}`);
      setPrompts(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      toast({
        title: 'Error fetching prompts',
        description: 'Failed to load prompts',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    try {
      if (isEditing && editingId) {
        await api.put(`/prompts/${editingId}`, formData);
        toast({
          title: 'Prompt updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await api.post('/prompts/', formData);
        toast({
          title: 'Prompt created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      resetForm();
      onClose();
      fetchPrompts();
    } catch (error: any) {
      toast({
        title: 'Error saving prompt',
        description: error.response?.data?.detail || 'Failed to save prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setFormData({
      title: prompt.title,
      content: prompt.content,
      description: prompt.description || '',
      category: prompt.category || '',
      tags: prompt.tags,
      privacy: prompt.privacy
    });
    setIsEditing(true);
    setEditingId(prompt.id);
    onOpen();
  };

  const handleDelete = async () => {
    if (!selectedPrompt) return;
    
    try {
      await api.delete(`/prompts/${selectedPrompt.id}`);
      toast({
        title: 'Prompt deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      fetchPrompts();
    } catch (error) {
      toast({
        title: 'Error deleting prompt',
        description: 'Failed to delete prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRevert = async (versionNumber: number) => {
    if (!selectedPrompt) return;
    
    try {
      await api.post(`/prompts/${selectedPrompt.id}/revert/${versionNumber}`);
      toast({
        title: 'Prompt reverted',
        description: `Reverted to version ${versionNumber}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onVersionsClose();
      fetchPrompts();
    } catch (error) {
      toast({
        title: 'Error reverting prompt',
        description: 'Failed to revert prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const fetchVersions = async (promptId: number) => {
    try {
      const response = await api.get(`/prompts/${promptId}/versions`);
      setVersions(response.data);
    } catch (error) {
      toast({
        title: 'Error fetching versions',
        description: 'Failed to load prompt versions',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openVersions = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    fetchVersions(prompt.id);
    onVersionsOpen();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      description: '',
      category: '',
      tags: [],
      privacy: 'private'
    });
    setNewTag('');
    setIsEditing(false);
    setEditingId(null);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <Box>
      {/* Header with search and filters */}
      <HStack mb={6} spacing={4}>
        <Input
          placeholder="Search prompts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          flex="1"
        />
        <Select
          placeholder="Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          w="200px"
        >
          <option value="Job Search">Job Search</option>
          <option value="Interview Prep">Interview Prep</option>
          <option value="Resume">Resume</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Career Planning">Career Planning</option>
          <option value="Leadership">Leadership</option>
        </Select>
        <Select
          placeholder="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          w="150px"
        >
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
        <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={() => { resetForm(); onOpen(); }}>
          New Prompt
        </Button>
      </HStack>

      {/* Prompts list */}
      {loading ? (
        <Center py={10}>
          <Spinner size="lg" color="teal.500" />
        </Center>
      ) : (
        <VStack spacing={4} align="stretch">
          {prompts.map((prompt) => (
            <Box
              key={prompt.id}
              p={4}
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
              bg="white"
              shadow="sm"
            >
              <HStack justify="space-between" mb={2}>
                <VStack align="start" spacing={1} flex="1">
                  <HStack>
                    <Text fontWeight="bold" fontSize="lg">{prompt.title}</Text>
                    <Badge colorScheme={prompt.status === 'active' ? 'green' : prompt.status === 'draft' ? 'yellow' : 'gray'}>
                      {prompt.status}
                    </Badge>
                    <Badge colorScheme={prompt.privacy === 'public' ? 'blue' : prompt.privacy === 'shared' ? 'purple' : 'gray'}>
                      {prompt.privacy}
                    </Badge>
                  </HStack>
                  {prompt.description && (
                    <Text color="gray.600" fontSize="sm">{prompt.description}</Text>
                  )}
                  <HStack>
                    {prompt.category && (
                      <Tag size="sm" colorScheme="blue">
                        <TagLabel>{prompt.category}</TagLabel>
                      </Tag>
                    )}
                    {prompt.tags.map((tag) => (
                      <Tag key={tag} size="sm" colorScheme="gray">
                        <TagLabel>{tag}</TagLabel>
                      </Tag>
                    ))}
                  </HStack>
                </VStack>
                
                <VStack spacing={2}>
                  <StatGroup textAlign="center">
                    <Stat>
                      <StatLabel>Uses</StatLabel>
                      <StatNumber fontSize="sm">{prompt.usage_count}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Success</StatLabel>
                      <StatNumber fontSize="sm">{(prompt.success_rate * 100).toFixed(0)}%</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Rating</StatLabel>
                      <StatNumber fontSize="sm">{prompt.avg_rating.toFixed(1)}/5</StatNumber>
                    </Stat>
                  </StatGroup>
                  
                  <HStack>
                    <IconButton
                      aria-label="View versions"
                      icon={<TimeIcon />}
                      size="sm"
                      onClick={() => openVersions(prompt)}
                    />
                    <IconButton
                      aria-label="Edit prompt"
                      icon={<EditIcon />}
                      size="sm"
                      onClick={() => handleEdit(prompt)}
                    />
                    <IconButton
                      aria-label="Delete prompt"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        onDeleteOpen();
                      }}
                    />
                  </HStack>
                </VStack>
              </HStack>
              
              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                {prompt.content}
              </Text>
            </Box>
          ))}
        </VStack>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? 'Edit Prompt' : 'Create New Prompt'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Title</FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter prompt title"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Content</FormLabel>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter prompt content"
                  rows={6}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description (optional)"
                />
              </FormControl>
              
              <HStack width="100%">
                <FormControl>
                  <FormLabel>Category</FormLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Select category"
                  >
                    <option value="Job Search">Job Search</option>
                    <option value="Interview Prep">Interview Prep</option>
                    <option value="Resume">Resume</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Career Planning">Career Planning</option>
                    <option value="Leadership">Leadership</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Privacy</FormLabel>
                  <Select
                    value={formData.privacy}
                    onChange={(e) => setFormData(prev => ({ ...prev, privacy: e.target.value as any }))}
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                    <option value="shared">Shared</option>
                  </Select>
                </FormControl>
              </HStack>
              
              <FormControl>
                <FormLabel>Tags</FormLabel>
                <HStack>
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button onClick={addTag}>Add</Button>
                </HStack>
                <Wrap mt={2}>
                  {formData.tags.map((tag) => (
                    <WrapItem key={tag}>
                      <Tag>
                        <TagLabel>{tag}</TagLabel>
                        <Button
                          size="xs"
                          ml={1}
                          onClick={() => removeTag(tag)}
                        >
                          ×
                        </Button>
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="teal" onClick={handleSubmit}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Versions Modal */}
      <Modal isOpen={isVersionsOpen} onClose={onVersionsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Prompt Versions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {versions.map((version) => (
                <Box key={version.id} p={3} border="1px" borderColor="gray.200" borderRadius="md">
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold">Version {version.version_number}</Text>
                    <HStack>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(version.created_at).toLocaleDateString()}
                      </Text>
                      <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={() => handleRevert(version.version_number)}
                      >
                        Revert
                      </Button>
                    </HStack>
                  </HStack>
                  {version.changes_description && (
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      {version.changes_description}
                    </Text>
                  )}
                  <Text fontSize="sm" bg="gray.50" p={2} borderRadius="md">
                    {version.content}
                  </Text>
                </Box>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onVersionsClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Prompt
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{selectedPrompt?.title}"? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default PromptLibrary;