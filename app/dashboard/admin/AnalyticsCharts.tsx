// app/dashboard/admin/AnalyticsCharts.tsx
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
  AreaChart,
  Area,
} from "recharts";

interface AnalyticsChartsProps {
  data: {
    date: string;
    appointments: number;
    registrations: number;
  }[];
}

export default function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Appointment Trends - Area Chart */}
      <div className="bg-white dark:bg-[#111C3A] p-10 rounded-[3rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Appointment Velocity</h2>
            <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest mt-1">Last 7 Days Activity</p>
          </div>
          <div className="w-3 h-3 bg-[#1E4A8A] dark:bg-[#4A8AC8] rounded-full animate-pulse" />
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAppt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E4A8A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1E4A8A" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                itemStyle={{ color: "#E8EEF8" }}
              />
              <Area 
                type="monotone" 
                dataKey="appointments" 
                stroke="#1E4A8A" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorAppt)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Registration Trends - Bar Chart */}
      <div className="bg-white dark:bg-[#111C3A] p-10 rounded-[3rem] border border-[#D0DCE8] dark:border-[#1A2A4A] shadow-sm transition-colors duration-500">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black text-[#1A2A4A] dark:text-[#E8EEF8] tracking-tight">Patient Inflow</h2>
            <p className="text-[10px] font-black text-[#5A6E8A] dark:text-[#8A9CBA] uppercase tracking-widest mt-1">New Registrations Trend</p>
          </div>
          <div className="w-3 h-3 bg-[#2D8A6E] dark:bg-[#4AA88A] rounded-full animate-pulse" />
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
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
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#111C3A", 
                  border: "none", 
                  borderRadius: "1rem",
                  color: "#FFFFFF",
                  fontSize: "12px",
                  fontWeight: "bold"
                }}
                cursor={{ fill: "rgba(30, 74, 138, 0.05)" }}
              />
              <Bar 
                dataKey="registrations" 
                fill="#2D8A6E" 
                radius={[6, 6, 0, 0]} 
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
