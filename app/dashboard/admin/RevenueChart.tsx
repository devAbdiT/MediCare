"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface RevenueChartProps {
  data: {
    date: string;
    Invoiced: number;
    Collected: number;
  }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-white dark:bg-[#111C3A] p-10 rounded-[3rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500 mt-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">7-Day Revenue Trends</h2>
          <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest mt-1">Invoiced vs Collected (ETB)</p>
        </div>
        <div className="w-3 h-3 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-full animate-pulse" />
      </div>
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.1} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#8A9CBA", fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#8A9CBA", fontSize: 10, fontWeight: 700 }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#1A2A4A", 
                border: "none", 
                borderRadius: "1rem",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: "bold"
              }}
              cursor={{ fill: "rgba(30, 74, 138, 0.05)" }}
              formatter={(value: any) => [`ETB ${Number(value).toLocaleString()}`, undefined]}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#8A9CBA' }} />
            <Bar 
              dataKey="Invoiced" 
              fill="#1E4A8A" 
              radius={[4, 4, 0, 0]} 
              barSize={20}
              name="Invoiced"
            />
            <Bar 
              dataKey="Collected" 
              fill="#2D8A6E" 
              radius={[4, 4, 0, 0]} 
              barSize={20}
              name="Collected"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
