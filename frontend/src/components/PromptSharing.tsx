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
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Badge,
  IconButton,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  AvatarGroup,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Textarea,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Spinner,
  Center,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber
} from '@chakra-ui/react';
import {
  ExternalLinkIcon,
  DeleteIcon,
  EditIcon,
  ViewIcon,
  StarIcon,
  CopyIcon,
  EmailIcon,
  LockIcon,
  UnlockIcon,
  TimeIcon,
  CheckIcon
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
  privacy: 'private' | 'public' | 'shared';
  usage_count: number;
  success_rate: number;
  avg_rating: number;
  created_at: string;
  user_id?: number;
}

interface Share {
  id: number;
  prompt_id: number;
  shared_with_user_id?: number;
  shared_with_email?: string;
  permission_level: string;
  created_at: string;
  expires_at?: string;
}

interface Feedback {
  id: number;
  rating: number;
  comment?: string;
  helpful?: boolean;
  created_at: string;
  prompt_id: number;
  user_id?: number;
}

interface User {
  id: number;
  username: string;
  email?: string;
}

const PromptSharing: React.FC = () => {
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);
  const [sharedPrompts, setSharedPrompts] = useState<Prompt[]>([]);
  const [publicPrompts, setPublicPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [shares, setShares] = useState<Share[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Share form
  const [shareEmail, setShareEmail] = useState('');
  const [shareUserId, setShareUserId] = useState<number | ''>('');
  const [permissionLevel, setPermissionLevel] = useState('read');
  const [expiresAt, setExpiresAt] = useState('');
  
  // Feedback form
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackHelpful, setFeedbackHelpful] = useState<boolean | undefined>(undefined);
  
  // Duplicate form
  const [duplicateTitle, setDuplicateTitle] = useState('');
  
  const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();
  const { isOpen: isFeedbackOpen, onOpen: onFeedbackOpen, onClose: onFeedbackClose } = useDisclosure();
  const { isOpen: isDuplicateOpen, onOpen: onDuplicateOpen, onClose: onDuplicateClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const toast = useToast();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchMyPrompts();
    fetchSharedPrompts();
    fetchPublicPrompts();
  }, []);

  const fetchMyPrompts = async () => {
    try {
      const response = await api.get('/prompts/?privacy=private');
      setMyPrompts(response.data.items);
    } catch (error) {
      console.error('Error fetching my prompts:', error);
    }
  };

  const fetchSharedPrompts = async () => {
    try {
      const response = await api.get('/shared-with-me');
      setSharedPrompts(response.data);
    } catch (error) {
      console.error('Error fetching shared prompts:', error);
    }
  };

  const fetchPublicPrompts = async () => {
    try {
      const response = await api.get('/prompts/?privacy=public');
      setPublicPrompts(response.data.items);
    } catch (error) {
      console.error('Error fetching public prompts:', error);
    }
  };

  const openShareModal = async (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    
    // Fetch existing shares
    try {
      const response = await api.get(`/prompts/${prompt.id}/shares`);
      setShares(response.data);
    } catch (error) {
      console.error('Error fetching shares:', error);
    }
    
    onShareOpen();
  };

  const openFeedbackModal = async (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    
    // Fetch existing feedback
    try {
      const response = await api.get(`/prompts/${prompt.id}/feedback`);
      setFeedback(response.data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
    
    onFeedbackOpen();
  };

  const sharePrompt = async () => {
    if (!selectedPrompt) return;
    
    if (!shareEmail && !shareUserId) {
      toast({
        title: 'Email or user required',
        description: 'Please enter an email address or select a user',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      await api.post(`/prompts/${selectedPrompt.id}/share`, {
        shared_with_email: shareEmail || undefined,
        shared_with_user_id: shareUserId || undefined,
        permission_level: permissionLevel,
        expires_at: expiresAt || undefined
      });
      
      toast({
        title: 'Prompt shared',
        description: 'The prompt has been shared successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form
      setShareEmail('');
      setShareUserId('');
      setPermissionLevel('read');
      setExpiresAt('');
      
      // Refresh shares
      const response = await api.get(`/prompts/${selectedPrompt.id}/shares`);
      setShares(response.data);
      
    } catch (error: any) {
      toast({
        title: 'Error sharing prompt',
        description: error.response?.data?.detail || 'Failed to share prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const revokeShare = async (shareId: number) => {
    try {
      await api.delete(`/shares/${shareId}`);
      
      toast({
        title: 'Share revoked',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      // Refresh shares
      if (selectedPrompt) {
        const response = await api.get(`/prompts/${selectedPrompt.id}/shares`);
        setShares(response.data);
      }
      
    } catch (error: any) {
      toast({
        title: 'Error revoking share',
        description: error.response?.data?.detail || 'Failed to revoke share',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const submitFeedback = async () => {
    if (!selectedPrompt) return;
    
    try {
      await api.post(`/prompts/${selectedPrompt.id}/feedback`, {
        rating: feedbackRating,
        comment: feedbackComment || undefined,
        helpful: feedbackHelpful
      });
      
      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form
      setFeedbackRating(5);
      setFeedbackComment('');
      setFeedbackHelpful(undefined);
      
      // Refresh feedback
      const response = await api.get(`/prompts/${selectedPrompt.id}/feedback`);
      setFeedback(response.data);
      
    } catch (error: any) {
      toast({
        title: 'Error submitting feedback',
        description: error.response?.data?.detail || 'Failed to submit feedback',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const duplicatePrompt = async () => {
    if (!selectedPrompt) return;
    
    try {
      await api.post(`/prompts/${selectedPrompt.id}/duplicate`);
      
      toast({
        title: 'Prompt duplicated',
        description: 'The prompt has been added to your library',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onDuplicateClose();
      fetchMyPrompts(); // Refresh my prompts
      
    } catch (error: any) {
      toast({
        title: 'Error duplicating prompt',
        description: error.response?.data?.detail || 'Failed to duplicate prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const makePublic = async (prompt: Prompt) => {
    try {
      await api.put(`/prompts/${prompt.id}`, { privacy: 'public' });
      
      toast({
        title: 'Prompt made public',
        description: 'The prompt is now visible to everyone',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchMyPrompts();
      fetchPublicPrompts();
      
    } catch (error: any) {
      toast({
        title: 'Error updating prompt',
        description: error.response?.data?.detail || 'Failed to update prompt privacy',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const makePrivate = async (prompt: Prompt) => {
    try {
      await api.put(`/prompts/${prompt.id}`, { privacy: 'private' });
      
      toast({
        title: 'Prompt made private',
        description: 'The prompt is now only visible to you',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchMyPrompts();
      fetchPublicPrompts();
      
    } catch (error: any) {
      toast({
        title: 'Error updating prompt',
        description: error.response?.data?.detail || 'Failed to update prompt privacy',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
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

  const renderPromptCard = (prompt: Prompt, showOwnership = false, actions: React.ReactNode) => (
    <Card key={prompt.id} shadow="md">
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <VStack align="start" spacing={1} flex="1">
            <HStack>
              <Text fontWeight="bold" fontSize="lg">{prompt.title}</Text>
              <Badge colorScheme={prompt.privacy === 'public' ? 'green' : prompt.privacy === 'shared' ? 'blue' : 'gray'}>
                {prompt.privacy}
              </Badge>
            </HStack>
            {prompt.description && (
              <Text fontSize="sm" color="gray.600">{prompt.description}</Text>
            )}
          </VStack>
          {actions}
        </HStack>
      </CardHeader>
      
      <CardBody pt={0}>
        <VStack spacing={3} align="stretch">
          {/* Tags */}
          <Wrap>
            {prompt.category && (
              <WrapItem>
                <Tag colorScheme="blue">
                  <TagLabel>{prompt.category}</TagLabel>
                </Tag>
              </WrapItem>
            )}
            {prompt.tags.map((tag) => (
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
              <StatLabel>Uses</StatLabel>
              <StatNumber fontSize="sm">{prompt.usage_count}</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>Success</StatLabel>
              <StatNumber fontSize="sm">{(prompt.success_rate * 100).toFixed(0)}%</StatNumber>
            </Stat>
            <Stat size="sm">
              <StatLabel>Rating</StatLabel>
              <StatNumber fontSize="sm">
                <StarIcon color="yellow.400" mr={1} boxSize={3} />
                {prompt.avg_rating.toFixed(1)}
              </StatNumber>
            </Stat>
          </HStack>
          
          {/* Content preview */}
          <Box bg="gray.50" p={3} borderRadius="md" fontSize="sm">
            <Text noOfLines={3}>{prompt.content}</Text>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <Box>
      <Tabs variant="enclosed" colorScheme="teal">
        <TabList>
          <Tab>My Prompts ({myPrompts.length})</Tab>
          <Tab>Shared with Me ({sharedPrompts.length})</Tab>
          <Tab>Public Gallery ({publicPrompts.length})</Tab>
        </TabList>
        
        <TabPanels>
          {/* My Prompts */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Text color="gray.600">
                Manage your prompts and control who can access them.
              </Text>
              
              <Grid templateColumns="repeat(auto-fill, minmax(400px, 1fr))" gap={4}>
                {myPrompts.map((prompt) => 
                  renderPromptCard(
                    prompt, 
                    false,
                    <HStack>
                      <Tooltip label={prompt.privacy === 'private' ? 'Make Public' : 'Make Private'}>
                        <IconButton
                          aria-label="Toggle privacy"
                          icon={prompt.privacy === 'private' ? <UnlockIcon /> : <LockIcon />}
                          size="sm"
                          onClick={() => prompt.privacy === 'private' ? makePublic(prompt) : makePrivate(prompt)}
                        />
                      </Tooltip>
                      <Tooltip label="Share with others">
                        <IconButton
                          aria-label="Share prompt"
                          icon={<ExternalLinkIcon />}
                          size="sm"
                          onClick={() => openShareModal(prompt)}
                        />
                      </Tooltip>
                      <Tooltip label="Copy content">
                        <IconButton
                          aria-label="Copy content"
                          icon={<CopyIcon />}
                          size="sm"
                          onClick={() => copyToClipboard(prompt.content)}
                        />
                      </Tooltip>
                    </HStack>
                  )
                )}
              </Grid>
            </VStack>
          </TabPanel>

          {/* Shared with Me */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Text color="gray.600">
                Prompts that others have shared with you.
              </Text>
              
              <Grid templateColumns="repeat(auto-fill, minmax(400px, 1fr))" gap={4}>
                {sharedPrompts.map((prompt) => 
                  renderPromptCard(
                    prompt,
                    true,
                    <HStack>
                      <Tooltip label="Give feedback">
                        <IconButton
                          aria-label="Give feedback"
                          icon={<StarIcon />}
                          size="sm"
                          onClick={() => openFeedbackModal(prompt)}
                        />
                      </Tooltip>
                      <Tooltip label="Duplicate to my library">
                        <IconButton
                          aria-label="Duplicate prompt"
                          icon={<CopyIcon />}
                          size="sm"
                          onClick={() => {
                            setSelectedPrompt(prompt);
                            onDuplicateOpen();
                          }}
                        />
                      </Tooltip>
                    </HStack>
                  )
                )}
              </Grid>
            </VStack>
          </TabPanel>

          {/* Public Gallery */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <Text color="gray.600">
                Discover prompts shared by the community.
              </Text>
              
              <Grid templateColumns="repeat(auto-fill, minmax(400px, 1fr))" gap={4}>
                {publicPrompts.map((prompt) => 
                  renderPromptCard(
                    prompt,
                    true,
                    <HStack>
                      <Tooltip label="Give feedback">
                        <IconButton
                          aria-label="Give feedback"
                          icon={<StarIcon />}
                          size="sm"
                          onClick={() => openFeedbackModal(prompt)}
                        />
                      </Tooltip>
                      <Tooltip label="Copy content">
                        <IconButton
                          aria-label="Copy content"
                          icon={<CopyIcon />}
                          size="sm"
                          onClick={() => copyToClipboard(prompt.content)}
                        />
                      </Tooltip>
                      <Tooltip label="Duplicate to my library">
                        <IconButton
                          aria-label="Duplicate prompt"
                          icon={<CopyIcon />}
                          size="sm"
                          onClick={() => {
                            setSelectedPrompt(prompt);
                            onDuplicateOpen();
                          }}
                        />
                      </Tooltip>
                    </HStack>
                  )
                )}
              </Grid>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Share Modal */}
      <Modal isOpen={isShareOpen} onClose={onShareClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Share: {selectedPrompt?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {/* Share form */}
              <FormControl>
                <FormLabel>Share with (Email)</FormLabel>
                <Input
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="Enter email address"
                  type="email"
                />
              </FormControl>
              
              <HStack w="100%">
                <FormControl>
                  <FormLabel>Permission Level</FormLabel>
                  <Select value={permissionLevel} onChange={(e) => setPermissionLevel(e.target.value)}>
                    <option value="read">Read Only</option>
                    <option value="write">Read & Write</option>
                    <option value="admin">Admin</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Expires (Optional)</FormLabel>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </FormControl>
              </HStack>
              
              <Button colorScheme="teal" onClick={sharePrompt} w="100%">
                Share Prompt
              </Button>
              
              {/* Existing shares */}
              {shares.length > 0 && (
                <Box w="100%">
                  <Text fontWeight="bold" mb={2}>Current Shares:</Text>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Shared With</Th>
                        <Th>Permission</Th>
                        <Th>Expires</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {shares.map((share) => (
                        <Tr key={share.id}>
                          <Td>{share.shared_with_email || `User ${share.shared_with_user_id}`}</Td>
                          <Td>
                            <Badge>{share.permission_level}</Badge>
                          </Td>
                          <Td>
                            {share.expires_at 
                              ? new Date(share.expires_at).toLocaleDateString()
                              : 'Never'
                            }
                          </Td>
                          <Td>
                            <IconButton
                              aria-label="Revoke share"
                              icon={<DeleteIcon />}
                              size="xs"
                              colorScheme="red"
                              onClick={() => revokeShare(share.id)}
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onShareClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={isFeedbackOpen} onClose={onFeedbackClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Feedback: {selectedPrompt?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {/* Feedback form */}
              <FormControl>
                <FormLabel>Rating</FormLabel>
                <HStack>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <IconButton
                      key={star}
                      aria-label={`Rate ${star} stars`}
                      icon={<StarIcon />}
                      size="sm"
                      colorScheme={star <= feedbackRating ? 'yellow' : 'gray'}
                      variant={star <= feedbackRating ? 'solid' : 'outline'}
                      onClick={() => setFeedbackRating(star)}
                    />
                  ))}
                  <Text ml={2}>{feedbackRating} star{feedbackRating !== 1 ? 's' : ''}</Text>
                </HStack>
              </FormControl>
              
              <FormControl>
                <FormLabel>Comment (Optional)</FormLabel>
                <Textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Share your thoughts about this prompt..."
                  rows={3}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Was this prompt helpful?</FormLabel>
                <HStack>
                  <Button
                    size="sm"
                    colorScheme={feedbackHelpful === true ? 'green' : 'gray'}
                    variant={feedbackHelpful === true ? 'solid' : 'outline'}
                    onClick={() => setFeedbackHelpful(true)}
                  >
                    <CheckIcon mr={1} />
                    Yes
                  </Button>
                  <Button
                    size="sm"
                    colorScheme={feedbackHelpful === false ? 'red' : 'gray'}
                    variant={feedbackHelpful === false ? 'solid' : 'outline'}
                    onClick={() => setFeedbackHelpful(false)}
                  >
                    No
                  </Button>
                </HStack>
              </FormControl>
              
              <Button colorScheme="teal" onClick={submitFeedback} w="100%">
                Submit Feedback
              </Button>
              
              {/* Existing feedback */}
              {feedback.length > 0 && (
                <Box w="100%">
                  <Text fontWeight="bold" mb={2}>Previous Feedback:</Text>
                  <VStack spacing={2} align="stretch" maxH="200px" overflow="auto">
                    {feedback.map((fb) => (
                      <Box key={fb.id} p={3} border="1px" borderColor="gray.200" borderRadius="md">
                        <HStack justify="space-between" mb={1}>
                          <HStack>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon
                                key={star}
                                boxSize={3}
                                color={star <= fb.rating ? 'yellow.400' : 'gray.300'}
                              />
                            ))}
                            <Text fontSize="sm" fontWeight="bold">{fb.rating}/5</Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(fb.created_at).toLocaleDateString()}
                          </Text>
                        </HStack>
                        {fb.comment && (
                          <Text fontSize="sm">{fb.comment}</Text>
                        )}
                        {fb.helpful !== undefined && (
                          <Badge colorScheme={fb.helpful ? 'green' : 'red'} size="sm">
                            {fb.helpful ? 'Helpful' : 'Not Helpful'}
                          </Badge>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onFeedbackClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Duplicate Confirmation */}
      <AlertDialog isOpen={isDuplicateOpen} leastDestructiveRef={cancelRef} onClose={onDuplicateClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Duplicate Prompt
            </AlertDialogHeader>
            <AlertDialogBody>
              This will create a copy of "{selectedPrompt?.title}" in your personal library.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDuplicateClose}>
                Cancel
              </Button>
              <Button colorScheme="teal" onClick={duplicatePrompt} ml={3}>
                Duplicate
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default PromptSharing;