// src/components/ProfitChart.tsx
import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Paper, Typography } from '@mui/material';

interface DataPoint {
  day: number;
  profit: number;
}

interface ProfitChartProps {
  data: DataPoint[];
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const profit = (payload[0].value ?? 0) as number;

  return (
    <Paper>
      <Typography variant="subtitle2" color="text.secondary">
        Day: {label}
      </Typography>
      <Typography variant="h6" color="text.primary">
        Profit: ${profit.toFixed(2)}
      </Typography>
    </Paper>
  );
};

const ProfitChart: React.FC<ProfitChartProps> = ({ data }) => {
  // dynamic domain calculations
  const maxDay = useMemo(
    () => (data.length ? data[data.length - 1].day : 0),
    [data]
  );
  const maxProfitRaw = useMemo(
    () => (data.length ? Math.max(...data.map(d => d.profit)) : 0),
    [data]
  );
  const maxProfit = Math.ceil(maxProfitRaw);

  // ← compute minimum too
  const minProfitRaw = useMemo(
    () => (data.length ? Math.min(...data.map(d => d.profit)) : 0),
    [data]
  );
  const minProfit = Math.floor(minProfitRaw);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart
        data={data}
        margin={{ top: 0, right: 0, left: 0, bottom: 10 }}
      >
        <defs>
          <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2B66F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2B66F6" stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis
          dataKey="day"
          type="number"
          domain={[0, maxDay]}
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          axisLine={{ stroke: '#9CA3AF' }}
          ticks={[
            0,
            Math.floor(maxDay * 0.25),
            Math.floor(maxDay * 0.5),
            Math.floor(maxDay * 0.75),
            maxDay,
          ]}
          label={{
            value: 'Days',
            position: 'bottom',
            offset: 0,
            fill: '#FFFFFF',
            fontSize: 12,
          }}
        />

        {/* ← set YAxis from minProfit up to maxProfit so negatives show */}
        <YAxis
          type="number"
          domain={[minProfit, maxProfit]}
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          axisLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#2B66F6', strokeWidth: 2, opacity: 0.3 }}
        />

        <CartesianGrid stroke="#333" strokeDasharray="3 3" />

        <Area
          type="monotone"
          dataKey="profit"
          stroke="#2B66F6"
          fill="url(#profitGradient)"
          strokeWidth={4}
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ProfitChart;
