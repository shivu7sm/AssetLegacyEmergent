import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currencyConversion';

const CustomizedContent = (props) => {
  const { root, depth, x, y, width, height, index, payload, colors, selectedCurrency, currencyFormat } = props;
  const { theme } = useTheme();
  
  // Safety checks
  if (!payload || depth !== 1) return null;
  if (!width || !height || width < 10 || height < 10) return null;

  const fontSize = width > 100 && height > 50 ? '14px' : width > 60 && height > 35 ? '12px' : '10px';
  const showValue = width > 100 && height > 50;
  const showPercentage = width > 60 && height > 35;
  const showName = width > 40 && height > 25;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: payload.color || colors[index % colors.length],
          stroke: theme.background || '#0f172a',
          strokeWidth: 2,
          strokeOpacity: 1,
        }}
      />
      {showName && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - (showValue ? 12 : showPercentage ? 5 : 0)}
            textAnchor="middle"
            fill="#fff"
            fontSize={fontSize}
            fontWeight="600"
          >
            {payload.name}
          </text>
          {showPercentage && (
            <text
              x={x + width / 2}
              y={y + height / 2 + (showValue ? 4 : 8)}
              textAnchor="middle"
              fill="#fff"
              fontSize="11px"
              opacity={0.9}
            >
              {payload.percentage}%
            </text>
          )}
          {showValue && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 20}
              textAnchor="middle"
              fill="#fff"
              fontSize="10px"
              opacity={0.8}
            >
              {formatCurrency(payload.value, selectedCurrency, currencyFormat)}
            </text>
          )}
        </>
      )}
    </g>
  );
};

const CustomTooltip = ({ active, payload, selectedCurrency, currencyFormat }) => {
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
        <p style={{ color: theme.text, fontWeight: 600, marginBottom: '4px' }}>
          {data.name}
        </p>
        <p style={{ color: theme.textSecondary, fontSize: '14px' }}>
          Value: <span style={{ color: theme.text, fontWeight: 600 }}>
            {formatCurrency(data.value, selectedCurrency, currencyFormat)}
          </span>
        </p>
        <p style={{ color: theme.textSecondary, fontSize: '14px' }}>
          Share: <span style={{ color: data.color, fontWeight: 600 }}>
            {data.percentage}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function AssetTreeMap({ data, selectedCurrency, currencyFormat }) {
  const { theme } = useTheme();

  const COLORS = [
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Orange
    '#10b981', // Green
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#f97316', // Deep Orange
    '#84cc16', // Lime
    '#6366f1', // Indigo
  ];

  // Transform data for treemap - add colors to each item
  const treemapData = data.map((item, index) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length],
  }));

  const renderContent = (props) => {
    return (
      <CustomizedContent
        {...props}
        colors={COLORS}
        selectedCurrency={selectedCurrency}
        currencyFormat={currencyFormat}
      />
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        data={treemapData}
        dataKey="value"
        aspectRatio={4 / 3}
        stroke={theme.background}
        fill="#8884d8"
        content={renderContent}
      >
        <Tooltip
          content={
            <CustomTooltip
              selectedCurrency={selectedCurrency}
              currencyFormat={currencyFormat}
            />
          }
        />
      </Treemap>
    </ResponsiveContainer>
  );
}
