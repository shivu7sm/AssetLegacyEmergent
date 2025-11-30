import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  TrendingUp, Target, Zap, CheckCircle2, Clock, ArrowRight,
  PiggyBank, TrendingDown, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TaxBlueprint() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [blueprint, setBlueprint] = useState(null);
  const [regimeComparison, setRegimeComparison] = useState(null);
  const [taxBenefits, setTaxBenefits] = useState(null);
  const [wealthStructures, setWealthStructures] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [profileForm, setProfileForm] = useState({
    employment_status: 'salaried_private',
    annual_gross_income: '',
    monthly_net_income: '',
    tax_regime: 'old',
    residential_status: 'resident',
    marital_status: 'single',
    children_count: 0,
    children_age_groups: [],
    dependent_parents: 'none',
    primary_goals: [],
    goal_time_horizon: 'long',
    risk_appetite: 'moderate',
    current_80c_investment: 0,
    existing_80c_instruments: [],
    health_insurance_self: 0,
    health_insurance_parents: 0,
    home_loan_principal: 0,
    home_loan_interest: 0,
    education_loan_interest: 0,
    donations_80g: 0,
    nps_additional: 0,
    rental_income: 0,
    capital_gains: 0,
    other_income: 0
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/tax-blueprint/profile`, { withCredentials: true });
      setProfile(response.data);
      setProfileForm(response.data);
      
      // Auto-fetch blueprint if profile exists
      fetchBlueprint();
      fetchRegimeComparison();
      fetchTaxBenefits();
      fetchWealthStructures();
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch profile:', error);
      }
    }
  };

  const fetchBlueprint = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/tax-blueprint/generate`,
        { force_refresh: forceRefresh },
        { withCredentials: true }
      );
      setBlueprint(response.data);
      toast.success('Blueprint generated successfully!');
    } catch (error) {
      console.error('Failed to generate blueprint:', error);
      if (error.response?.status === 404) {
        toast.error('Please complete your tax profile first');
        setShowProfileDialog(true);
      } else {
        toast.error('Failed to generate blueprint');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRegimeComparison = async () => {
    try {
      const response = await axios.get(`${API}/tax-blueprint/regime-comparison`, { withCredentials: true });
      setRegimeComparison(response.data);
    } catch (error) {
      console.error('Failed to fetch regime comparison:', error);
    }
  };

  const fetchTaxBenefits = async () => {
    try {
      const response = await axios.get(`${API}/tax-blueprint/tax-benefits-guide`, { withCredentials: true });
      setTaxBenefits(response.data);
    } catch (error) {
      console.error('Failed to fetch tax benefits:', error);
    }
  };

  const fetchWealthStructures = async () => {
    try {
      const response = await axios.get(`${API}/tax-blueprint/wealth-structures`, { withCredentials: true });
      setWealthStructures(response.data);
    } catch (error) {
      console.error('Failed to fetch wealth structures:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Validate required fields
      if (!profileForm.annual_gross_income || parseFloat(profileForm.annual_gross_income) <= 0) {
        toast.error('Please enter your annual gross income');
        return;
      }

      // Prepare data with proper number conversions
      const profileData = {
        ...profileForm,
        annual_gross_income: parseFloat(profileForm.annual_gross_income) || 0,
        monthly_net_income: profileForm.monthly_net_income ? parseFloat(profileForm.monthly_net_income) : null,
        children_count: parseInt(profileForm.children_count) || 0,
        current_80c_investment: parseFloat(profileForm.current_80c_investment) || 0,
        health_insurance_self: parseFloat(profileForm.health_insurance_self) || 0,
        health_insurance_parents: parseFloat(profileForm.health_insurance_parents) || 0,
        home_loan_principal: parseFloat(profileForm.home_loan_principal) || 0,
        home_loan_interest: parseFloat(profileForm.home_loan_interest) || 0,
        education_loan_interest: parseFloat(profileForm.education_loan_interest) || 0,
        donations_80g: parseFloat(profileForm.donations_80g) || 0,
        nps_additional: parseFloat(profileForm.nps_additional) || 0,
        rental_income: parseFloat(profileForm.rental_income) || 0,
        capital_gains: parseFloat(profileForm.capital_gains) || 0,
        other_income: parseFloat(profileForm.other_income) || 0
      };

      await axios.post(`${API}/tax-blueprint/profile`, profileData, { withCredentials: true });
      toast.success('Profile saved successfully!');
      setShowProfileDialog(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to save profile');
      console.error(error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getImpactColor = (impact) => {
    switch (impact.toLowerCase()) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const renderProfileDialog = () => (
    <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
      <DialogContent style={{background: '#1a1229', borderColor: '#2d1f3d', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto'}}>
        <DialogHeader>
          <DialogTitle style={{color: '#f8fafc'}}>
            Tax & Wealth Profile - Step {currentStep}/3
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress */}
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all" 
              style={{background: '#a855f7', width: `${(currentStep / 3) * 100}%`}}
            />
          </div>

          {/* Step 1: Employment & Income */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label style={{color: '#94a3b8'}}>Employment Status</Label>
                <Select value={profileForm.employment_status} onValueChange={(value) => setProfileForm({...profileForm, employment_status: value})}>
                  <SelectTrigger style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <SelectItem value="salaried_private" style={{color: '#f8fafc'}}>Salaried (Private)</SelectItem>
                    <SelectItem value="salaried_govt" style={{color: '#f8fafc'}}>Salaried (Government)</SelectItem>
                    <SelectItem value="self_employed" style={{color: '#f8fafc'}}>Self-Employed</SelectItem>
                    <SelectItem value="freelancer" style={{color: '#f8fafc'}}>Freelancer</SelectItem>
                    <SelectItem value="retired" style={{color: '#f8fafc'}}>Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Annual Gross Income (₹)</Label>
                <Input
                  type="number"
                  value={profileForm.annual_gross_income}
                  onChange={(e) => setProfileForm({...profileForm, annual_gross_income: parseFloat(e.target.value) || 0})}
                  placeholder="e.g., 1200000"
                  style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                />
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Tax Regime</Label>
                <Select value={profileForm.tax_regime} onValueChange={(value) => setProfileForm({...profileForm, tax_regime: value})}>
                  <SelectTrigger style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <SelectItem value="old" style={{color: '#f8fafc'}}>Old Regime (with deductions)</SelectItem>
                    <SelectItem value="new" style={{color: '#f8fafc'}}>New Regime (lower rates)</SelectItem>
                    <SelectItem value="undecided" style={{color: '#f8fafc'}}>Not sure - Help me decide</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Marital Status</Label>
                <Select value={profileForm.marital_status} onValueChange={(value) => setProfileForm({...profileForm, marital_status: value})}>
                  <SelectTrigger style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <SelectItem value="single" style={{color: '#f8fafc'}}>Single</SelectItem>
                    <SelectItem value="married_earning" style={{color: '#f8fafc'}}>Married (Spouse earning)</SelectItem>
                    <SelectItem value="married_non_earning" style={{color: '#f8fafc'}}>Married (Spouse non-earning)</SelectItem>
                    <SelectItem value="divorced" style={{color: '#f8fafc'}}>Divorced/Separated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Goals & Risk */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label style={{color: '#94a3b8'}}>Number of Children</Label>
                <Input
                  type="number"
                  value={profileForm.children_count}
                  onChange={(e) => setProfileForm({...profileForm, children_count: parseInt(e.target.value) || 0})}
                  style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                />
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Dependent Parents</Label>
                <Select value={profileForm.dependent_parents} onValueChange={(value) => setProfileForm({...profileForm, dependent_parents: value})}>
                  <SelectTrigger style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <SelectItem value="none" style={{color: '#f8fafc'}}>No dependent parents</SelectItem>
                    <SelectItem value="one_senior" style={{color: '#f8fafc'}}>One parent (above 60)</SelectItem>
                    <SelectItem value="two_senior" style={{color: '#f8fafc'}}>Two parents (above 60)</SelectItem>
                    <SelectItem value="disabled" style={{color: '#f8fafc'}}>Parents with disabilities</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Goal Timeline</Label>
                <Select value={profileForm.goal_time_horizon} onValueChange={(value) => setProfileForm({...profileForm, goal_time_horizon: value})}>
                  <SelectTrigger style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <SelectItem value="short" style={{color: '#f8fafc'}}>0-3 years (Short-term)</SelectItem>
                    <SelectItem value="medium" style={{color: '#f8fafc'}}>3-7 years (Medium-term)</SelectItem>
                    <SelectItem value="long" style={{color: '#f8fafc'}}>7-15 years (Long-term)</SelectItem>
                    <SelectItem value="retirement" style={{color: '#f8fafc'}}>15+ years (Retirement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Risk Appetite</Label>
                <Select value={profileForm.risk_appetite} onValueChange={(value) => setProfileForm({...profileForm, risk_appetite: value})}>
                  <SelectTrigger style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <SelectItem value="conservative" style={{color: '#f8fafc'}}>Conservative (FD, PPF only)</SelectItem>
                    <SelectItem value="moderate" style={{color: '#f8fafc'}}>Moderate (Mix of equity & debt)</SelectItem>
                    <SelectItem value="aggressive" style={{color: '#f8fafc'}}>Aggressive (High equity)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Current Investments */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label style={{color: '#94a3b8'}}>Current 80C Investments (₹/year)</Label>
                <Input
                  type="number"
                  value={profileForm.current_80c_investment}
                  onChange={(e) => setProfileForm({...profileForm, current_80c_investment: parseFloat(e.target.value) || 0})}
                  placeholder="e.g., 80000"
                  style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                />
                <p className="text-xs mt-1" style={{color: '#64748b'}}>Maximum limit: ₹1,50,000</p>
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Health Insurance - Self (₹/year)</Label>
                <Input
                  type="number"
                  value={profileForm.health_insurance_self}
                  onChange={(e) => setProfileForm({...profileForm, health_insurance_self: parseFloat(e.target.value) || 0})}
                  placeholder="e.g., 25000"
                  style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                />
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Health Insurance - Parents (₹/year)</Label>
                <Input
                  type="number"
                  value={profileForm.health_insurance_parents}
                  onChange={(e) => setProfileForm({...profileForm, health_insurance_parents: parseFloat(e.target.value) || 0})}
                  placeholder="e.g., 25000"
                  style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                />
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>Home Loan Interest (₹/year)</Label>
                <Input
                  type="number"
                  value={profileForm.home_loan_interest}
                  onChange={(e) => setProfileForm({...profileForm, home_loan_interest: parseFloat(e.target.value) || 0})}
                  placeholder="Section 24B - up to ₹2,00,000"
                  style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                />
              </div>

              <div>
                <Label style={{color: '#94a3b8'}}>NPS Additional Contribution (₹/year)</Label>
                <Input
                  type="number"
                  value={profileForm.nps_additional}
                  onChange={(e) => setProfileForm({...profileForm, nps_additional: parseFloat(e.target.value) || 0})}
                  placeholder="Section 80CCD(1B) - up to ₹50,000"
                  style={{background: '#0f0a1a', borderColor: '#2d1f3d', color: '#f8fafc'}}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <Button 
                onClick={() => setCurrentStep(currentStep - 1)}
                variant="outline"
                style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
              >
                Previous
              </Button>
            )}
            {currentStep < 3 ? (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex-1"
                style={{background: '#a855f7', color: 'white'}}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSaveProfile}
                className="flex-1"
                style={{background: '#10b981', color: 'white'}}
              >
                Save & Generate Blueprint
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{color: '#f8fafc'}}>
              ⚡ Tax & Wealth Blueprint
            </h1>
            <p className="text-sm mt-1" style={{color: '#94a3b8'}}>
              &quot;अपने सपनों को सच करें&quot; - Save Smart, Grow Wealth
            </p>
          </div>
          
          <div className="flex gap-3">
            {!profile && (
              <Button 
                onClick={() => setShowProfileDialog(true)}
                style={{background: '#a855f7', color: 'white'}}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Profile
              </Button>
            )}
            {profile && (
              <>
                <Button 
                  onClick={() => setShowProfileDialog(true)}
                  variant="outline"
                  style={{borderColor: '#2d1f3d', color: '#94a3b8'}}
                >
                  Edit Profile
                </Button>
                <Button 
                  onClick={() => fetchBlueprint(true)}
                  disabled={loading}
                  style={{background: '#10b981', color: 'white'}}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Generating...' : 'Refresh Blueprint'}
                </Button>
              </>
            )}
          </div>
        </div>

        {!profile ? (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="p-12 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4" style={{color: '#a855f7'}} />
              <h2 className="text-2xl font-bold mb-2" style={{color: '#f8fafc'}}>
                Welcome to Sankalp Planner
              </h2>
              <p className="text-base mb-6" style={{color: '#94a3b8'}}>
                Most Indians leave ₹50,000+ on the table every year. Let&apos;s find your hidden tax savings and wealth opportunities.
              </p>
              <Button 
                onClick={() => setShowProfileDialog(true)}
                size="lg"
                style={{background: '#a855f7', color: 'white'}}
              >
                Get Started - 7 Minutes Setup
              </Button>
            </CardContent>
          </Card>
        ) : !blueprint ? (
          <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
            <CardContent className="p-12 text-center">
              <Clock className="w-16 h-16 mx-auto mb-4" style={{color: '#f59e0b'}} />
              <h2 className="text-2xl font-bold mb-2" style={{color: '#f8fafc'}}>
                Generating Your Blueprint...
              </h2>
              <p className="text-base mb-6" style={{color: '#94a3b8'}}>
                Our AI is analyzing your profile and finding tax savings opportunities.
              </p>
              <Button 
                onClick={() => fetchBlueprint()}
                disabled={loading}
                style={{background: '#10b981', color: 'white'}}
              >
                {loading ? 'Please wait...' : 'Generate Now'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
              <TabsTrigger value="dashboard" style={{color: '#94a3b8'}}>Dashboard</TabsTrigger>
              <TabsTrigger value="80c-planner" style={{color: '#94a3b8'}}>80C Planner</TabsTrigger>
              <TabsTrigger value="hidden-sip" style={{color: '#94a3b8'}}>Hidden SIP</TabsTrigger>
              <TabsTrigger value="tax-benefits" style={{color: '#94a3b8'}}>📚 Tax Guide</TabsTrigger>
              <TabsTrigger value="wealth-structures" style={{color: '#94a3b8'}}>🏛️ HUF & Trust</TabsTrigger>
              {regimeComparison && (
                <TabsTrigger value="regime" style={{color: '#94a3b8'}}>Tax Regime</TabsTrigger>
              )}
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Hero Card */}
              <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#a855f7'}}>
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-2" style={{color: '#94a3b8'}}>💰 TAX SAVINGS UNLOCKED</p>
                      <h2 className="text-4xl font-bold mb-2" style={{color: '#10b981'}}>
                        {formatCurrency(blueprint.total_tax_saving_opportunity)}
                      </h2>
                      <p className="text-base" style={{color: '#cbd5e1'}}>Hidden Money You Can Save This Year</p>
                    </div>
                    <Zap className="w-20 h-20" style={{color: '#a855f7', opacity: 0.3}} />
                  </div>
                </CardContent>
              </Card>

              {/* 80C Gap Card */}
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}}>📊 80C Tax Saver Gap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2" style={{color: '#94a3b8'}}>
                        <span>{formatCurrency(blueprint.section_80c_utilized)} / {formatCurrency(150000)}</span>
                        <span>{((blueprint.section_80c_utilized / 150000) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-3">
                        <div 
                          className="h-3 rounded-full" 
                          style={{
                            background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)',
                            width: `${(blueprint.section_80c_utilized / 150000) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    
                    {blueprint.section_80c_gap > 0 && (
                      <div className="p-4 rounded-lg" style={{background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444'}}>
                        <p className="font-semibold mb-2" style={{color: '#ef4444'}}>
                          ⚠️ You're missing {formatCurrency(blueprint.section_80c_gap)} in tax deductions!
                        </p>
                        <p className="text-sm" style={{color: '#cbd5e1'}}>
                          → Save {formatCurrency(blueprint.section_80c_gap * 0.30)} in taxes by filling this gap
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="font-semibold" style={{color: '#f8fafc'}}>Top Recommendations:</p>
                      {blueprint.section_80c_recommendations.slice(0, 2).map((rec, idx) => (
                        <div key={idx} className="p-4 rounded-lg" style={{background: '#0f0a1a', border: '1px solid #2d1f3d'}}>
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-semibold" style={{color: '#10b981'}}>{rec.instrument}</p>
                            <span className="text-xs px-2 py-1 rounded" style={{background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7'}}>
                              {rec.risk_level}
                            </span>
                          </div>
                          <p className="text-sm mb-3" style={{color: '#94a3b8'}}>{rec.rationale}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p style={{color: '#64748b'}}>Monthly SIP</p>
                              <p className="font-semibold" style={{color: '#f8fafc'}}>{formatCurrency(rec.monthly_sip)}</p>
                            </div>
                            <div>
                              <p style={{color: '#64748b'}}>Tax Saved</p>
                              <p className="font-semibold" style={{color: '#10b981'}}>{formatCurrency(rec.tax_saved)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hidden SIP Opportunities */}
              {blueprint.hidden_sip_opportunities.length > 0 && (
                <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                  <CardHeader>
                    <CardTitle style={{color: '#f8fafc'}}>💸 Hidden SIP Finder</CardTitle>
                    <p className="text-sm" style={{color: '#94a3b8'}}>Convert Expenses → Wealth</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {blueprint.hidden_sip_opportunities.slice(0, 1).map((opp, idx) => (
                        <div key={idx} className="p-6 rounded-lg" style={{background: 'linear-gradient(135deg, #0f0a1a 0%, #1a1229 100%)', border: '1px solid #2d1f3d'}}>
                          <p className="text-sm mb-2" style={{color: '#64748b'}}>TOP OPPORTUNITY:</p>
                          <p className="text-xl font-bold mb-4" style={{color: '#f8fafc'}}>
                            {opp.expense_category}: {formatCurrency(opp.current_monthly_spend)}/month
                          </p>
                          
                          <p className="text-sm mb-3" style={{color: '#94a3b8'}}>
                            If you reduce by {opp.reduction_percentage.toFixed(0)}%...
                          </p>
                          
                          <div className="mb-4 p-4 rounded" style={{background: 'rgba(16, 185, 129, 0.1)'}}>
                            <p className="text-sm mb-1" style={{color: '#64748b'}}>Hidden SIP Amount</p>
                            <p className="text-2xl font-bold" style={{color: '#10b981'}}>
                              {formatCurrency(opp.hidden_sip_amount)}/month
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                              <p className="text-xs mb-1" style={{color: '#64748b'}}>In 1 year</p>
                              <p className="font-semibold" style={{color: '#f8fafc'}}>
                                {formatCurrency(opp.wealth_projection_1yr)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs mb-1" style={{color: '#64748b'}}>In 5 years</p>
                              <p className="font-semibold" style={{color: '#3b82f6'}}>
                                {formatCurrency(opp.wealth_projection_5yr)} 💎
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs mb-1" style={{color: '#64748b'}}>In 10 years</p>
                              <p className="font-semibold" style={{color: '#a855f7'}}>
                                {formatCurrency(opp.wealth_projection_10yr)} 🚀
                              </p>
                            </div>
                          </div>

                          <Button className="w-full" style={{background: '#10b981', color: 'white'}}>
                            {opp.action} <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Priority Actions */}
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}}>⚡ Quick Wins (Do These First)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {blueprint.priority_actions.map((action, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{background: '#0f0a1a', border: '1px solid #2d1f3d'}}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                            style={{background: '#a855f7', color: 'white'}}
                          >
                            {action.rank}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold mb-1" style={{color: '#f8fafc'}}>{action.action}</p>
                            <div className="flex gap-3 text-xs">
                              <span style={{color: getImpactColor(action.impact)}}>
                                <Target className="w-3 h-3 inline mr-1" />
                                {action.impact}
                              </span>
                              <span style={{color: '#64748b'}}>
                                <Clock className="w-3 h-3 inline mr-1" />
                                {action.effort}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg" style={{color: '#10b981'}}>
                            {formatCurrency(action.expected_saving)}↑
                          </p>
                          <p className="text-xs" style={{color: '#64748b'}}>{action.time_to_complete}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Summary */}
              <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#a855f7'}}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Sparkles className="w-8 h-8 flex-shrink-0" style={{color: '#a855f7'}} />
                    <div>
                      <p className="text-sm mb-2" style={{color: '#94a3b8'}}>AI Summary</p>
                      <p className="text-base leading-relaxed" style={{color: '#f8fafc'}}>
                        {blueprint.ai_summary}
                      </p>
                      <p className="text-xs mt-4" style={{color: '#64748b'}}>
                        Confidence Score: {blueprint.confidence_score}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 80C Planner Tab */}
            <TabsContent value="80c-planner">
              <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                <CardHeader>
                  <CardTitle style={{color: '#f8fafc'}}>80C Tax Saver Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {blueprint.section_80c_recommendations.map((rec, idx) => (
                      <div key={idx} className="p-6 rounded-lg" style={{background: '#0f0a1a', border: '1px solid #2d1f3d'}}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold mb-1" style={{color: '#10b981'}}>
                              {idx + 1}. {rec.instrument}
                            </h3>
                            <span className="text-xs px-2 py-1 rounded" style={{background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7'}}>
                              Risk: {rec.risk_level}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm" style={{color: '#64748b'}}>Annual Amount</p>
                            <p className="text-2xl font-bold" style={{color: '#f8fafc'}}>
                              {formatCurrency(rec.suggested_amount)}
                            </p>
                          </div>
                        </div>

                        <p className="text-base mb-4" style={{color: '#cbd5e1'}}>{rec.rationale}</p>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm" style={{color: '#64748b'}}>Monthly SIP</p>
                            <p className="font-semibold" style={{color: '#f8fafc'}}>{formatCurrency(rec.monthly_sip)}</p>
                          </div>
                          <div>
                            <p className="text-sm" style={{color: '#64748b'}}>Expected Return</p>
                            <p className="font-semibold" style={{color: '#10b981'}}>{formatCurrency(rec.expected_return)}</p>
                          </div>
                          <div>
                            <p className="text-sm" style={{color: '#64748b'}}>Tax Saved</p>
                            <p className="font-semibold" style={{color: '#10b981'}}>{formatCurrency(rec.tax_saved)}</p>
                          </div>
                        </div>

                        <div className="p-3 rounded" style={{background: 'rgba(59, 130, 246, 0.1)'}}>
                          <p className="text-sm font-semibold" style={{color: '#3b82f6'}}>
                            ✅ Action: {rec.action}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hidden SIP Tab */}
            <TabsContent value="hidden-sip">
              <div className="space-y-4">
                {blueprint.hidden_sip_opportunities.length === 0 ? (
                  <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <CardContent className="p-8 text-center">
                      <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{color: '#f59e0b'}} />
                      <h3 className="text-xl font-bold mb-2" style={{color: '#f8fafc'}}>
                        Track Your Expenses to Unlock Hidden SIPs
                      </h3>
                      <p className="text-base mb-4" style={{color: '#94a3b8'}}>
                        We need your expense data to find savings opportunities. Start tracking your monthly expenses in the Income & Expense section.
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/income-expense'}
                        style={{background: '#10b981', color: 'white'}}
                      >
                        Start Tracking Expenses
                      </Button>
                      <div className="mt-6 p-4 rounded-lg text-left" style={{background: '#0f0a1a'}}>
                        <p className="text-sm mb-2 font-semibold" style={{color: '#f8fafc'}}>
                          💡 What are Hidden SIPs?
                        </p>
                        <p className="text-sm" style={{color: '#cbd5e1'}}>
                          Hidden SIPs are savings opportunities found by analyzing your spending patterns. 
                          For example: Reducing dining out by 30% could give you ₹5,000/month to invest, 
                          which becomes ₹10 lakhs in 10 years at 12% returns!
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  blueprint.hidden_sip_opportunities.map((opp, idx) => (
                  <Card key={idx} style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <CardHeader>
                      <CardTitle style={{color: '#f8fafc'}}>{opp.expense_category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-sm mb-2" style={{color: '#64748b'}}>Current Monthly Spend</p>
                          <p className="text-2xl font-bold" style={{color: '#ef4444'}}>
                            {formatCurrency(opp.current_monthly_spend)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm mb-2" style={{color: '#64748b'}}>Hidden SIP Amount</p>
                          <p className="text-2xl font-bold" style={{color: '#10b981'}}>
                            {formatCurrency(opp.hidden_sip_amount)}
                          </p>
                          <p className="text-xs mt-1" style={{color: '#64748b'}}>
                            ({opp.reduction_percentage.toFixed(0)}% reduction)
                          </p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-sm mb-3 font-semibold" style={{color: '#f8fafc'}}>💰 Wealth Projection:</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 rounded text-center" style={{background: '#0f0a1a'}}>
                            <p className="text-xs mb-1" style={{color: '#64748b'}}>Year 1</p>
                            <p className="text-lg font-bold" style={{color: '#f8fafc'}}>
                              {formatCurrency(opp.wealth_projection_1yr)}
                            </p>
                          </div>
                          <div className="p-4 rounded text-center" style={{background: '#0f0a1a'}}>
                            <p className="text-xs mb-1" style={{color: '#64748b'}}>Year 5</p>
                            <p className="text-lg font-bold" style={{color: '#3b82f6'}}>
                              {formatCurrency(opp.wealth_projection_5yr)}
                            </p>
                          </div>
                          <div className="p-4 rounded text-center" style={{background: '#0f0a1a'}}>
                            <p className="text-xs mb-1" style={{color: '#64748b'}}>Year 10</p>
                            <p className="text-lg font-bold" style={{color: '#a855f7'}}>
                              {formatCurrency(opp.wealth_projection_10yr)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-sm mb-3 font-semibold" style={{color: '#f8fafc'}}>💡 How to Save:</p>
                        <ul className="space-y-2">
                          {opp.behavioral_tips.map((tip, tipIdx) => (
                            <li key={tipIdx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color: '#10b981'}} />
                              <span style={{color: '#cbd5e1'}}>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button className="w-full" style={{background: '#10b981', color: 'white'}}>
                        {opp.action} <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tax Regime Comparison Tab */}
            {regimeComparison && (
              <TabsContent value="regime">
                <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                  <CardHeader>
                    <CardTitle style={{color: '#f8fafc'}}>Old vs New Tax Regime Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      {/* Old Regime */}
                      <div className="p-6 rounded-lg" style={{background: '#0f0a1a', border: '2px solid ' + (regimeComparison.recommended_regime === 'old' ? '#10b981' : '#2d1f3d')}}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold" style={{color: '#f8fafc'}}>Old Regime</h3>
                          {regimeComparison.recommended_regime === 'old' && (
                            <span className="px-3 py-1 rounded text-xs font-semibold" style={{background: '#10b981', color: 'white'}}>
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm" style={{color: '#64748b'}}>Tax Before Deductions</p>
                            <p className="text-2xl font-bold" style={{color: '#f8fafc'}}>
                              {formatCurrency(regimeComparison.old_regime_tax)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm" style={{color: '#64748b'}}>Total Deductions</p>
                            <p className="text-lg font-semibold" style={{color: '#10b981'}}>
                              - {formatCurrency(regimeComparison.old_regime_deductions)}
                            </p>
                          </div>
                          <div className="pt-3 border-t" style={{borderColor: '#2d1f3d'}}>
                            <p className="text-sm" style={{color: '#64748b'}}>Final Tax</p>
                            <p className="text-2xl font-bold" style={{color: '#f8fafc'}}>
                              {formatCurrency(regimeComparison.old_regime_final_tax)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* New Regime */}
                      <div className="p-6 rounded-lg" style={{background: '#0f0a1a', border: '2px solid ' + (regimeComparison.recommended_regime === 'new' ? '#10b981' : '#2d1f3d')}}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold" style={{color: '#f8fafc'}}>New Regime</h3>
                          {regimeComparison.recommended_regime === 'new' && (
                            <span className="px-3 py-1 rounded text-xs font-semibold" style={{background: '#10b981', color: 'white'}}>
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm" style={{color: '#64748b'}}>Tax (Lower Rates)</p>
                            <p className="text-2xl font-bold" style={{color: '#f8fafc'}}>
                              {formatCurrency(regimeComparison.new_regime_tax)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm" style={{color: '#64748b'}}>Deductions</p>
                            <p className="text-lg font-semibold" style={{color: '#ef4444'}}>
                              Not Available
                            </p>
                          </div>
                          <div className="pt-3 border-t" style={{borderColor: '#2d1f3d'}}>
                            <p className="text-sm" style={{color: '#64748b'}}>Final Tax</p>
                            <p className="text-2xl font-bold" style={{color: '#f8fafc'}}>
                              {formatCurrency(regimeComparison.new_regime_final_tax)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981'}}>
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 flex-shrink-0" style={{color: '#10b981'}} />
                        <div>
                          <p className="font-semibold mb-2" style={{color: '#10b981'}}>Recommendation</p>
                          <p className="text-base" style={{color: '#f8fafc'}}>
                            {regimeComparison.rationale}
                          </p>
                          <p className="text-sm mt-2" style={{color: '#94a3b8'}}>
                            Tax Difference: {formatCurrency(regimeComparison.tax_saving_difference)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Tax Benefits Guide Tab */}
            <TabsContent value="tax-benefits">
              {taxBenefits ? (
                <div className="space-y-6">
                  {/* Header */}
                  <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#a855f7'}}>
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold mb-2" style={{color: '#f8fafc'}}>
                        📚 Complete Tax Deductions Guide
                      </h2>
                      <p className="text-base" style={{color: '#cbd5e1'}}>
                        Don&apos;t leave money on the table! Here are all deductions you can claim.
                      </p>
                      <div className="mt-4 p-4 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)'}}>
                        <p className="text-xl font-bold" style={{color: '#10b981'}}>
                          Potential Annual Savings: {taxBenefits.total_potential_saving}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Common Deductions */}
                  <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <CardHeader>
                      <CardTitle style={{color: '#f8fafc'}}>💰 Common Tax Deductions (What You Can Claim)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {taxBenefits.common_deductions.filter(d => d.applicable).map((deduction, idx) => (
                          <div key={idx} className="p-4 rounded-lg" style={{background: '#0f0a1a', border: '1px solid #2d1f3d'}}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-bold text-lg" style={{color: '#10b981'}}>
                                  {deduction.name}
                                </h3>
                                <span className="text-xs px-2 py-1 rounded mt-1 inline-block" style={{background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7'}}>
                                  Section {deduction.section}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm" style={{color: '#64748b'}}>Max Limit</p>
                                <p className="font-bold" style={{color: '#f8fafc'}}>
                                  {typeof deduction.limit === 'number' ? formatCurrency(deduction.limit) : deduction.limit}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm" style={{color: '#cbd5e1'}}>{deduction.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lesser-Known Benefits */}
                  <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <CardHeader>
                      <CardTitle style={{color: '#f8fafc'}}>💎 Lesser-Known Tax Benefits (Most People Miss These!)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {taxBenefits.lesser_known_benefits.map((benefit, idx) => (
                          <div key={idx} className="p-5 rounded-lg" style={{background: 'linear-gradient(135deg, #0f0a1a 0%, #1a1229 100%)', border: '2px solid #10b981'}}>
                            <div className="flex items-start gap-3 mb-3">
                              <Sparkles className="w-6 h-6 flex-shrink-0" style={{color: '#10b981'}} />
                              <div className="flex-1">
                                <h3 className="font-bold text-lg mb-2" style={{color: '#10b981'}}>
                                  {benefit.name}
                                </h3>
                                <p className="text-base mb-3" style={{color: '#f8fafc'}}>
                                  {benefit.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs" style={{color: '#64748b'}}>Potential Saving</p>
                                <p className="font-bold text-lg" style={{color: '#10b981'}}>
                                  {benefit.potential_saving}
                                </p>
                              </div>
                            </div>
                            <div className="p-3 rounded" style={{background: 'rgba(59, 130, 246, 0.1)'}}>
                              <p className="text-sm font-semibold mb-1" style={{color: '#3b82f6'}}>
                                How to Claim:
                              </p>
                              <p className="text-sm" style={{color: '#cbd5e1'}}>
                                {benefit.how_to_claim}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Capital Gains Account */}
                  <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <CardHeader>
                      <CardTitle style={{color: '#f8fafc'}}>🏦 {taxBenefits.capital_gains_account.name}</CardTitle>
                      <p className="text-sm mt-2" style={{color: '#94a3b8'}}>
                        {taxBenefits.capital_gains_account.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2" style={{color: '#f8fafc'}}>✅ Benefits:</h4>
                          <ul className="space-y-2">
                            {taxBenefits.capital_gains_account.benefits.map((benefit, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color: '#10b981'}} />
                                <span style={{color: '#cbd5e1'}}>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="p-4 rounded-lg" style={{background: '#0f0a1a'}}>
                          <h4 className="font-semibold mb-2" style={{color: '#f8fafc'}}>📝 How to Open:</h4>
                          <ol className="space-y-2">
                            {taxBenefits.capital_gains_account.how_to_open.map((step, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="font-bold" style={{color: '#a855f7'}}>{idx + 1}.</span>
                                <span style={{color: '#cbd5e1'}}>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="p-3 rounded" style={{background: 'rgba(168, 85, 247, 0.1)'}}>
                          <p className="text-sm font-semibold" style={{color: '#a855f7'}}>
                            🏛️ Where: {taxBenefits.capital_gains_account.where_to_open}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                  <CardContent className="p-12 text-center">
                    <p style={{color: '#94a3b8'}}>Loading tax benefits guide...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Wealth Structures Tab */}
            <TabsContent value="wealth-structures">
              {wealthStructures ? (
                <div className="space-y-6">
                  {/* Header */}
                  <Card style={{background: 'linear-gradient(135deg, #1a1229 0%, #2d1f3d 100%)', borderColor: '#a855f7'}}>
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold mb-2" style={{color: '#f8fafc'}}>
                        🏛️ Wealth Structuring: HUF & Trust
                      </h2>
                      <p className="text-base" style={{color: '#cbd5e1'}}>
                        Advanced strategies for tax optimization and asset protection
                      </p>
                    </CardContent>
                  </Card>

                  {/* HUF Section */}
                  <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <CardHeader>
                      <CardTitle style={{color: '#f8fafc'}}>{wealthStructures.huf.name}</CardTitle>
                      <p className="text-sm mt-2" style={{color: '#94a3b8'}}>
                        {wealthStructures.huf.what_is_it}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Tax Benefits */}
                        <div className="p-4 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981'}}>
                          <h4 className="font-semibold mb-2" style={{color: '#10b981'}}>💰 Tax Benefits:</h4>
                          <ul className="space-y-1">
                            {wealthStructures.huf.tax_benefits.map((benefit, idx) => (
                              <li key={idx} className="text-sm" style={{color: '#f8fafc'}}>• {benefit}</li>
                            ))}
                          </ul>
                        </div>

                        {/* How It Works */}
                        <div>
                          <h4 className="font-semibold mb-2" style={{color: '#f8fafc'}}>🔄 How It Works:</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {wealthStructures.huf.how_it_works.map((point, idx) => (
                              <div key={idx} className="p-3 rounded" style={{background: '#0f0a1a'}}>
                                <p className="text-sm" style={{color: '#cbd5e1'}}>{point}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Pros & Cons */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg" style={{background: '#0f0a1a', border: '1px solid #10b981'}}>
                            <h4 className="font-semibold mb-2" style={{color: '#10b981'}}>✅ Pros:</h4>
                            <ul className="space-y-1">
                              {wealthStructures.huf.pros.map((pro, idx) => (
                                <li key={idx} className="text-xs" style={{color: '#cbd5e1'}}>• {pro}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-4 rounded-lg" style={{background: '#0f0a1a', border: '1px solid #ef4444'}}>
                            <h4 className="font-semibold mb-2" style={{color: '#ef4444'}}>⚠️ Cons:</h4>
                            <ul className="space-y-1">
                              {wealthStructures.huf.cons.map((con, idx) => (
                                <li key={idx} className="text-xs" style={{color: '#cbd5e1'}}>• {con}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Setup Steps */}
                        <div className="p-4 rounded-lg" style={{background: '#0f0a1a'}}>
                          <h4 className="font-semibold mb-3" style={{color: '#f8fafc'}}>📝 How to Setup:</h4>
                          <ol className="space-y-2">
                            {wealthStructures.huf.how_to_setup.map((step, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="font-bold" style={{color: '#a855f7'}}>{idx + 1}.</span>
                                <span className="text-sm" style={{color: '#cbd5e1'}}>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Bottom Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded" style={{background: 'rgba(168, 85, 247, 0.1)'}}>
                            <p className="text-xs mb-1" style={{color: '#64748b'}}>Ideal For:</p>
                            <p className="text-sm font-semibold" style={{color: '#a855f7'}}>
                              {wealthStructures.huf.ideal_for}
                            </p>
                          </div>
                          <div className="p-3 rounded" style={{background: 'rgba(59, 130, 246, 0.1)'}}>
                            <p className="text-xs mb-1" style={{color: '#64748b'}}>Setup Cost:</p>
                            <p className="text-sm font-semibold" style={{color: '#3b82f6'}}>
                              {wealthStructures.huf.cost}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trust Section */}
                  <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                    <CardHeader>
                      <CardTitle style={{color: '#f8fafc'}}>{wealthStructures.trust.name}</CardTitle>
                      <p className="text-sm mt-2" style={{color: '#94a3b8'}}>
                        {wealthStructures.trust.what_is_it}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Types */}
                        <div>
                          <h4 className="font-semibold mb-2" style={{color: '#f8fafc'}}>Types of Trusts:</h4>
                          <div className="grid grid-cols-1 gap-3">
                            {wealthStructures.trust.types.map((type, idx) => (
                              <div key={idx} className="p-3 rounded-lg" style={{background: '#0f0a1a', border: '1px solid #2d1f3d'}}>
                                <h5 className="font-semibold mb-1" style={{color: '#10b981'}}>{type.name}</h5>
                                <p className="text-xs mb-1" style={{color: '#94a3b8'}}>{type.description}</p>
                                <p className="text-xs" style={{color: '#64748b'}}>Use: {type.use_case}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Benefits for Asset Tracking */}
                        <div className="p-4 rounded-lg" style={{background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6'}}>
                          <h4 className="font-semibold mb-2" style={{color: '#3b82f6'}}>📊 Benefits for Asset Tracking:</h4>
                          <ul className="space-y-1">
                            {wealthStructures.trust.benefits_for_asset_tracking.map((benefit, idx) => (
                              <li key={idx} className="text-sm" style={{color: '#f8fafc'}}>✓ {benefit}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Pros & Cons */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg" style={{background: '#0f0a1a', border: '1px solid #10b981'}}>
                            <h4 className="font-semibold mb-2" style={{color: '#10b981'}}>✅ Pros:</h4>
                            <ul className="space-y-1">
                              {wealthStructures.trust.pros.slice(0, 6).map((pro, idx) => (
                                <li key={idx} className="text-xs" style={{color: '#cbd5e1'}}>• {pro}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-4 rounded-lg" style={{background: '#0f0a1a', border: '1px solid #ef4444'}}>
                            <h4 className="font-semibold mb-2" style={{color: '#ef4444'}}>⚠️ Cons:</h4>
                            <ul className="space-y-1">
                              {wealthStructures.trust.cons.slice(0, 6).map((con, idx) => (
                                <li key={idx} className="text-xs" style={{color: '#cbd5e1'}}>• {con}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Setup Steps */}
                        <div className="p-4 rounded-lg" style={{background: '#0f0a1a'}}>
                          <h4 className="font-semibold mb-3" style={{color: '#f8fafc'}}>📝 How to Setup:</h4>
                          <ol className="space-y-2">
                            {wealthStructures.trust.how_to_setup.map((step, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="font-bold" style={{color: '#a855f7'}}>{idx + 1}.</span>
                                <span className="text-sm" style={{color: '#cbd5e1'}}>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* When to Consider */}
                        <div className="p-4 rounded-lg" style={{background: 'rgba(168, 85, 247, 0.1)'}}>
                          <h4 className="font-semibold mb-2" style={{color: '#a855f7'}}>🤔 When to Consider Trust:</h4>
                          <ul className="grid grid-cols-2 gap-2">
                            {wealthStructures.trust.when_to_consider.map((point, idx) => (
                              <li key={idx} className="text-sm" style={{color: '#f8fafc'}}>• {point}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Cost Breakdown */}
                        <div className="p-4 rounded-lg" style={{background: '#0f0a1a'}}>
                          <h4 className="font-semibold mb-2" style={{color: '#f8fafc'}}>💰 Cost Breakdown:</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(wealthStructures.trust.cost_breakdown).map(([key, value], idx) => (
                              <div key={idx} className="p-2 rounded" style={{background: '#1a1229'}}>
                                <p className="text-xs" style={{color: '#64748b'}}>
                                  {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </p>
                                <p className="text-sm font-semibold" style={{color: '#f8fafc'}}>{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comparison Card */}
                  <Card style={{background: 'linear-gradient(135deg, #0f0a1a 0%, #1a1229 100%)', borderColor: '#a855f7'}}>
                    <CardHeader>
                      <CardTitle style={{color: '#f8fafc'}}>⚖️ Quick Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-bold mb-3" style={{color: '#10b981'}}>HUF</h4>
                          {Object.entries(wealthStructures.comparison.huf).map(([key, value], idx) => (
                            <div key={idx} className="flex justify-between py-2 border-b" style={{borderColor: '#2d1f3d'}}>
                              <span className="text-sm" style={{color: '#94a3b8'}}>
                                {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}:
                              </span>
                              <span className="text-sm font-semibold" style={{color: '#f8fafc'}}>{value}</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <h4 className="font-bold mb-3" style={{color: '#3b82f6'}}>Trust</h4>
                          {Object.entries(wealthStructures.comparison.trust).map(([key, value], idx) => (
                            <div key={idx} className="flex justify-between py-2 border-b" style={{borderColor: '#2d1f3d'}}>
                              <span className="text-sm" style={{color: '#94a3b8'}}>
                                {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}:
                              </span>
                              <span className="text-sm font-semibold" style={{color: '#f8fafc'}}>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 p-3 rounded" style={{background: 'rgba(168, 85, 247, 0.1)'}}>
                        <p className="text-sm font-semibold" style={{color: '#a855f7'}}>
                          💡 Recommendation: {wealthStructures.recommendation}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card style={{background: '#1a1229', borderColor: '#2d1f3d'}}>
                  <CardContent className="p-12 text-center">
                    <p style={{color: '#94a3b8'}}>Loading wealth structures guide...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {renderProfileDialog()}
    </Layout>
  );
}
