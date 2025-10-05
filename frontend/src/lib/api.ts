import axios from 'axios'
import type { Log, Metrics, LogCreate, RunRequest, RunResponse, PaginatedLogs, Board, BoardItemView } from '../types'

const base = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export async function fetchLogs(params?: Record<string, any>): Promise<PaginatedLogs> {
  const res = await axios.get(`${base}/api/logs`, { params })
  return res.data
}

export async function fetchMetrics(): Promise<Metrics> {
  const res = await axios.get(`${base}/api/metrics`)
  return res.data
}

export async function createLog(payload: LogCreate): Promise<Log> {
  const res = await axios.post(`${base}/api/logs`, payload)
  return res.data
}

export async function runModel(payload: RunRequest): Promise<RunResponse> {
  const res = await axios.post(`${base}/api/run`, payload)
  return res.data
}

export async function listProviderModels(provider: 'openai' | 'ollama'): Promise<string[]> {
  const res = await axios.get(`${base}/api/run/models`, { params: { provider } })
  return res.data.models || []
}

export async function purgeAll(confirm = true): Promise<{ status: string }> {
  const res = await axios.post(`${base}/api/admin/purge`, null, { params: { confirm } })
  return res.data
}

export async function createBoard(name: string): Promise<Board> {
  const res = await axios.post(`${base}/api/boards`, { name })
  return res.data
}

export async function listBoards(): Promise<Board[]> {
  const res = await axios.get(`${base}/api/boards`)
  return res.data
}

export async function addLogToBoard(boardId: number, logId: number): Promise<{ ok: boolean }> {
  const res = await axios.post(`${base}/api/boards/${boardId}/items/${logId}`)
  return res.data
}

export async function listBoardItems(boardId: number): Promise<BoardItemView[]> {
  const res = await axios.get(`${base}/api/boards/${boardId}/items`)
  return res.data
}

export async function removeBoardItem(boardId: number, itemId: number): Promise<{ ok: boolean }> {
  const res = await axios.delete(`${base}/api/boards/${boardId}/items/${itemId}`)
  return res.data
}

export async function updateLogRating(logId: number, rating: number): Promise<Log> {
  const res = await axios.patch(`${base}/api/logs/${logId}`, null, { params: { rating } })
  return res.data
}

export async function getLog(logId: number): Promise<Log> {
  const res = await axios.get(`${base}/api/logs/${logId}`)
  return res.data
}

export async function setBaseline(prompt: string, log_id: number): Promise<{ id: number; prompt: string; log_id: number }> {
  const res = await axios.post(`${base}/api/baseline`, { prompt, log_id })
  return res.data
}

export async function getBaseline(prompt: string): Promise<{ id: number; prompt: string; log_id: number } | null> {
  const res = await axios.get(`${base}/api/baseline`, { params: { prompt } })
  return res.data
}

export async function promptCoach(input: { prompt: string; provider?: 'openai'|'ollama'|'mock'; model?: string; count?: number; constraints?: string }): Promise<{ suggestions: { prompt: string; rationale: string }[] }> {
  const res = await axios.post(`${base}/api/prompt/coach`, input)
  return res.data
}
