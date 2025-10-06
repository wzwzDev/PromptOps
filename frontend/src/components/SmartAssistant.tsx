import React, { useEffect, useState } from 'react'
import { Box, Button, Heading, VStack, HStack, Text, Badge, Select, Input, Textarea, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, Tabs, TabList, TabPanels, Tab, TabPanel, Divider, SimpleGrid } from '@chakra-ui/react'
import { RoleDetector, SuggestionEngine, TemplateEngine } from '../lib/intelligence'
import type { UserProfile, RoleType, SmartSuggestion, PromptTemplate } from '../types/profiles'
import { fetchLogs } from '../lib/api'

interface Props {
  onUsePrompt?: (prompt: string) => void
  onUseTemplate?: (template: PromptTemplate) => void
}

export default function SmartAssistant({ onUsePrompt, onUseTemplate }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()

  useEffect(() => {
    analyzeUserProfile()
    setTemplates(TemplateEngine.templates)
  }, [])

  useEffect(() => {
    if (profile) {
      const newSuggestions = SuggestionEngine.generateSuggestions(profile)
      setSuggestions(newSuggestions)
    }
  }, [profile])

  const analyzeUserProfile = async () => {
    setIsAnalyzing(true)
    try {
      // Get user's recent prompts to analyze patterns
      const logs = await fetchLogs({ page_size: 100 })
      const prompts = logs.items.map(log => log.prompt)
      
      if (prompts.length === 0) {
        // Default profile for new users
        setProfile({
          id: 'user-1',
          role: { primary: 'general', confidence: 0.1 },
          preferences: {
            preferredModels: [],
            averageTemperature: 0.7,
            promptLength: 'medium',
            responseStyle: 'detailed',
            domains: []
          },
          behavior: {
            totalRuns: 0,
            successfulRuns: 0,
            averageRating: 0,
            topPromptPatterns: [],
            frequentKeywords: [],
            timeOfDayUsage: {},
            sessionDuration: []
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        return
      }

      // Detect user role based on prompt patterns
      const { role, confidence } = RoleDetector.detectRole(prompts)
      const patterns = RoleDetector.analyzePromptPatterns(prompts)

      // Calculate user preferences
      const avgTokens = logs.items.reduce((sum, log) => sum + log.tokens, 0) / logs.items.length
      const promptLength = avgTokens < 50 ? 'short' : avgTokens < 150 ? 'medium' : 'detailed'

      // Extract domains from prompts
      const domains = extractDomains(prompts)

      const userProfile: UserProfile = {
        id: 'user-1',
        role: { primary: role, confidence },
        preferences: {
          preferredModels: [...new Set(logs.items.map(log => log.model))],
          averageTemperature: logs.items.reduce((sum, log) => sum + (log.temperature || 0.7), 0) / logs.items.length,
          promptLength,
          responseStyle: 'detailed',
          domains
        },
        behavior: {
          totalRuns: logs.items.length,
          successfulRuns: logs.items.filter(log => log.rating && log.rating >= 4).length,
          averageRating: logs.items.filter(log => log.rating).reduce((sum, log) => sum + (log.rating || 0), 0) / logs.items.filter(log => log.rating).length || 0,
          topPromptPatterns: patterns,
          frequentKeywords: extractKeywords(prompts),
          timeOfDayUsage: {},
          sessionDuration: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setProfile(userProfile)
    } catch (error) {
      console.error('Failed to analyze user profile:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const extractDomains = (prompts: string[]): string[] => {
    const techKeywords = ['react', 'vue', 'angular', 'python', 'javascript', 'typescript', 'java', 'go', 'rust', 'docker', 'kubernetes', 'aws', 'machine learning', 'ai', 'data science', 'sql', 'mongodb', 'postgresql']
    const domains: Set<string> = new Set()
    
    prompts.forEach(prompt => {
      const promptLower = prompt.toLowerCase()
      techKeywords.forEach(keyword => {
        if (promptLower.includes(keyword)) {
          domains.add(keyword)
        }
      })
    })
    
    return Array.from(domains).slice(0, 10)
  }

  const extractKeywords = (prompts: string[]): Array<{keyword: string; count: number; context: 'technical' | 'creative' | 'analytical' | 'general'}> => {
    const keywords: Record<string, number> = {}
    
    prompts.forEach(prompt => {
      const words = prompt.toLowerCase().match(/\b\w{4,}\b/g) || []
      words.forEach(word => {
        keywords[word] = (keywords[word] || 0) + 1
      })
    })
    
    return Object.entries(keywords)
      .filter(([_, count]) => count >= 2)
      .map(([keyword, count]) => ({
        keyword,
        count,
        context: 'general' as const // TODO: Classify context
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      const filledPrompt = TemplateEngine.fillTemplate(selectedTemplate, templateVariables)
      onUsePrompt?.(filledPrompt)
      onUseTemplate?.(selectedTemplate)
      onClose()
    }
  }

  const handleUseSuggestion = (suggestion: SmartSuggestion) => {
    onUsePrompt?.(suggestion.prompt)
  }

  const getRoleColor = (role: RoleType): string => {
    const colors = {
      developer: 'blue',
      'data-scientist': 'green',
      'content-writer': 'purple',
      researcher: 'orange',
      'product-manager': 'pink',
      marketer: 'red',
      student: 'cyan',
      analyst: 'teal',
      general: 'gray'
    }
    return colors[role] || 'gray'
  }

  if (isAnalyzing) {
    return (
      <Box className="pro-card" textAlign="center" py={8}>
        <Text>🧠 Analyzing your prompt patterns...</Text>
        <Text fontSize="sm" opacity={0.7} mt={2}>Learning your preferences to provide better suggestions</Text>
      </Box>
    )
  }

  return (
    <VStack align="stretch" spacing={8} maxW="100%">
      {/* Header Section */}
      <Box textAlign="center" py={6}>
        <Heading size="xl" color="brand.500" mb={2}>
          🤖 AI Assistant
        </Heading>
        <Text fontSize="lg" opacity={0.8}>
          Intelligent, personalized prompt assistance tailored to your role and preferences
        </Text>
      </Box>

      {/* User Profile Analysis - Large Card */}
      {profile && (
        <Box className="pro-card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20" p={8}>
          <Heading size="lg" mb={6} color="brand.600">
            👤 Your AI Profile
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {/* Role Detection */}
            <VStack align="start" spacing={3}>
              <Text fontWeight="bold" fontSize="md" color="gray.600" _dark={{color: "gray.300"}}>
                DETECTED ROLE
              </Text>
              <HStack>
                <Badge 
                  colorScheme={getRoleColor(profile.role.primary)} 
                  fontSize="md" 
                  px={4} 
                  py={2}
                  borderRadius="full"
                >
                  {profile.role.primary.replace('-', ' ').toUpperCase()}
                </Badge>
                <Text fontSize="sm" opacity={0.7}>
                  {Math.round(profile.role.confidence * 100)}% confidence
                </Text>
              </HStack>
            </VStack>
            
            {/* Domains */}
            <VStack align="start" spacing={3}>
              <Text fontWeight="bold" fontSize="md" color="gray.600" _dark={{color: "gray.300"}}>
                YOUR DOMAINS
              </Text>
              <HStack wrap="wrap">
                {profile.preferences.domains.slice(0, 5).map(domain => (
                  <Badge key={domain} variant="outline" size="sm" colorScheme="purple">
                    {domain}
                  </Badge>
                ))}
              </HStack>
            </VStack>
            
            {/* Statistics */}
            <VStack align="start" spacing={3}>
              <Text fontWeight="bold" fontSize="md" color="gray.600" _dark={{color: "gray.300"}}>
                PERFORMANCE
              </Text>
              <VStack align="start" spacing={2}>
                <HStack>
                  <Text fontSize="sm">Total Runs:</Text>
                  <Text fontWeight="bold">{profile.behavior.totalRuns}</Text>
                </HStack>
                <HStack>
                  <Text fontSize="sm">Success Rate:</Text>
                  <Text fontWeight="bold" color="green.500">
                    {profile.behavior.totalRuns > 0 
                      ? Math.round((profile.behavior.successfulRuns / profile.behavior.totalRuns) * 100)
                      : 0}%
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </SimpleGrid>
          
          <HStack justify="center" mt={6}>
            <Button 
              size="md" 
              variant="outline" 
              onClick={analyzeUserProfile} 
              className="pro-focus"
              colorScheme="brand"
            >
              🔄 Refresh Analysis
            </Button>
          </HStack>
        </Box>
      )}

      {/* Smart Suggestions - Large Featured Section */}
      <Box className="pro-card" p={8}>
        <Heading size="lg" mb={6} color="brand.600">
          💡 Smart Suggestions Tailored for You
        </Heading>
        
        {suggestions.length > 0 ? (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {suggestions.slice(0, 4).map(suggestion => (
              <Box 
                key={suggestion.id} 
                className="glass border-2 border-brand-200 hover:border-brand-400 transition-all duration-200"
                p={6} 
                rounded="xl"
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "xl"
                }}
              >
                {/* Header */}
                <HStack justify="space-between" mb={4}>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Badge colorScheme="blue" size="md" px={3} py={1}>
                        {suggestion.category}
                      </Badge>
                      <Badge variant="outline" size="md" px={3} py={1}>
                        {suggestion.difficulty}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" _dark={{color: "gray.400"}} fontStyle="italic">
                      {suggestion.reasoning}
                    </Text>
                  </VStack>
                  <VStack spacing={1}>
                    <Text fontSize="xs" opacity={0.7} textAlign="center">RELEVANCE</Text>
                    <Text fontWeight="bold" color="green.500" fontSize="lg">
                      {Math.round(suggestion.roleRelevance * 100)}%
                    </Text>
                  </VStack>
                </HStack>
                
                {/* Prompt Content */}
                <Box 
                  bg="gray.50" 
                  _dark={{bg: "gray.800"}} 
                  p={4} 
                  rounded="lg" 
                  mb={4}
                  borderLeft="4px solid"
                  borderLeftColor="brand.400"
                  minH="120px"
                >
                  <Text fontSize="md" fontFamily="mono" whiteSpace="pre-line" lineHeight="1.6">
                    {suggestion.prompt}
                  </Text>
                </Box>
                
                {/* Actions */}
                <HStack justify="space-between" align="center">
                  <Button 
                    size="md" 
                    onClick={() => handleUseSuggestion(suggestion)}
                    className="pro-focus bg-brand-500 hover:bg-brand-600 text-white"
                    px={6}
                  >
                    Use This Prompt
                  </Button>
                  <Text fontSize="sm" opacity={0.7}>
                    ~{suggestion.estimatedTokens} tokens
                  </Text>
                </HStack>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Box textAlign="center" py={12}>
            <Text fontSize="lg" opacity={0.7}>
              {isAnalyzing ? "🔍 Analyzing your profile..." : "Run some prompts to get personalized suggestions!"}
            </Text>
          </Box>
        )}
      </Box>

      {/* Template Library - Large Section */}
      <Box className="pro-card" p={8}>
        <HStack justify="space-between" mb={6}>
          <Heading size="lg" color="brand.600">
            📚 Template Library
          </Heading>
          <Button 
            onClick={onOpen} 
            className="pro-focus bg-purple-500 hover:bg-purple-600 text-white"
            size="lg"
            px={8}
          >
            Browse All Templates
          </Button>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {templates
            .filter(t => !profile || t.targetRoles.includes(profile.role.primary))
            .slice(0, 6)
            .map(template => (
            <Box 
              key={template.id} 
              className="glass border hover:border-brand-300 transition-all duration-200"
              p={6} 
              rounded="lg"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "lg"
              }}
            >
              <VStack align="start" spacing={4} h="full">
                <VStack align="start" spacing={2} flex={1}>
                  <Text fontWeight="bold" fontSize="lg" color="brand.600">
                    {template.name}
                  </Text>
                  <Text fontSize="sm" opacity={0.8} lineHeight="1.5">
                    {template.description}
                  </Text>
                  <HStack wrap="wrap">
                    {template.variables.slice(0, 3).map(variable => (
                      <Badge key={variable.name} size="xs" variant="outline" colorScheme="gray">
                        {variable.name}
                      </Badge>
                    ))}
                    {template.variables.length > 3 && (
                      <Badge size="xs" variant="outline">
                        +{template.variables.length - 3} more
                      </Badge>
                    )}
                  </HStack>
                </VStack>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(template)
                    setTemplateVariables({})
                    onOpen()
                  }}
                  className="pro-focus w-full"
                  colorScheme="brand"
                >
                  Use Template
                </Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* Template Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedTemplate ? `Configure: ${selectedTemplate.name}` : 'Template Library'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedTemplate ? (
              <VStack align="stretch" spacing={4}>
                <Text opacity={0.8}>{selectedTemplate.description}</Text>
                
                <VStack align="stretch" spacing={3}>
                  {selectedTemplate.variables.map(variable => (
                    <Box key={variable.name}>
                      <Text fontWeight="bold" mb={1}>
                        {variable.name} {variable.required && <Text as="span" color="red.500">*</Text>}
                      </Text>
                      <Text fontSize="sm" opacity={0.7} mb={2}>{variable.description}</Text>
                      
                      {variable.type === 'select' ? (
                        <Select 
                          value={templateVariables[variable.name] || variable.defaultValue || ''}
                          onChange={(e) => setTemplateVariables(prev => ({...prev, [variable.name]: e.target.value}))}
                          className="pro-focus"
                        >
                          <option value="">Select {variable.name}</option>
                          {variable.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </Select>
                      ) : variable.type === 'number' ? (
                        <Input 
                          type="number"
                          value={templateVariables[variable.name] || variable.defaultValue || ''}
                          onChange={(e) => setTemplateVariables(prev => ({...prev, [variable.name]: e.target.value}))}
                          className="pro-focus"
                        />
                      ) : (
                        <Textarea 
                          value={templateVariables[variable.name] || variable.defaultValue || ''}
                          onChange={(e) => setTemplateVariables(prev => ({...prev, [variable.name]: e.target.value}))}
                          rows={variable.name === 'code' ? 6 : 3}
                          className="pro-focus"
                        />
                      )}
                    </Box>
                  ))}
                </VStack>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>Preview:</Text>
                  <Box bg="gray.50" _dark={{bg: "gray.800"}} p={3} rounded="md">
                    <Text fontSize="sm" fontFamily="mono" whiteSpace="pre-line">
                      {TemplateEngine.fillTemplate(selectedTemplate, templateVariables)}
                    </Text>
                  </Box>
                </Box>

                <HStack justify="end">
                  <Button variant="outline" onClick={onClose}>Cancel</Button>
                  <Button onClick={handleUseTemplate} className="pro-focus bg-brand-500 hover:bg-brand-600 text-white">
                    Use This Prompt
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <VStack align="stretch" spacing={3}>
                {templates.map(template => (
                  <Box key={template.id} className="glass p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                       onClick={() => {
                         setSelectedTemplate(template)
                         setTemplateVariables({})
                       }}>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{template.name}</Text>
                        <Text fontSize="sm" opacity={0.7}>{template.description}</Text>
                        <HStack>
                          <Badge size="sm">{template.category}</Badge>
                          {template.targetRoles.map(role => (
                            <Badge key={role} colorScheme={getRoleColor(role)} size="sm">
                              {role.replace('-', ' ')}
                            </Badge>
                          ))}
                        </HStack>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  )
}