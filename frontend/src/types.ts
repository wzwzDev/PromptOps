export interface Log {
  id: number
  prompt: string
  response: string
  model: string
  version?: string
  temperature: number
  tokens: number
  latency_ms: number
  timestamp: string
  rating?: number
}

export interface Metrics {
  avg_latency_ms: number
  avg_tokens: number
  prompts_per_day: { date: string, count: number }[]
}

export interface LogCreate {
  prompt: string
  response: string
  model: string
  version?: string
  temperature?: number
  tokens: number
  latency_ms: number
  timestamp?: string
}

export interface RunRequest {
  provider: 'mock' | 'ollama' | 'openai'
  model: string
  prompt: string
  version?: string
  temperature?: number
}

export interface RunResponse {
  provider: string
  model: string
  version?: string
  prompt: string
  response: string
  tokens: number
  latency_ms: number
  log_id: number
}

export interface PaginatedLogs {
  items: Log[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface Board {
  id: number
  name: string
  created_at: string
}

export interface BoardItemView {
  id: number
  created_at: string
  log: Log
}
