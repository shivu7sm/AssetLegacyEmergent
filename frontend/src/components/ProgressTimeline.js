import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function ProgressTimeline({ 
  profileComplete, 
  nomineeSetup, 
  assetsRecorded, 
  dmsConfigured 
}) {
  const { theme, colorTheme } = useTheme();
  const navigate = useNavigate();

  const steps = [
    {
      id: 'profile',
      title: 'Complete Profile',
      description: 'Fill in your basic information',
      completed: profileComplete,
      action: () => navigate('/settings?tab=profile')
    },
    {
      id: 'nominee',
      title: 'Nominee Setup',
      description: 'Add nominees with order and access',
      completed: nomineeSetup,
      action: () => navigate('/settings?tab=security')
    },
    {
      id: 'assets',
      title: 'Record Assets & Liabilities',
      description: 'Add your assets and liabilities',
      completed: assetsRecorded,
      action: () => navigate('/assets')
    },
    {
      id: 'dms',
      title: 'Dead Man Switch',
      description: 'Setup reminder config and turn on',
      completed: dmsConfigured,
      action: () => navigate('/settings?tab=dms')
    },
    {
      id: 'relax',
      title: 'Sit Back and Relax',
      description: 'You\'re all set! We\'ll take care of the rest',
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
          <div className="flex items-center justify-between mb-2">
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

        {/* Timeline Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-start gap-4 p-3 rounded-lg transition-all ${
                step.action ? 'cursor-pointer hover:scale-[1.02]' : ''
              }`}
              onClick={step.action}
              style={{
                background: step.completed 
                  ? (colorTheme === 'light' ? '#10b98108' : '#10b98115')
                  : (colorTheme === 'light' ? theme.backgroundSecondary : theme.backgroundTertiary),
                border: `1px solid ${step.completed 
                  ? (colorTheme === 'light' ? '#10b98130' : '#10b98140')
                  : theme.border}`,
                opacity: step.id === 'relax' && !step.completed ? 0.5 : 1
              }}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {step.completed ? (
                  <CheckCircle2 
                    className="w-6 h-6" 
                    style={{ 
                      color: colorTheme === 'light' ? '#059669' : '#10b981'
                    }} 
                  />
                ) : (
                  <Circle 
                    className="w-6 h-6" 
                    style={{ 
                      color: colorTheme === 'light' ? '#94a3b8' : '#64748b'
                    }} 
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm" style={{ color: theme.text }}>
                    {step.title}
                  </h4>
                  {step.action && !step.completed && (
                    <ArrowRight className="w-4 h-4" style={{ color: theme.textMuted }} />
                  )}
                </div>
                <p className="text-xs" style={{ color: theme.textSecondary }}>
                  {step.description}
                </p>
              </div>

              {/* Status Badge */}
              {step.completed && step.id !== 'relax' && (
                <span className="flex-shrink-0 text-xs font-medium px-2 py-1 rounded" style={{
                  background: colorTheme === 'light' ? '#10b98120' : '#10b98130',
                  color: colorTheme === 'light' ? '#059669' : '#10b981'
                }}>
                  Done
                </span>
              )}
              
              {step.id === 'relax' && step.completed && (
                <span className="flex-shrink-0 text-xl">🎉</span>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        {completedCount < totalSteps && (
          <div className="mt-6 p-4 rounded-lg" style={{
            background: colorTheme === 'light' ? '#3b82f608' : '#3b82f615',
            border: `1px solid ${colorTheme === 'light' ? '#3b82f620' : '#3b82f630'}`
          }}>
            <p className="text-sm" style={{ color: theme.textSecondary }}>
              💡 <strong style={{ color: theme.text }}>Quick Tip:</strong> Complete all steps to ensure your assets are fully protected and your wishes are documented.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
