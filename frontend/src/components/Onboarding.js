import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, ArrowRight, CheckCircle, Wallet, Receipt, Zap, 
  FileText, Settings, Database, RefreshCw, Power, ChevronLeft
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Onboarding({ open, onComplete }) {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to AssetVault! 🎉",
      description: "Your complete asset management and legacy planning platform",
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-base" style={{color: theme.textSecondary}}>
            AssetVault helps you manage your entire financial life in one place:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
              <Wallet className="w-6 h-6 mb-2" style={{color: '#10b981'}} />
              <p className="text-sm font-semibold" style={{color: theme.text}}>Asset Tracking</p>
              <p className="text-xs" style={{color: theme.textTertiary}}>Stocks, crypto, real estate, gold & more</p>
            </div>
            <div className="p-3 rounded-lg" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
              <Receipt className="w-6 h-6 mb-2" style={{color: '#3b82f6'}} />
              <p className="text-sm font-semibold" style={{color: theme.text}}>Income & Expenses</p>
              <p className="text-xs" style={{color: theme.textTertiary}}>Track monthly cash flow</p>
            </div>
            <div className="p-3 rounded-lg" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
              <Zap className="w-6 h-6 mb-2" style={{color: 'var(--fuse-primary-text)'}} />
              <p className="text-sm font-semibold" style={{color: theme.text}}>Tax & Wealth</p>
              <p className="text-xs" style={{color: theme.textTertiary}}>AI-powered tax optimization</p>
            </div>
            <div className="p-3 rounded-lg" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
              <FileText className="w-6 h-6 mb-2" style={{color: '#f59e0b'}} />
              <p className="text-sm font-semibold" style={{color: theme.text}}>Digital Will</p>
              <p className="text-xs" style={{color: theme.textTertiary}}>Legacy planning</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "You're in Demo Mode 🎯",
      description: "We've pre-loaded sample data so you can explore features immediately",
      icon: Database,
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981'}}>
            <p className="text-sm font-semibold mb-2" style={{color: '#10b981'}}>
              ✅ Demo Data Loaded!
            </p>
            <p className="text-sm" style={{color: theme.textSecondary}}>
              Your account is pre-populated with sample assets, income, expenses, and documents. 
              This lets you test all features without entering real data.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold" style={{color: theme.text}}>What&apos;s included:</p>
            <ul className="space-y-1 text-sm" style={{color: theme.textTertiary}}>
              <li>• 18+ sample assets (stocks, crypto, real estate, vehicles, gold)</li>
              <li>• Income & expense tracking with 3 months of data</li>
              <li>• 5 linked documents</li>
              <li>• Digital will with beneficiaries</li>
              <li>• Scheduled messages and AI insights</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg" style={{background: theme.backgroundTertiary, border: '1px solid #3b82f6'}}>
            <p className="text-xs" style={{color: '#3b82f6'}}>
              💡 Tip: Demo mode is perfect for learning the platform before adding your real financial data.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Switching Between Demo & Live 🔄",
      description: "Easily toggle between demo and real data",
      icon: Power,
      content: (
        <div className="space-y-4">
          <p className="text-sm" style={{color: theme.textSecondary}}>
            You can switch between Demo and Live modes anytime from the top-right corner:
          </p>

          <div className="p-4 rounded-lg" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5" style={{color: '#10b981'}} />
                <span className="font-semibold" style={{color: theme.text}}>Demo Mode</span>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-bold" style={{background: '#10b981', color: 'white'}}>
                ON
              </div>
            </div>
            <p className="text-xs" style={{color: theme.textTertiary}}>
              Click the toggle in the header to switch between Demo and Live mode
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold" style={{color: theme.text}}>When to use each mode:</p>
            
            <div className="p-3 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981'}}>
              <p className="text-sm font-semibold mb-1" style={{color: '#10b981'}}>Demo Mode</p>
              <p className="text-xs" style={{color: theme.textSecondary}}>
                • Learning the platform<br/>
                • Testing features<br/>
                • Showing to family/advisor
              </p>
            </div>

            <div className="p-3 rounded-lg" style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6'}}>
              <p className="text-sm font-semibold mb-1" style={{color: '#3b82f6'}}>Live Mode</p>
              <p className="text-xs" style={{color: theme.textSecondary}}>
                • Tracking real assets<br/>
                • Managing actual finances<br/>
                • Creating your digital will
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Resetting Demo Data 🔄",
      description: "Start fresh anytime with clean demo data",
      icon: RefreshCw,
      content: (
        <div className="space-y-4">
          <p className="text-sm" style={{color: theme.textSecondary}}>
            Want to experiment without consequences? You can reset demo data anytime!
          </p>

          <div className="p-4 rounded-lg" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
            <p className="text-sm font-semibold mb-2" style={{color: theme.text}}>
              How to Reset Demo Data:
            </p>
            <ol className="space-y-2 text-sm" style={{color: theme.textSecondary}}>
              <li className="flex gap-2">
                <span className="font-bold" style={{color: 'var(--fuse-primary-text)'}}>1.</span>
                <span>Go to Settings page (sidebar)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold" style={{color: 'var(--fuse-primary-text)'}}>2.</span>
                <span>Scroll to &quot;Demo Data&quot; section</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold" style={{color: 'var(--fuse-primary-text)'}}>3.</span>
                <span>Click &quot;Reset Demo Data&quot; button</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold" style={{color: 'var(--fuse-primary-text)'}}>4.</span>
                <span>Confirm to reload fresh sample data</span>
              </li>
            </ol>
          </div>

          <div className="p-3 rounded-lg" style={{background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444'}}>
            <p className="text-xs font-semibold mb-1" style={{color: '#ef4444'}}>
              ⚠️ Important:
            </p>
            <p className="text-xs" style={{color: theme.textSecondary}}>
              Resetting only affects Demo data. Your Live data is always safe and separate.
            </p>
          </div>

          <div className="p-3 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981'}}>
            <p className="text-xs" style={{color: '#10b981'}}>
              💡 Pro Tip: Reset demo data before showing AssetVault to friends or family for a clean demo.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Key Features Tour 🚀",
      description: "Quick overview of what you can do",
      icon: Sparkles,
      content: (
        <div className="space-y-3">
          <div className="p-3 rounded-lg" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 flex-shrink-0" style={{color: '#10b981'}} />
              <div>
                <p className="text-sm font-semibold mb-1" style={{color: theme.text}}>Assets Dashboard</p>
                <p className="text-xs" style={{color: theme.textTertiary}}>
                  Track all your assets in one place. Grouped by type with real-time values and net worth calculation.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
            <div className="flex items-start gap-3">
              <Receipt className="w-5 h-5 flex-shrink-0" style={{color: '#3b82f6'}} />
              <div>
                <p className="text-sm font-semibold mb-1" style={{color: theme.text}}>Income & Expenses</p>
                <p className="text-xs" style={{color: theme.textTertiary}}>
                  Track monthly cash flow with multi-currency support. See savings rate and spending patterns.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 flex-shrink-0" style={{color: 'var(--fuse-primary-text)'}} />
              <div>
                <p className="text-sm font-semibold mb-1" style={{color: theme.text}}>Tax & Wealth Blueprint</p>
                <p className="text-xs" style={{color: theme.textTertiary}}>
                  AI-powered tax optimization. Discover hidden savings opportunities and get personalized recommendations.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 flex-shrink-0" style={{color: '#f59e0b'}} />
              <div>
                <p className="text-sm font-semibold mb-1" style={{color: theme.text}}>Digital Will & Legacy</p>
                <p className="text-xs" style={{color: theme.textTertiary}}>
                  Create your digital will, add beneficiaries, and set up Dead Man&apos;s Switch for automatic messages.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "You're All Set! 🎉",
      description: "Ready to explore AssetVault",
      icon: CheckCircle,
      content: (
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{background: 'rgba(16, 185, 129, 0.1)'}}>
            <CheckCircle className="w-12 h-12" style={{color: '#10b981'}} />
          </div>

          <div>
            <p className="text-base font-semibold mb-2" style={{color: theme.text}}>
              Your account is ready!
            </p>
            <p className="text-sm" style={{color: theme.textTertiary}}>
              Start by exploring the demo data, then switch to Live mode when you&apos;re ready to add your real assets.
            </p>
          </div>

          <div className="space-y-2 text-left">
            <p className="text-sm font-semibold" style={{color: theme.text}}>Quick Start:</p>
            <div className="space-y-2">
              <div className="p-3 rounded-lg flex items-center gap-3" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{background: 'var(--fuse-primary)', color: 'white'}}>1</span>
                <span className="text-sm" style={{color: theme.textSecondary}}>Check out the Dashboard overview</span>
              </div>
              <div className="p-3 rounded-lg flex items-center gap-3" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{background: 'var(--fuse-primary)', color: 'white'}}>2</span>
                <span className="text-sm" style={{color: theme.textSecondary}}>Browse the Assets page to see sample data</span>
              </div>
              <div className="p-3 rounded-lg flex items-center gap-3" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{background: 'var(--fuse-primary)', color: 'white'}}>3</span>
                <span className="text-sm" style={{color: theme.textSecondary}}>Try the Tax & Wealth Blueprint</span>
              </div>
              <div className="p-3 rounded-lg flex items-center gap-3" style={{background: theme.backgroundTertiary, border: '1px solid var(--fuse-border)'}}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{background: 'var(--fuse-primary)', color: 'white'}}>4</span>
                <span className="text-sm" style={{color: theme.textSecondary}}>Switch to Live mode when ready</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{background: 'rgba(21, 101, 192, 0.1)', border: '1px solid var(--fuse-primary)'}}>
            <p className="text-xs" style={{color: 'var(--fuse-primary-text)'}}>
              💜 Need help? Check Settings → Support or reach out to our team
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await axios.post(`${API}/user/complete-onboarding`, {}, { withCredentials: true });
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still close onboarding even if API call fails
      onComplete();
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        style={{
          background: theme.backgroundSecondary, 
          borderColor: theme.border, 
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs" style={{color: theme.textMuted}}>
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300" 
                style={{
                  background: 'var(--fuse-primary)',
                  width: `${((currentStep + 1) / steps.length) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{background: 'rgba(21, 101, 192, 0.1)'}}>
              <Icon className="w-8 h-8" style={{color: 'var(--fuse-primary-text)'}} />
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2" style={{color: theme.text}}>
                {currentStepData.title}
              </h2>
              <p className="text-sm" style={{color: theme.textTertiary}}>
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {currentStep > 0 && (
              <Button
                onClick={handlePrevious}
                variant="outline"
                className="flex-1"
                style={{borderColor: theme.border, color: theme.textTertiary}}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            
            {isLastStep ? (
              <Button
                onClick={handleComplete}
                className="flex-1"
                style={{background: '#10b981', color: 'white'}}
              >
                Get Started
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex-1"
                style={{background: 'var(--fuse-primary)', color: 'white'}}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Skip Option */}
          {!isLastStep && (
            <button
              onClick={handleComplete}
              className="w-full text-xs text-center py-2 transition-opacity hover:opacity-70"
              style={{color: theme.textMuted}}
            >
              Skip onboarding
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
