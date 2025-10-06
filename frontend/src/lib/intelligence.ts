import type { UserProfile, RoleType, SmartSuggestion, PromptTemplate, PromptPattern } from '../types/profiles'

// Smart role detection based on prompt patterns
export class RoleDetector {
  static detectRole(prompts: string[]): { role: RoleType; confidence: number } {
    const patterns = {
      developer: [
        /\b(code|function|class|bug|debug|api|react|python|javascript|typescript|sql|database)\b/gi,
        /\b(implement|refactor|optimize|test|unit test|integration)\b/gi,
        /\b(algorithm|data structure|performance|error|exception)\b/gi
      ],
      'data-scientist': [
        /\b(data|dataset|analysis|model|machine learning|ai|pandas|numpy|sklearn)\b/gi,
        /\b(visualization|chart|graph|statistics|regression|classification)\b/gi,
        /\b(predict|train|feature|correlation|distribution)\b/gi
      ],
      'content-writer': [
        /\b(write|article|blog|content|copy|headline|marketing|seo)\b/gi,
        /\b(tone|style|audience|engagement|storytelling|narrative)\b/gi,
        /\b(draft|edit|proofread|publish|social media)\b/gi
      ],
      researcher: [
        /\b(research|study|analyze|investigate|literature|paper|academic)\b/gi,
        /\b(hypothesis|methodology|findings|conclusion|evidence)\b/gi,
        /\b(compare|contrast|evaluate|assess|synthesize)\b/gi
      ],
      'product-manager': [
        /\b(feature|requirements|roadmap|stakeholder|user story|epic)\b/gi,
        /\b(metrics|kpi|analytics|conversion|retention|growth)\b/gi,
        /\b(prioritize|strategy|competition|market|user experience)\b/gi
      ]
    }

    const scores: Record<RoleType, number> = {
      developer: 0,
      'data-scientist': 0,
      'content-writer': 0,
      researcher: 0,
      'product-manager': 0,
      marketer: 0,
      student: 0,
      analyst: 0,
      general: 0
    }

    const combinedPrompts = prompts.join(' ').toLowerCase()

    // Score each role based on pattern matches
    Object.entries(patterns).forEach(([role, rolePatterns]) => {
      rolePatterns.forEach(pattern => {
        const matches = combinedPrompts.match(pattern) || []
        scores[role as RoleType] += matches.length
      })
    })

    // Find the role with highest score
    const maxScore = Math.max(...Object.values(scores))
    const detectedRole = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as RoleType || 'general'
    
    // Calculate confidence based on how much higher the top score is
    const totalMatches = Object.values(scores).reduce((a, b) => a + b, 0)
    const confidence = totalMatches > 0 ? maxScore / totalMatches : 0

    return { role: detectedRole, confidence: Math.min(confidence, 1) }
  }

