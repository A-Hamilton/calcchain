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
      elevation={1}
      sx={{
        p: 1,
        borderRadius: 2,
      }}
    >
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
  const maxDay = useMemo(() => (data.length ? data[data.length - 1].day : 0), [data]);
  const maxProfitRaw = useMemo(
    () => (data.length ? Math.max(...data.map((d) => d.profit)) : 0),
    [data]
  );
  const maxProfit = Math.ceil(maxProfitRaw);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart
        data={data}
        margin={{ top: 0, right: 0, left: 0, bottom: 10 }}  // increased left & bottom
      >
        <defs>
          <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2B66F6" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#2B66F6" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="#374151" strokeOpacity={0.1} />

        <XAxis
          dataKey="day"
          type="number"
          domain={[0, maxDay]}
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          axisLine={{ stroke: '#9CA3AF' }}
          ticks={[0, Math.floor(maxDay * 0.25), Math.floor(maxDay * 0.5), Math.floor(maxDay * 0.75), maxDay]}
          label={{
            value: 'Days',
            position: 'bottom',
            offset: 0,
            fill: '#FFFFFF',
            fontSize: 12,
          }}
        />

        <YAxis
          type="number"
          domain={[0, maxProfit]}
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          axisLine={{ stroke: '#9CA3AF', strokeWidth: 1}}
          // ticks= {[0, maxProfit * 0.25, maxProfit * 0.5, maxProfit, maxProfit]}
          ticks= {[0, -10, -20, maxProfit]}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: '#2B66F6', strokeWidth: 2, opacity: 0.3 }}
        />

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
