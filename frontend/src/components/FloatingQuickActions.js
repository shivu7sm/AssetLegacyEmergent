import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard, List, Shield, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function FloatingQuickActions() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      icon: Plus,
      label: 'Add Asset',
      onClick: () => navigate('/assets?action=add'),
      color: '#10b981',
    },
    {
      icon: CreditCard,
      label: 'Add Liability',
      onClick: () => navigate('/assets?action=add&type=liability'),
      color: '#ef4444',
    },
    {
      icon: List,
      label: 'View All',
      onClick: () => navigate('/assets'),
      color: '#3b82f6',
    },
    {
      icon: Shield,
      label: 'Security',
      onClick: () => navigate('/settings?tab=security'),
      color: '#8b5cf6',
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 999,
      }}
    >
      {/* Expanded Menu */}
      {isExpanded && (
        <div
          style={{
            position: 'absolute',
            right: '60px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsExpanded(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: theme.cardBg,
                  border: `2px solid ${theme.border}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(-4px)';
                  e.currentTarget.style.borderColor = action.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = theme.border;
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${action.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} style={{ color: action.color }} />
                </div>
                <span style={{ color: theme.text, fontWeight: 600, fontSize: '14px' }}>
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
          transition: 'all 0.3s',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(168, 85, 247, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.4)';
        }}
      >
        {isExpanded ? (
          <X size={24} style={{ color: '#fff' }} />
        ) : (
          <Plus size={24} style={{ color: '#fff' }} />
        )}
      </button>

      {/* Label */}
      {!isExpanded && (
        <div
          style={{
            position: 'absolute',
            right: '70px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: theme.cardBg,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: theme.text,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            whiteSpace: 'nowrap',
            opacity: 0,
            animation: 'fadeIn 0.3s forwards 1s',
          }}
        >
          Quick Actions
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
