import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TimelineData } from '../types';
import { TrendingUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface RiskTimelineProps {
  timeline: TimelineData[];
}

export const RiskTimeline: React.FC<RiskTimelineProps> = ({ timeline }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [timeRange, setTimeRange] = useState<'7' | '14'>('14');

  const displayedTimeline = timeRange === '7' ? timeline.slice(-7) : timeline;

  return (
      <div
          className={`border rounded-xl p-5 shadow-lg flex flex-col transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#1a1d2e] border-[#2a2d3e]'
          }`}
      >
        <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b ${
                isLight ? 'border-slate-200' : 'border-[#2a2d3e]'
            }`}
        >
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Risk Velocity Timeline</span>
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Daily count of cross-account suspicious fraud patterns detected
            </p>
          </div>

          {/* 7 Days / 14 Days Range Selector Toggle */}
          <div
              className={`inline-flex items-center p-0.5 rounded-lg border font-mono text-xs ${
                  isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0f1117] border-[#2a2d3e]'
              }`}
          >
            <button
                onClick={() => setTimeRange('7')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                    timeRange === '7'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : isLight
                            ? 'text-slate-600 hover:text-slate-900'
                            : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              7 Days
            </button>
            <button
                onClick={() => setTimeRange('14')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                    timeRange === '14'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : isLight
                            ? 'text-slate-600 hover:text-slate-900'
                            : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              14 Days
            </button>
          </div>
        </div>

        <div className="h-[220px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayedTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isLight ? '#cbd5e1' : '#2e334d'}
                  vertical={true}
                  opacity={0.7}
              />
              <XAxis
                  dataKey="date"
                  stroke={isLight ? '#64748b' : '#64748b'}
                  fontSize={11}
                  tickLine={true}
                  axisLine={{ stroke: isLight ? '#94a3b8' : '#3b3f58' }}
                  tickFormatter={(val) => val.slice(5)}
              />
              <YAxis
                  stroke={isLight ? '#64748b' : '#64748b'}
                  fontSize={11}
                  tickLine={true}
                  axisLine={{ stroke: isLight ? '#94a3b8' : '#3b3f58' }}
                  allowDecimals={false}
              />
              <Tooltip
                  contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#0f1117',
                    borderColor: isLight ? '#cbd5e1' : '#2a2d3e',
                    borderRadius: '8px',
                    color: isLight ? '#0f172a' : '#f1f5f9',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: any) => [`${value} Patterns Detected`, 'Volume']}
                  labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                  type="linear"
                  dataKey="pattern_count"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fill="none"
                  fillOpacity={0}
                  dot={{
                    r: 3.5,
                    fill: '#DC143C',
                    stroke: isLight ? '#ffffff' : '#1a1d2e',
                    strokeWidth: 1.5,
                  }}
                  activeDot={{
                    r: 6,
                    fill: '#DC143C',
                    stroke: isLight ? '#ffffff' : '#0f1117',
                    strokeWidth: 2,
                  }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
  );
};
