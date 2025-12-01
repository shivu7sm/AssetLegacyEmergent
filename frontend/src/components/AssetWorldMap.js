import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currencyConversion';
import { Tooltip } from 'recharts';

// Using Natural Earth data which shows internationally recognized borders including India's standard map
const geoUrl = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

// Currency to country mapping
const CURRENCY_TO_COUNTRY = {
  'USD': { name: 'United States', code: 'US', coords: [-98, 39] },
  'EUR': { name: 'Germany', code: 'DE', coords: [10, 51] },
  'GBP': { name: 'United Kingdom', code: 'GB', coords: [-3, 54] },
  'JPY': { name: 'Japan', code: 'JP', coords: [138, 36] },
  'CNY': { name: 'China', code: 'CN', coords: [105, 35] },
  'AUD': { name: 'Australia', code: 'AU', coords: [133, -27] },
  'CAD': { name: 'Canada', code: 'CA', coords: [-106, 56] },
  'CHF': { name: 'Switzerland', code: 'CH', coords: [8, 47] },
  'INR': { name: 'India', code: 'IN', coords: [78, 20] },
  'SGD': { name: 'Singapore', code: 'SG', coords: [103, 1] },
  'HKD': { name: 'Hong Kong', code: 'HK', coords: [114, 22] },
  'KRW': { name: 'South Korea', code: 'KR', coords: [127, 37] },
  'BRL': { name: 'Brazil', code: 'BR', coords: [-47, -14] },
  'MXN': { name: 'Mexico', code: 'MX', coords: [-102, 23] },
  'ZAR': { name: 'South Africa', code: 'ZA', coords: [24, -30] },
  'AED': { name: 'UAE', code: 'AE', coords: [54, 24] },
  'SAR': { name: 'Saudi Arabia', code: 'SA', coords: [45, 25] },
  'SEK': { name: 'Sweden', code: 'SE', coords: [18, 60] },
  'NOK': { name: 'Norway', code: 'NO', coords: [8, 60] },
  'DKK': { name: 'Denmark', code: 'DK', coords: [9, 56] },
};

const CustomTooltip = ({ active, payload, theme }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <p style={{ color: theme.text, fontWeight: 600, marginBottom: '6px' }}>
          {data.country}
        </p>
        <div style={{ color: theme.textSecondary, fontSize: '13px' }}>
          <div style={{ marginBottom: '4px' }}>
            <strong style={{ color: theme.text }}>Assets:</strong> {data.count}
          </div>
          <div>
            <strong style={{ color: theme.text }}>Value:</strong> {data.formattedValue}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function AssetWorldMap({ assets, selectedCurrency, currencyFormat }) {
  const { theme } = useTheme();
  const [tooltipContent, setTooltipContent] = useState('');
  const [hoveredCountry, setHoveredCountry] = useState(null);

  // Aggregate assets by country
  const assetsByCountry = {};
  
  assets.forEach(asset => {
    let country = null;
    let countryName = null;
    
    // Try to get country from asset details
    if (asset.details?.country) {
      countryName = asset.details.country;
    } else if (asset.country) {
      countryName = asset.country;
    } else if (asset.purchase_currency || asset.currency) {
      // Map currency to country
      const currency = asset.purchase_currency || asset.currency;
      const mapping = CURRENCY_TO_COUNTRY[currency];
      if (mapping) {
        countryName = mapping.name;
        country = mapping.code;
      }
    }
    
    if (countryName) {
      if (!assetsByCountry[countryName]) {
        assetsByCountry[countryName] = {
          country: countryName,
          countryCode: country,
          count: 0,
          totalValue: 0,
          assets: [],
        };
      }
      
      const value = Math.abs(asset.current_value || asset.total_value || 0);
      assetsByCountry[countryName].count += 1;
      assetsByCountry[countryName].totalValue += value;
      assetsByCountry[countryName].assets.push(asset.name);
    }
  });

  // Prepare marker data
  const markers = Object.values(assetsByCountry).map(data => {
    const mapping = CURRENCY_TO_COUNTRY[
      Object.keys(CURRENCY_TO_COUNTRY).find(
        curr => CURRENCY_TO_COUNTRY[curr].name === data.country
      )
    ];
    
    return {
      ...data,
      coordinates: mapping?.coords || [0, 0],
      formattedValue: formatCurrency(data.totalValue, selectedCurrency, currencyFormat),
      // Size based on value (logarithmic scale for better visualization)
      size: Math.max(8, Math.min(30, Math.log10(data.totalValue + 1) * 4)),
    };
  });

  // Calculate max value for color intensity
  const maxValue = Math.max(...markers.map(m => m.totalValue), 1);

  return (
    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
      <ComposableMap
        projectionConfig={{
          scale: 180,
          center: [0, 20],
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <ZoomableGroup zoom={1.2}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryData = markers.find(
                  m => m.countryCode === geo.id || 
                       geo.properties.name === m.country ||
                       geo.properties.name_long === m.country
                );
                
                const isHovered = hoveredCountry === geo.rsmKey;
                const hasData = !!countryData;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={
                      hasData
                        ? `rgba(168, 85, 247, ${0.5 + (countryData.totalValue / maxValue) * 0.5})`
                        : theme.backgroundTertiary
                    }
                    stroke={hasData ? '#a855f7' : theme.border}
                    strokeWidth={hasData ? 1.5 : 0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: {
                        fill: hasData ? '#ec4899' : theme.backgroundSecondary,
                        outline: 'none',
                        cursor: hasData ? 'pointer' : 'default',
                      },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={() => {
                      setHoveredCountry(geo.rsmKey);
                      if (countryData) {
                        setTooltipContent(
                          `${countryData.country}: ${countryData.count} assets, ${countryData.formattedValue}`
                        );
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredCountry(null);
                      setTooltipContent('');
                    }}
                  />
                );
              })
            }
          </Geographies>
          
          {/* Markers for asset locations */}
          {markers.map((marker, index) => (
            <Marker key={index} coordinates={marker.coordinates}>
              <circle
                r={marker.size}
                fill="#ec4899"
                stroke="#fff"
                strokeWidth={2}
                style={{
                  cursor: 'pointer',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
                onMouseEnter={() => {
                  setTooltipContent(
                    `${marker.country}: ${marker.count} assets, ${marker.formattedValue}`
                  );
                }}
                onMouseLeave={() => {
                  setTooltipContent('');
                }}
              />
              <text
                textAnchor="middle"
                y={marker.size + 15}
                style={{
                  fontFamily: 'system-ui',
                  fontSize: '11px',
                  fontWeight: 600,
                  fill: theme.text,
                  pointerEvents: 'none',
                }}
              >
                {marker.count}
              </text>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Tooltip */}
      {tooltipContent && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '13px',
            color: theme.text,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
}
