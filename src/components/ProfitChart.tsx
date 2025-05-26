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

interface CustomTooltipProps extends TooltipProps<number, string> {}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const profit = payload[0].value as number;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        backgroundColor: '#1F2937',
        border: '1px solid #374151',
        borderRadius: 2,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary">
        Day: {label}
      </Typography>
      <Typography variant="h6" color="primary">
        Profit: ${profit.toFixed(2)}
      </Typography>
    </Paper>
  );
};

const ProfitChart: React.FC<ProfitChartProps> = ({ data }) => {
  // dynamic domain calculations
  const maxDay = useMemo(() => (data.length ? data[data.length - 1].day : 0), [data]);
  const maxProfitRaw = useMemo(
    () => (data.length ? Math.max(...data.map((d) => d.profit)) : 0),
    [data]
  );
  const maxProfit = Math.ceil(maxProfitRaw * 1.1 || 1);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart
        data={data}
        margin={{ top: 20, right: 30, left: 50, bottom: 40 }}  // increased left & bottom
      >
        <defs>
          <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="#374151" strokeDasharray="4 4" />

        <XAxis
          dataKey="day"
          type="number"
          domain={[0, maxDay]}
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          ticks={[0, Math.floor(maxDay * 0.25), Math.floor(maxDay * 0.5), Math.floor(maxDay * 0.75), maxDay]}
          label={{
            value: 'Days',
            position: 'bottom',
            offset: 20,
            fill: '#9CA3AF',
            fontSize: 12,
          }}
        />

        <YAxis
          type="number"
          domain={[0, maxProfit]}
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          axisLine={{ stroke: '#374151' }}
          ticks={[0, maxProfit * 0.25, maxProfit * 0.5, maxProfit * 0.75, maxProfit]}
          label={{
            angle: -90,
            value: 'Profit ($)',
            position: 'insideLeft',
            dx: -40,  // push label left
            fill: '#9CA3AF',
            fontSize: 12,
          }}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#3B82F6', strokeWidth: 2, opacity: 0.3 }}
        />

        <Area
          type="monotone"
          dataKey="profit"
          stroke="#3B82F6"
          fill="url(#profitGradient)"
          strokeWidth={2}
          dot={{ r: 3, fill: '#3B82F6' }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ProfitChart;
