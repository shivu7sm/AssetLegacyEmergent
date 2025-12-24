import { CheckCircle2, Circle, User, Users, Briefcase, Shield, PartyPopper, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function ProgressTimeline({ 
  profileComplete, 
  nomineeSetup, 
  assetsRecorded, 
  dmsConfigured,
  onDismiss 
}) {
  const { theme, colorTheme } = useTheme();
  const navigate = useNavigate();

  const steps = [
    {
      id: 'profile',
      title: 'Profile',
      description: 'Basic info',
      icon: User,
      completed: profileComplete,
      action: () => navigate('/settings?tab=profile')
    },
    {
      id: 'nominee',
      title: 'Nominees',
      description: 'Add beneficiaries',
      icon: Users,
      completed: nomineeSetup,
      action: () => navigate('/settings?tab=security')
    },
    {
      id: 'assets',
      title: 'Assets',
      description: 'Record holdings',
      icon: Briefcase,
      completed: assetsRecorded,
      action: () => navigate('/assets')
    },
    {
      id: 'dms',
      title: 'Protection',
      description: 'Setup DMS',
      icon: Shield,
      completed: dmsConfigured,
      action: () => navigate('/settings?tab=dms')
    }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;
  const allComplete = completedCount === totalSteps;

  return (
    <Card style={{ 
      background: colorTheme === 'light' 
        ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        : 'linear-gradient(135deg, #1a0f2e 0%, #2d1f3d 100%)', 
      borderColor: theme.border,
      borderWidth: '2px',
      position: 'relative'
    }}>
      <CardContent className="p-6">
        {/* Close Button - Only show when all complete */}
        {allComplete && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full hover:bg-opacity-20"
            style={{
              color: theme.textMuted,
              background: 'transparent'
            }}
            title="Dismiss - You can always access setup from Settings"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 pr-8">
            <h3 className="text-xl font-bold" style={{ color: theme.text }}>
              Getting Started
            </h3>
            <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{
              background: colorTheme === 'light' 
                ? progressPercentage === 100 ? '#10b98120' : '#3b82f620'
                : progressPercentage === 100 ? '#10b98130' : '#3b82f630',
              color: progressPercentage === 100 
                ? (colorTheme === 'light' ? '#059669' : '#10b981')
                : (colorTheme === 'light' ? '#2563eb' : '#3b82f6')
            }}>
              {completedCount}/{totalSteps} Complete
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: theme.backgroundTertiary }}>
            <div 
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${progressPercentage}%`,
                background: progressPercentage === 100 
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
              }}
            />
          </div>
        </div>

        {/* Individual Status Cards - No connecting lines */}
        <div className="relative">
          {/* Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((step) => {
              const StepIcon = step.icon;
              return (
                <button 
                  key={step.id}
                  onClick={step.action}
                  disabled={!step.action}
                  className="flex flex-col items-center p-4 rounded-lg transition-all text-center hover:scale-105"
                  style={{
                    background: step.completed 
                      ? (colorTheme === 'light' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)')
                      : theme.backgroundSecondary,
                    border: `2px solid ${step.completed ? '#10b981' : theme.border}`,
                    cursor: step.action ? 'pointer' : 'default'
                  }}
                >
                  {/* Icon with status */}
                  <div className="relative mb-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: step.completed 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : theme.backgroundTertiary,
                        border: `2px solid ${step.completed ? '#10b981' : theme.border}`
                      }}
                    >
                      <StepIcon 
                        className="w-6 h-6" 
                        style={{ color: step.completed ? '#ffffff' : theme.textSecondary }}
                      />
                    </div>
                    
                    {/* Checkmark badge */}
                    {step.completed && (
                      <div 
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{
                          background: '#10b981',
                          border: '2px solid #ffffff'
                        }}
                      >
                        <CheckCircle2 className="w-3 h-3" style={{ color: '#ffffff' }} />
                      </div>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h4 
                    className="font-semibold text-sm mb-1" 
                    style={{ 
                      color: step.completed 
                        ? (colorTheme === 'light' ? '#059669' : '#10b981')
                        : theme.text
                    }}
                  >
                    {step.title}
                  </h4>
                  
                  {/* Description */}
                  <p 
                    className="text-xs" 
                    style={{ color: theme.textSecondary }}
                  >
                    {step.description}
                  </p>
                  
                  {/* Status badge */}
                  <div 
                    className="mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: step.completed 
                        ? (colorTheme === 'light' ? '#10b98120' : '#10b98130')
                        : (colorTheme === 'light' ? '#ef444420' : '#ef444430'),
                      color: step.completed 
                        ? (colorTheme === 'light' ? '#059669' : '#10b981')
                        : (colorTheme === 'light' ? '#dc2626' : '#ef4444')
                    }}
                  >
                    {step.completed ? 'Done' : 'Pending'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        {completedCount < totalSteps && (
          <div className="mt-6 p-4 rounded-lg" style={{
            background: colorTheme === 'light' ? '#3b82f608' : '#3b82f615',
            border: `1px solid ${colorTheme === 'light' ? '#3b82f620' : '#3b82f630'}`
          }}>
            <p className="text-sm text-center" style={{ color: theme.textSecondary }}>
              💡 <strong style={{ color: theme.text }}>Quick Tip:</strong> Complete all steps to ensure your assets are fully protected and your wishes are documented.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
