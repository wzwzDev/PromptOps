export interface UserProfile {
  id: string
  role: UserRole
  preferences: UserPreferences
  behavior: UserBehavior
  createdAt: string
  updatedAt: string
}

export interface UserRole {
  primary: RoleType
  secondary?: RoleType[]
  confidence: number // 0-1 score of how confident we are about this role
}

export type RoleType = 
  | 'developer'
  | 'data-scientist'
  | 'content-writer'
  | 'researcher'
  | 'product-manager'
  | 'marketer'
  | 'student'
  | 'analyst'
  | 'general'

export interface UserPreferences {
  preferredModels: string[]
  averageTemperature: number
  promptLength: 'short' | 'medium' | 'detailed'
  responseStyle: 'concise' | 'detailed' | 'conversational'
  domains: string[] // e.g., ['react', 'python', 'machine-learning']
}

export interface UserBehavior {
  totalRuns: number
  successfulRuns: number
  averageRating: number
  topPromptPatterns: PromptPattern[]
  frequentKeywords: KeywordFrequency[]
  timeOfDayUsage: Record<string, number> // hour -> usage count
  sessionDuration: number[]
}

export interface PromptPattern {
  pattern: string
  frequency: number
  successRate: number
  averageRating: number
  examples: string[]
}

export interface KeywordFrequency {
  keyword: string
  count: number
  context: 'technical' | 'creative' | 'analytical' | 'general'
}

// Prompt suggestions based on user context
export interface SmartSuggestion {
  id: string
  prompt: string
  reasoning: string
  roleRelevance: number // 0-1 how relevant to user's role
  category: SuggestionCategory
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTokens: number
}

export type SuggestionCategory = 
  | 'code-generation'
  | 'debugging'
  | 'documentation'
  | 'analysis'
  | 'creative'
  | 'research'
  | 'optimization'
  | 'learning'

// Template system for role-specific prompts
export interface PromptTemplate {
  id: string
  name: string
  template: string
  variables: TemplateVariable[]
  targetRoles: RoleType[]
  category: SuggestionCategory
  description: string
  examples: TemplateExample[]
}

export interface TemplateVariable {
  name: string
  description: string
  type: 'text' | 'select' | 'number'
  required: boolean
  defaultValue?: string
  options?: string[] // for select type
}

export interface TemplateExample {
  title: string
  variables: Record<string, string>
  expectedOutput: string
}