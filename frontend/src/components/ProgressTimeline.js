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
    },
    {
      id: 'relax',
      title: 'All Set!',
      description: 'Relax now',
      icon: PartyPopper,
      completed: profileComplete && nomineeSetup && assetsRecorded && dmsConfigured,
      action: null
    }
  ];

  const completedCount = steps.filter(s => s.completed && s.id !== 'relax').length;
  const totalSteps = steps.length - 1; // Exclude 'relax' from count
  const progressPercentage = (completedCount / totalSteps) * 100;

  return (
    <Card style={{ 
      background: colorTheme === 'light' 
        ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
        : 'linear-gradient(135deg, #1a0f2e 0%, #2d1f3d 100%)', 
      borderColor: theme.border,
      borderWidth: '2px'
    }}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
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

        {/* Horizontal Timeline Steps */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 hidden md:block" 
            style={{ 
              background: theme.backgroundTertiary,
              zIndex: 0
            }}
          />
          
          {/* Progress Line */}
          <div 
            className="absolute top-6 left-0 h-0.5 hidden md:block transition-all duration-500" 
            style={{ 
              width: `${(completedCount / totalSteps) * 100}%`,
              background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
              zIndex: 1
            }}
          />

          {/* Steps */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center text-center ${
                    step.action ? 'cursor-pointer' : ''
                  }`}
                  onClick={step.action}
                >
                  {/* Icon Circle */}
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all ${
                      step.action ? 'hover:scale-110' : ''
                    }`}
                    style={{
                      background: step.completed
                        ? (colorTheme === 'light' 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)')
                        : (colorTheme === 'light' ? theme.backgroundTertiary : theme.backgroundSecondary),
                      border: `2px solid ${step.completed 
                        ? (colorTheme === 'light' ? '#059669' : '#10b981')
                        : theme.border}`,
                      boxShadow: step.completed 
                        ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                        : 'none',
                      opacity: step.id === 'relax' && !step.completed ? 0.5 : 1
                    }}
                  >
                    {step.completed ? (
                      <CheckCircle2 
                        className="w-6 h-6" 
                        style={{ color: '#ffffff' }}
                      />
                    ) : (
                      <StepIcon 
                        className="w-5 h-5" 
                        style={{ 
                          color: colorTheme === 'light' ? '#64748b' : '#94a3b8'
                        }}
                      />
                    )}
                  </div>

                  {/* Title */}
                  <h4 
                    className="font-semibold text-sm mb-1" 
                    style={{ 
                      color: step.completed ? theme.text : theme.textSecondary 
                    }}
                  >
                    {step.title}
                  </h4>
                  
                  {/* Description */}
                  <p 
                    className="text-xs" 
                    style={{ color: theme.textMuted }}
                  >
                    {step.description}
                  </p>

                  {/* Status Badge */}
                  {step.completed && (
                    <span 
                      className="mt-2 text-xs font-medium px-2 py-0.5 rounded-full" 
                      style={{
                        background: colorTheme === 'light' ? '#10b98115' : '#10b98125',
                        color: colorTheme === 'light' ? '#059669' : '#10b981'
                      }}
                    >
                      {step.id === 'relax' ? '🎉' : '✓ Done'}
                    </span>
                  )}
                </div>
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
