import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currencyConversion';

const CustomizedContent = (props) => {
  const { depth, x, y, width, height, index, name, value, percentage, color, colors, selectedCurrency, currencyFormat } = props;
  const { theme } = useTheme();
  
  // Only render depth 1 (actual items, not root)
  if (depth !== 1) return null;
  
  // Don't render tiny rectangles
  if (!width || !height || width < 5 || height < 5) return null;

  const fontSize = width > 100 && height > 50 ? '13px' : width > 60 ? '11px' : '9px';
  const showValue = width > 120 && height > 60;
  const showPercentage = width > 70 && height > 40;
  const showName = width > 45 && height > 30;

  // Use the color from data or fallback
  const fillColor = color || (colors && colors[index % colors.length]) || '#3b82f6';

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fillColor,
          stroke: theme?.background || '#fff',
          strokeWidth: 3,
          strokeOpacity: 1,
        }}
      />
      {showName && name && (
        <g>
          <text
            x={x + width / 2}
            y={y + height / 2 - (showValue ? 12 : showPercentage ? 6 : 0)}
            textAnchor="middle"
            fill="#fff"
            fontSize={fontSize}
            fontWeight="700"
          >
            {name}
          </text>
          {showPercentage && percentage && (
            <text
              x={x + width / 2}
              y={y + height / 2 + (showValue ? 5 : 10)}
              textAnchor="middle"
              fill="#fff"
              fontSize="12px"
              fontWeight="600"
              opacity={0.95}
            >
              {percentage}%
            </text>
          )}
          {showValue && value && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 22}
              textAnchor="middle"
              fill="#fff"
              fontSize="11px"
              opacity={0.85}
            >
              {formatCurrency(value, selectedCurrency, currencyFormat)}
            </text>
          )}
        </g>
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

  // Ensure data has all required fields and colors
  const treemapData = data.map((item, index) => ({
    name: item.name || 'Unknown',
    value: item.value || 0,
    percentage: item.percentage || 0,
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

  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center" style={{ color: theme.textTertiary }}>
        <p>No asset data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        data={treemapData}
        dataKey="value"
        aspectRatio={4 / 3}
        stroke={theme?.background || '#fff'}
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
