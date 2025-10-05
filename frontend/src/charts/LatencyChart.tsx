import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Line } from 'recharts'
import React from 'react'
import type { Log } from '../types'

export default function LatencyChart({ logs }: { logs: Log[] }) {
  const data = logs.map(l => ({ date: l.timestamp, latency: l.latency_ms }))
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="date" hide />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="latency" stroke="#e53e3e" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
