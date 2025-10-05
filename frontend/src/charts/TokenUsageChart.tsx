import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area } from 'recharts'
import React from 'react'
import type { Log } from '../types'

export default function TokenUsageChart({ logs }: { logs: Log[] }) {
  const data = logs.map(l => ({ date: l.timestamp, tokens: l.tokens }))
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <XAxis dataKey="date" hide />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="tokens" stroke="#38a169" fill="#68d391" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
