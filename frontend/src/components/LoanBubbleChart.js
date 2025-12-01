import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currencyConversion';
import { Button } from '@/components/ui/button';

const CustomTooltip = ({ active, payload, selectedCurrency, currencyFormat, metric }) => {
  const { theme } = useTheme();
  
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <p style={{ color: theme.text, fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
          {data.name}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span style={{ color: theme.textSecondary, fontSize: '13px' }}>Amount:</span>
            <span style={{ color: theme.text, fontWeight: 600, fontSize: '13px' }}>
              {formatCurrency(data.amount, selectedCurrency, currencyFormat)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span style={{ color: theme.textSecondary, fontSize: '13px' }}>Interest Rate:</span>
            <span style={{ color: theme.warning, fontWeight: 600, fontSize: '13px' }}>
              {data.rate}%
            </span>
          </div>
          {data.term && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ color: theme.textSecondary, fontSize: '13px' }}>Term:</span>
              <span style={{ color: theme.text, fontSize: '13px' }}>
                {data.term}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ cx, cy, payload, theme }) => {
  if (!payload || !payload.name) return null;
  
  return (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      fill="#fff"
      fontSize="11px"
      fontWeight="600"
    >
      {payload.name}
    </text>
  );
};

export default function LoanBubbleChart({ data, selectedCurrency, currencyFormat }) {
  const { theme } = useTheme();
  const [metric, setMetric] = useState('amount'); // 'amount' or 'rate'

  const COLORS = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#eab308', // Yellow
    '#84cc16', // Lime
    '#22c55e', // Green
    '#10b981', // Emerald
    '#14b8a6', // Teal
    '#06b6d4', // Cyan
    '#0ea5e9', // Sky
  ];

  // Transform data for bubble chart
  const bubbleData = data.map((item, index) => {
    const amount = item.value || item.amount || 0;
    const rate = item.rate || item.interest_rate || 5; // Default rate if not provided
    
    return {
      name: item.name,
      amount: amount,
      rate: rate,
      // x-axis: index position (for spreading bubbles)
      x: index + 1,
      // y-axis: CHANGES based on metric
      // If "by amount" -> y-axis shows rate
      // If "by rate" -> y-axis shows amount
      y: metric === 'amount' ? rate : amount,
      // z-axis (bubble size): either amount or rate based on metric
      z: metric === 'amount' ? amount : rate * 10000, // Multiply rate for better visibility
      color: item.color || COLORS[index % COLORS.length],
      term: item.term || null,
    };
  });

  // Calculate domain for bubble sizes
  const maxZ = Math.max(...bubbleData.map(d => d.z));
  const minZ = Math.min(...bubbleData.map(d => d.z));

  if (bubbleData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center" style={{ color: theme.textTertiary }}>
        <p>No loan data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metric Toggle */}
      <div className="flex justify-center gap-2 p-2 rounded-lg" style={{ background: theme.backgroundTertiary }}>
        <Button
          onClick={() => setMetric('amount')}
          size="sm"
          variant="ghost"
          style={{
            background: metric === 'amount' ? 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)' : 'transparent',
            color: metric === 'amount' ? '#fff' : theme.textMuted,
            padding: '8px 16px',
          }}
        >
          <span className="text-xs font-semibold">By Loan Amount</span>
        </Button>
        <Button
          onClick={() => setMetric('rate')}
          size="sm"
          variant="ghost"
          style={{
            background: metric === 'rate' ? 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)' : 'transparent',
            color: metric === 'rate' ? '#fff' : theme.textMuted,
            padding: '8px 16px',
          }}
        >
          <span className="text-xs font-semibold">By Interest Rate</span>
        </Button>
      </div>

      {/* Bubble Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis
            type="number"
            dataKey="x"
            hide={true}
            domain={[0, bubbleData.length + 1]}
          />
          <YAxis
            type="number"
            dataKey="y"
            stroke={theme.textSecondary}
            label={{
              value: metric === 'amount' ? 'Interest Rate (%)' : 'Loan Amount',
              angle: -90,
              position: 'insideLeft',
              style: { fill: theme.textSecondary, fontSize: '12px' }
            }}
            domain={[0, 'auto']}
            tickFormatter={metric === 'rate' ? (value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value;
            } : undefined}
          />
          <ZAxis
            type="number"
            dataKey="z"
            range={[400, 4000]}
            domain={[minZ, maxZ]}
          />
          <Tooltip
            content={
              <CustomTooltip
                selectedCurrency={selectedCurrency}
                currencyFormat={currencyFormat}
                metric={metric}
              />
            }
            cursor={{ strokeDasharray: '3 3', stroke: theme.border }}
          />
          <Scatter data={bubbleData} fill="#8884d8">
            {bubbleData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="text-center text-xs" style={{ color: theme.textTertiary }}>
        <p className="mb-2" style={{ color: theme.textSecondary, fontWeight: 600 }}>
          Bubble Size: {metric === 'amount' ? 'Loan Amount' : 'Interest Rate'}
        </p>
        <p>Y-axis shows interest rates • Hover over bubbles for details</p>
      </div>
    </div>
  );
}
