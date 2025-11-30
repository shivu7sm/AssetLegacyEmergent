import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, Crown, Zap, Loader2, CreditCard, Calendar, RefreshCw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PLANS = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    features: [
      'Track up to 10 assets',
      'Basic dashboard',
      'One nominee',
      'Dead man switch (90 days)',
      'Email notifications'
    ],
    color: theme.textTertiary,
    icon: Zap
  },
  {
    name: 'Pro',
    price: 9.99,
    period: 'month',
    features: [
      'Unlimited assets',
      'Advanced analytics',
      'Multiple nominees',
      'Custom DMS timing',
      'AI financial insights',
      'Document vault (5GB)',
      'Priority support'
    ],
    color: '#a855f7',
    icon: Crown,
    popular: true
  },
  {
    name: 'Family',
    price: 24.99,
    period: 'month',
    features: [
      'Everything in Pro',
      'Up to 5 family members',
      'Shared asset tracking',
      'Family financial planning',
      'Document vault (50GB)',
      'Scheduled messages',
      '24/7 support',
      'Custom integrations'
    ],
    color: '#ec4899',
    icon: Crown
  }
];

export default function Subscription() {
  const { theme } = useTheme();
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [loading, setLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  useEffect(() => {
    // Check if returning from Stripe success
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true') {
      // Verify and update subscription from Stripe
      verifyAndUpdateSubscription();
      toast.success('Payment successful! Updating your subscription...');
      // Clean up URL
      window.history.replaceState({}, document.title, '/subscription');
    } else if (canceled === 'true') {
      toast.info('Subscription canceled');
      window.history.replaceState({}, document.title, '/subscription');
    }
    
    fetchSubscription();
  }, []);

  const verifyAndUpdateSubscription = async () => {
    try {
      const response = await axios.post(
        `${API}/subscription/verify-and-update`,
        {},
        { withCredentials: true }
      );
      
      if (response.data.updated) {
        setCurrentPlan(response.data.plan);
        toast.success(`Subscription updated to ${response.data.plan} plan!`);
      }
    } catch (error) {
      console.error('Failed to verify subscription:', error);
      // Still try to fetch normally
      fetchSubscription();
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(`${API}/subscription/current`, { withCredentials: true });
      setCurrentPlan(response.data.plan || 'Free');
      setSubscriptionInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const handleSubscribe = async (planName) => {
    if (planName === currentPlan) {
      toast.info('You are already on this plan');
      return;
    }

    if (planName === 'Free') {
      handleCancelSubscription();
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/subscription/create-checkout-session`,
        { plan: planName },
        { withCredentials: true }
      );
      
      // Redirect to Stripe Checkout using the URL (new method)
      if (response.data.url) {
        window.location.href = response.data.url;
      } else if (response.data.sessionId) {
        window.location.href = `https://checkout.stripe.com/c/pay/${response.data.sessionId}`;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Subscription failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/subscription/cancel`, {}, { withCredentials: true });
      toast.success('Subscription will be canceled at period end');
      fetchSubscription();
    } catch (error) {
      console.error('Failed to cancel:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!confirm('Reactivate your subscription? Your payment method will be charged at the next billing cycle.')) {
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/subscription/reactivate`, {}, { withCredentials: true });
      toast.success('Subscription reactivated successfully!');
      fetchSubscription();
    } catch (error) {
      console.error('Failed to reactivate:', error);
      toast.error('Failed to reactivate subscription');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active':
        return <CheckCircle2 className="w-5 h-5" style={{color: '#10b981'}} />;
      case 'canceled':
        return <XCircle className="w-5 h-5" style={{color: '#ef4444'}} />;
      default:
        return <AlertCircle className="w-5 h-5" style={{color: '#f59e0b'}} />;
    }
  };

  const subDetails = subscriptionInfo?.subscription_details;
  const hasActiveSubscription = currentPlan !== 'Free' && subDetails;

  return (
    <Layout>
      <div className="space-y-8" style={{padding: '2rem 1.5rem', margin: '0 auto', maxWidth: '1600px'}}>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{fontFamily: 'Space Grotesk, sans-serif', color: theme.text}}>
            Subscription Plans
          </h1>
          <p style={{color: theme.textTertiary}}>Choose the plan that fits your needs</p>
        </div>

        {/* Current Plan Banner with Detailed Info */}
        <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#a855f7'}}>
          <CardContent className="py-6">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-sm" style={{color: theme.textTertiary}}>Current Plan</p>
                  {hasActiveSubscription && getStatusIcon(subDetails.status)}
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{color: theme.text}}>{currentPlan}</h3>
                
                {hasActiveSubscription && (
                  <div className="space-y-3 mt-4">
                    {/* Subscription Status */}
                    <div className="flex items-center gap-2 text-sm">
                      <span style={{color: theme.textTertiary}}>Status:</span>
                      <span className="px-2 py-1 rounded text-xs font-semibold" style={{
                        background: subDetails.status === 'active' ? '#10b98120' : '#ef444420',
                        color: subDetails.status === 'active' ? '#10b981' : '#ef4444'
                      }}>
                        {subDetails.status === 'active' ? 'Active' : subDetails.cancel_at_period_end ? 'Canceling' : 'Inactive'}
                      </span>
                    </div>

                    {/* Subscription Start Date */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" style={{color: theme.textTertiary}} />
                      <span style={{color: theme.textTertiary}}>Started:</span>
                      <span style={{color: theme.text}}>{formatDate(subDetails.created)}</span>
                    </div>

                    {/* Current Billing Period */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" style={{color: theme.textTertiary}} />
                      <span style={{color: theme.textTertiary}}>Current Period:</span>
                      <span style={{color: theme.text}}>
                        {formatDate(subDetails.current_period_start)} - {formatDate(subDetails.current_period_end)}
                      </span>
                    </div>

                    {/* Next Renewal Date or Cancel Date */}
                    {subDetails.cancel_at ? (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" style={{color: '#f59e0b'}} />
                        <span style={{color: theme.textTertiary}}>Scheduled to Cancel:</span>
                        <span style={{color: '#f59e0b', fontWeight: 600}}>
                          {formatDate(subDetails.cancel_at)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <RefreshCw className="w-4 h-4" style={{color: theme.textTertiary}} />
                        <span style={{color: theme.textTertiary}}>Next Renewal:</span>
                        <span style={{color: '#10b981', fontWeight: 600}}>
                          {formatDate(subDetails.current_period_end)}
                        </span>
                      </div>
                    )}

                    {/* Cancelation Notice */}
                    {(subDetails.cancel_at_period_end || subDetails.cancel_at) && (
                      <div className="flex items-center gap-2 p-3 rounded" style={{background: '#ef444410', borderLeft: '3px solid #ef4444'}}>
                        <AlertCircle className="w-5 h-5" style={{color: '#ef4444'}} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold" style={{color: '#ef4444'}}>Subscription Canceling</p>
                          <p className="text-xs" style={{color: theme.textTertiary}}>
                            Access until {formatDate(subDetails.cancel_at || subDetails.current_period_end)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Auto Renewal Status */}
                    <div className="flex items-center gap-2 text-sm">
                      <RefreshCw className="w-4 h-4" style={{color: theme.textTertiary}} />
                      <span style={{color: theme.textTertiary}}>Auto-Renewal:</span>
                      <span style={{color: subDetails.cancel_at_period_end ? '#ef4444' : '#10b981', fontWeight: 600}}>
                        {subDetails.cancel_at_period_end ? 'Disabled' : 'Enabled'}
                      </span>
                    </div>

                    {/* Payment Method */}
                    {subDetails.payment_method && (
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="w-4 h-4" style={{color: theme.textTertiary}} />
                        <span style={{color: theme.textTertiary}}>Payment Method:</span>
                        <span style={{color: theme.text}}>
                          {subDetails.payment_method.brand.toUpperCase()} •••• {subDetails.payment_method.last4}
                        </span>
                        <span className="text-xs" style={{color: theme.textMuted}}>
                          (Expires {subDetails.payment_method.exp_month}/{subDetails.payment_method.exp_year})
                        </span>
                      </div>
                    )}

                    {/* Billing Amount */}
                    <div className="flex items-center gap-2 text-sm">
                      <span style={{color: theme.textTertiary}}>Amount:</span>
                      <span className="text-lg font-bold" style={{color: '#a855f7'}}>
                        {subDetails.currency} ${subDetails.amount}/{subDetails.interval}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <Crown className="w-12 h-12" style={{color: '#a855f7'}} />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.name === currentPlan;
            
            return (
              <Card 
                key={plan.name}
                style={{
                  background: plan.popular ? 'linear-gradient(135deg, #2d1f3d 0%, #1a1229 100%)' : '#1a1229',
                  borderColor: plan.popular ? '#a855f7' : '#2d1f3d',
                  borderWidth: plan.popular ? '2px' : '1px',
                  position: 'relative'
                }}
              >
                {plan.popular && (
                  <div 
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold"
                    style={{background: 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)', color: 'white'}}
                  >
                    MOST POPULAR
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{color: theme.text}}>{plan.name}</CardTitle>
                    <Icon className="w-6 h-6" style={{color: plan.color}} />
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold" style={{color: plan.color}}>
                      ${plan.price}
                    </span>
                    <span className="text-sm" style={{color: theme.textTertiary}}>/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{color: '#10b981'}} />
                        <span style={{color: theme.textSecondary}}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleSubscribe(plan.name)}
                      disabled={loading || isCurrentPlan}
                      className="w-full text-white rounded-full"
                      style={{
                        background: isCurrentPlan 
                          ? '#64748b' 
                          : plan.popular 
                            ? 'linear-gradient(135deg, #ef4444 0%, #a855f7 100%)'
                            : plan.color
                      }}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        isCurrentPlan ? 'Current Plan' : plan.name === 'Free' ? 'Downgrade to Free' : `Upgrade to ${plan.name}`
                      )}
                    </Button>
                    
                    {isCurrentPlan && currentPlan !== 'Free' && !subDetails?.cancel_at && !subDetails?.cancel_at_period_end && (
                      <Button
                        onClick={handleCancelSubscription}
                        disabled={loading}
                        variant="outline"
                        className="w-full rounded-full"
                        style={{borderColor: '#ef4444', color: '#ef4444'}}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                    
                    {isCurrentPlan && currentPlan !== 'Free' && (subDetails?.cancel_at || subDetails?.cancel_at_period_end) && (
                      <Button
                        onClick={handleReactivateSubscription}
                        disabled={loading}
                        variant="outline"
                        className="w-full rounded-full"
                        style={{borderColor: '#10b981', color: '#10b981'}}
                      >
                        Reactivate Subscription
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Usage Stats */}
        {subscriptionInfo && (
          <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
            <CardHeader>
              <CardTitle style={{color: theme.text}}>Current Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Assets Usage */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{color: theme.textTertiary}}>Assets</span>
                    <span style={{color: theme.text, fontWeight: 600}}>
                      {subscriptionInfo.usage.assets} / {subscriptionInfo.features.max_assets > 0 ? subscriptionInfo.features.max_assets : '∞'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{background: '#16001e'}}>
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{
                        width: subscriptionInfo.features.max_assets > 0 
                          ? `${Math.min((subscriptionInfo.usage.assets / subscriptionInfo.features.max_assets) * 100, 100)}%`
                          : '50%',
                        background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                      }}
                    />
                  </div>
                </div>

                {/* Documents Usage */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{color: theme.textTertiary}}>Documents</span>
                    <span style={{color: theme.text, fontWeight: 600}}>
                      {subscriptionInfo.usage.documents} / {subscriptionInfo.features.max_documents > 0 ? subscriptionInfo.features.max_documents : '∞'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{background: '#16001e'}}>
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{
                        width: subscriptionInfo.features.max_documents > 0 
                          ? `${Math.min((subscriptionInfo.usage.documents / subscriptionInfo.features.max_documents) * 100, 100)}%`
                          : '50%',
                        background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                      }}
                    />
                  </div>
                </div>

                {/* Storage Usage */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{color: theme.textTertiary}}>Storage</span>
                    <span style={{color: theme.text, fontWeight: 600}}>
                      {subscriptionInfo.features.storage_mb >= 1024 
                        ? `${(subscriptionInfo.usage.storage_mb / 1024).toFixed(2)} GB / ${(subscriptionInfo.features.storage_mb / 1024).toFixed(0)} GB`
                        : `${subscriptionInfo.usage.storage_mb.toFixed(1)} MB / ${subscriptionInfo.features.storage_mb} MB`
                      }
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{background: '#16001e'}}>
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((subscriptionInfo.usage.storage_mb / subscriptionInfo.features.storage_mb) * 100, 100)}%`,
                        background: subscriptionInfo.usage.storage_mb / subscriptionInfo.features.storage_mb > 0.8 
                          ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                          : 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ Section */}
        <Card style={{background: theme.backgroundSecondary, borderColor: theme.border}}>
          <CardHeader>
            <CardTitle style={{color: theme.text}}>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2" style={{color: theme.text}}>Can I change my plan anytime?</h4>
                <p style={{color: theme.textTertiary}}>Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{color: theme.text}}>What payment methods do you accept?</h4>
                <p style={{color: theme.textTertiary}}>We accept all major credit cards, debit cards, and PayPal through Stripe.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{color: theme.text}}>Is there a free trial?</h4>
                <p style={{color: theme.textTertiary}}>The Free plan is available forever with no credit card required. You can upgrade anytime.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{color: theme.text}}>What happens when I cancel?</h4>
                <p style={{color: theme.textTertiary}}>You'll retain access to premium features until the end of your current billing period. After that, you'll be automatically moved to the Free plan.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{color: theme.text}}>How do I update my payment method?</h4>
                <p style={{color: theme.textTertiary}}>Payment methods are managed through Stripe's secure portal. Contact support for assistance updating your payment details.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
