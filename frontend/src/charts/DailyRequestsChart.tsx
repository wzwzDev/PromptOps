import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts'
import React from 'react'

export default function DailyRequestsChart({ data }: { data: { date: string, count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#3182ce" />
      </BarChart>
    </ResponsiveContainer>
  )
}
