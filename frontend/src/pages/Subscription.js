import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, Crown, Zap } from 'lucide-react';

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
    color: '#94a3b8',
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
  const [currentPlan, setCurrentPlan] = useState('Free');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(`${API}/subscription/current`, { withCredentials: true });
      setCurrentPlan(response.data.plan || 'Free');
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
      
      // Redirect to Stripe checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('Subscription failed. Please try again.');
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

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{fontFamily: 'Space Grotesk, sans-serif', color: '#f8fafc'}}>
            Subscription Plans
          </h1>
          <p style={{color: '#94a3b8'}}>Choose the plan that fits your needs</p>
        </div>

        {/* Current Plan Banner */}
        <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#a855f7'}}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{color: '#94a3b8'}}>Current Plan</p>
                <h3 className="text-2xl font-bold" style={{color: '#f8fafc'}}>{currentPlan}</h3>
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
                    <CardTitle style={{color: '#f8fafc'}}>{plan.name}</CardTitle>
                    <Icon className="w-6 h-6" style={{color: plan.color}} />
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold" style={{color: plan.color}}>
                      ${plan.price}
                    </span>
                    <span className="text-sm" style={{color: '#94a3b8'}}>/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{color: '#10b981'}} />
                        <span style={{color: '#cbd5e1'}}>{feature}</span>
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
                      {isCurrentPlan ? 'Current Plan' : plan.name === 'Free' ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
                    </Button>
                    
                    {isCurrentPlan && currentPlan !== 'Free' && (
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
          <CardHeader>
            <CardTitle style={{color: '#f8fafc'}}>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2" style={{color: '#f8fafc'}}>Can I change my plan anytime?</h4>
                <p style={{color: '#94a3b8'}}>Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{color: '#f8fafc'}}>What payment methods do you accept?</h4>
                <p style={{color: '#94a3b8'}}>We accept all major credit cards, debit cards, and PayPal.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2" style={{color: '#f8fafc'}}>Is there a free trial?</h4>
                <p style={{color: '#94a3b8'}}>The Free plan is available forever with no credit card required. You can upgrade anytime.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