  static analyzePromptPatterns(prompts: string[]): PromptPattern[] {
    const patterns: Record<string, { count: number; examples: string[] }> = {}

    prompts.forEach(prompt => {
      // Extract common patterns (starting words, question types, etc.)
      const words = prompt.toLowerCase().split(/\s+/)
      const firstTwoWords = words.slice(0, 2).join(' ')
      
      if (firstTwoWords.length > 3) {
        if (!patterns[firstTwoWords]) {
          patterns[firstTwoWords] = { count: 0, examples: [] }
        }
        patterns[firstTwoWords].count++
        if (patterns[firstTwoWords].examples.length < 3) {
          patterns[firstTwoWords].examples.push(prompt.slice(0, 100))
        }
      }
    })

    return Object.entries(patterns)
      .filter(([_, data]) => data.count >= 2) // Only patterns that appear at least twice
      .map(([pattern, data]) => ({
        pattern,
        frequency: data.count,
        successRate: 0.8, // TODO: Calculate from actual run results
        averageRating: 4.0, // TODO: Calculate from ratings
        examples: data.examples
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10) // Top 10 patterns
  }
}

// Smart suggestion engine
export class SuggestionEngine {
  static generateSuggestions(profile: UserProfile, currentContext?: string): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []
    const role = profile.role.primary

    // Role-specific suggestions
    switch (role) {
      case 'developer':
        suggestions.push(
          {
            id: 'dev-debug',
            prompt: 'Debug this code and explain the issue:\n\n[paste your code here]',
            reasoning: 'Developers frequently need help debugging code issues',
            roleRelevance: 0.9,
            category: 'debugging',
            tags: ['debug', 'code', 'troubleshooting'],
            difficulty: 'intermediate',
            estimatedTokens: 150
          },
          {
            id: 'dev-optimize',
            prompt: 'Optimize this code for performance and explain the improvements:\n\n[paste your code here]',
            reasoning: 'Code optimization is a common developer task',
            roleRelevance: 0.85,
            category: 'optimization',
            tags: ['performance', 'optimization', 'refactor'],
            difficulty: 'advanced',
            estimatedTokens: 200
          },
          {
            id: 'dev-test',
            prompt: 'Write comprehensive unit tests for this function:\n\n[paste your function here]',
            reasoning: 'Testing is essential for quality code',
            roleRelevance: 0.8,
            category: 'code-generation',
            tags: ['testing', 'unit-tests', 'quality'],
            difficulty: 'intermediate',
            estimatedTokens: 180
          }
        )
        break

      case 'data-scientist':
        suggestions.push(
          {
            id: 'ds-analyze',
            prompt: 'Analyze this dataset and provide insights:\n\nDataset description: [describe your data]\nColumns: [list columns]\nGoal: [what you want to find]',
            reasoning: 'Data analysis is core to data science workflow',
            roleRelevance: 0.95,
            category: 'analysis',
            tags: ['data', 'analysis', 'insights'],
            difficulty: 'intermediate',
            estimatedTokens: 250
          },
          {
            id: 'ds-model',
            prompt: 'Suggest the best machine learning model for this problem:\n\nProblem type: [classification/regression/clustering]\nData size: [number of samples]\nFeatures: [describe features]\nTarget: [describe target variable]',
            reasoning: 'Model selection is a critical decision in ML projects',
            roleRelevance: 0.9,
            category: 'analysis',
            tags: ['machine-learning', 'model-selection', 'ml'],
            difficulty: 'advanced',
            estimatedTokens: 200
          }
        )
        break

      case 'content-writer':
        suggestions.push(
          {
            id: 'writer-headline',
            prompt: 'Write 10 compelling headlines for this topic:\n\nTopic: [your topic]\nAudience: [target audience]\nTone: [professional/casual/exciting]',
            reasoning: 'Headlines are crucial for content engagement',
            roleRelevance: 0.9,
            category: 'creative',
            tags: ['headlines', 'content', 'marketing'],
            difficulty: 'beginner',
            estimatedTokens: 120
          },
          {
            id: 'writer-structure',
            prompt: 'Create an outline for this article:\n\nTopic: [your topic]\nTarget length: [word count]\nKey points to cover: [list main points]',
            reasoning: 'Structure helps writers organize their thoughts',
            roleRelevance: 0.85,
            category: 'creative',
            tags: ['outline', 'structure', 'planning'],
            difficulty: 'beginner',
            estimatedTokens: 150
          }
        )
        break
    }

    // Add context-aware suggestions if context is provided
    if (currentContext) {
      const contextSuggestions = this.generateContextAwareSuggestions(currentContext, role)
      suggestions.push(...contextSuggestions)
    }

    // Sort by relevance to user's role
    return suggestions.sort((a, b) => b.roleRelevance - a.roleRelevance)
  }

  private static generateContextAwareSuggestions(context: string, role: RoleType): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []
    
    // Analyze context for keywords and suggest relevant prompts
    const contextLower = context.toLowerCase()
    
    if (contextLower.includes('error') || contextLower.includes('bug')) {
      suggestions.push({
        id: 'context-debug',
        prompt: `Help me debug this error:\n\nError: ${context}\n\nExpected behavior: [describe what should happen]\nActual behavior: [describe what's happening]`,
        reasoning: 'Detected error/bug context - suggesting debugging help',
        roleRelevance: role === 'developer' ? 0.95 : 0.7,
        category: 'debugging',
        tags: ['debug', 'error', 'troubleshooting'],
        difficulty: 'intermediate',
        estimatedTokens: 180
      })
    }

    return suggestions
  }
}

// Template engine for reusable prompts
export class TemplateEngine {
  static readonly templates: PromptTemplate[] = [
    {
      id: 'code-review',
      name: 'Code Review Assistant',
      template: 'Review this {{language}} code for:\n- Code quality and best practices\n- Performance optimizations\n- Security vulnerabilities\n- Readability improvements\n\nCode:\n```{{language}}\n{{code}}\n```\n\nFocus areas: {{focusAreas}}',
      variables: [
        { name: 'language', description: 'Programming language', type: 'select', required: true, options: ['JavaScript', 'Python', 'Java', 'TypeScript', 'Go', 'Rust'] },
        { name: 'code', description: 'Code to review', type: 'text', required: true },
        { name: 'focusAreas', description: 'Specific areas to focus on', type: 'text', required: false, defaultValue: 'performance, security, readability' }
      ],
      targetRoles: ['developer'],
      category: 'code-generation',
      description: 'Get comprehensive code reviews with actionable feedback',
      examples: [
        {
          title: 'React Component Review',
          variables: { language: 'JavaScript', code: 'const MyComponent = () => { ... }', focusAreas: 'performance, accessibility' },
          expectedOutput: 'Detailed code review with specific suggestions'
        }
      ]
    },
    {
      id: 'data-exploration',
      name: 'Data Exploration Guide',
      template: 'Help me explore this dataset:\n\nDataset: {{datasetName}}\nSize: {{sampleSize}} rows, {{columnCount}} columns\nBusiness goal: {{businessGoal}}\n\nKey columns:\n{{columns}}\n\nGenerate a step-by-step data exploration plan including:\n1. Initial data quality checks\n2. Descriptive statistics\n3. Visualization recommendations\n4. Potential insights to investigate',
      variables: [
        { name: 'datasetName', description: 'Name of your dataset', type: 'text', required: true },
        { name: 'sampleSize', description: 'Number of rows', type: 'number', required: true },
        { name: 'columnCount', description: 'Number of columns', type: 'number', required: true },
        { name: 'businessGoal', description: 'What you want to achieve', type: 'text', required: true },
        { name: 'columns', description: 'List key columns and their types', type: 'text', required: true }
      ],
      targetRoles: ['data-scientist', 'analyst'],
      category: 'analysis',
      description: 'Get a structured approach to exploring your data',
      examples: []
    }
  ]

  static fillTemplate(template: PromptTemplate, variables: Record<string, string>): string {
    let filledTemplate = template.template
    
    template.variables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || `[${variable.name}]`
      const placeholder = new RegExp(`{{${variable.name}}}`, 'g')
      filledTemplate = filledTemplate.replace(placeholder, value)
    })
    
    return filledTemplate
  }
}