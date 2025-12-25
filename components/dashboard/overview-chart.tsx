'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function OverviewChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis 
          dataKey="day" 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => format(new Date(value), "dd MMM", { locale: fr })}
        />
        <YAxis 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip 
            contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px' }}
            labelFormatter={(value) => format(new Date(value), "d MMMM yyyy", { locale: fr })}
        />
        <Bar dataKey="total_count" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}