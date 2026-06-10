import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getActivePlanName, getActivePlanLimits, getCurrentUsage, PLAN_LIMITS } from '@/utils/limits';
import { SystemPageLayout, PageHeader, PageContent } from '@/components/layout/SystemPageLayout';
import { 
  CreditCard, 
  Check, 
  Zap, 
  ShieldCheck, 
  History,
  Download,
  AlertCircle,
  User,
  Building,
  Key,
  Users,
  Lock,
  Shield,
  Fingerprint,
  SlidersHorizontal,
  FileSpreadsheet,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Wallet,
  Settings,
  HelpCircle,
  TrendingUp,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: string;
  credits: string;
  features: string[];
  popular?: boolean;
}

const DEFAULT_PLANS: Plan[] = [
  { id: 'p-free', name: 'Free', price: '$0', credits: '500', features: ['Basic CRM Profiles', 'Public Booking Calendar', 'Self-Bookings', 'Email Alerts'] },
  { id: 'p-starter', name: 'Starter', price: '$49', credits: '5,000', features: ['AI Content Suite', 'SEO Scanner', '1 Premium Team Space', 'Priority Support'] },
  { id: 'p-growth', name: 'Growth', price: '$149', credits: '15,000', features: ['Bulk Automation Outbox', 'SMS Notification Flows', 'Custom Workspaces', 'Multi-tenant Calendar'], popular: true },
  { id: 'p-agency', name: 'Agency', price: '$399', credits: 'Unlimited*', features: ['White-label Booking Slugs', 'Custom Domains', 'Unlimited Client Portals', 'Dedicated Success Strategist'] },
];

export function Billing() {
  const navigate = useNavigate();

  // --- Roles Trigger ---
  const [currentUserRole, setCurrentUserRole] = useState<'SUPER_ADMIN' | 'ADMIN'>(() => {
    return (localStorage.getItem('settings_current_user_role') as 'SUPER_ADMIN' | 'ADMIN') || 'SUPER_ADMIN';
  });

  const handleRoleToggle = (role: 'SUPER_ADMIN' | 'ADMIN') => {
    setCurrentUserRole(role);
    localStorage.setItem('settings_current_user_role', role);
    toast.success(`Switched active view session to ${role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'} permissions.`);
  };

  // --- STATE FOR PLANS (LOADS/SAVES TO LOCALSTORAGE FOR COHESIVE SIMULATION) ---
  const [plans, setPlans] = useState<Plan[]>([]);
  
  useEffect(() => {
    const stored = localStorage.getItem('crm_billing_plans');
    if (stored) {
      try {
        setPlans(JSON.parse(stored));
      } catch (e) {
        setPlans(DEFAULT_PLANS);
      }
    } else {
      setPlans(DEFAULT_PLANS);
      localStorage.setItem('crm_billing_plans', JSON.stringify(DEFAULT_PLANS));
    }
  }, []);

  const savePlans = (updated: Plan[]) => {
    setPlans(updated);
    localStorage.setItem('crm_billing_plans', JSON.stringify(updated));
  };

  // --- STATE FOR PLAN EDITING DIALOG / FORMS ---
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '$99',
    credits: '10,000',
    featuresRaw: '',
    popular: false
  });

  // --- TRANS ACTION HISTORY STATE & ADD PAYMENT ---
  const [transactions, setTransactions] = useState([
    { id: 'INV-4210', date: 'May 1, 2026', status: 'Paid', method: 'PayPal', plan: 'Growth', amount: '$149.00' },
    { id: 'INV-4185', date: 'Apr 1, 2026', status: 'Paid', method: 'Visa ending 4242', plan: 'Growth', amount: '$149.00' },
    { id: 'INV-4152', date: 'Mar 1, 2026', status: 'Paid', method: 'Visa ending 4242', plan: 'Starter', amount: '$49.00' },
  ]);

  // --- PLAN CHECKOUT MODAL WIDGETS ---
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<Plan | null>(null);
  const [checkoutGateway, setCheckoutGateway] = useState<'paypal' | 'stripe'>('paypal');
  const [paypalEmail, setPaypalEmail] = useState('preetkalirona@gmail.com');
  const [stripeEmail, setStripeEmail] = useState('preetkalirona@gmail.com');
  const [cardHolder, setCardHolder] = useState('Preet Kalirona');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [checkoutProgress, setCheckoutProgress] = useState(false);

  // --- RESOURCE USAGE LIMITS MONITOR ---
  const [activePlan, setActivePlan] = useState(() => getActivePlanName());
  const [currentUsage, setCurrentUsage] = useState(() => getCurrentUsage());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUsage(getCurrentUsage());
      setActivePlan(getActivePlanName());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- SUPER ADMIN CRUD ROUTINES ---
  const handleAddNewPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name.trim()) return;

    if (currentUserRole !== 'SUPER_ADMIN') {
      toast.error('Forbidden', { description: 'Only Super Admins can manage core subscription plan structures.' });
      return;
    }

    const newPlan: Plan = {
      id: `p-${Date.now()}`,
      name: planForm.name,
      price: planForm.price.startsWith('$') ? planForm.price : `$${planForm.price}`,
      credits: planForm.credits,
      features: planForm.featuresRaw.split('\n').filter(f => f.trim()),
      popular: planForm.popular
    };

    const updated = [...plans, newPlan];
    savePlans(updated);
    toast.success(`Pricing Plan "${newPlan.name}" Registered Successfully!`);
    
    // reset form
    setPlanForm({ name: '', price: '$99', credits: '10,000', featuresRaw: '', popular: false });
    setShowAddForm(false);
  };

  const handleUpdatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    if (currentUserRole !== 'SUPER_ADMIN') {
      toast.error('Forbidden', { description: 'Only Super Admins can manage core subscription plan structures.' });
      return;
    }

    const originalName = editingPlan.name;
    const updated = plans.map(p => {
      if (p.id === editingPlan.id) {
        return editingPlan;
      }
      return p;
    });

    savePlans(updated);
    toast.success(`Successfully updated subscription tier "${originalName}".`);
    setEditingPlan(null);
  };

  const handleDeletePlan = (id: string, name: string) => {
    if (currentUserRole !== 'SUPER_ADMIN') {
      toast.error('Forbidden', { description: 'Only Super Admins can manage core subscription plan structures.' });
      return;
    }

    const updated = plans.filter(p => p.id !== id);
    savePlans(updated);
    toast.success(`Pricing plane "${name}" was permanently removed.`);
  };

  const makePopular = (id: string) => {
    const updated = plans.map(p => ({
      ...p,
      popular: p.id === id
    }));
    savePlans(updated);
    toast.success('Popular plan configuration highlighted.');
  };

  // --- PAYMENT PROCESSING HELPER ---
  const handleProcessCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheckoutPlan) return;

    setCheckoutProgress(true);
    
    setTimeout(() => {
      if (checkoutGateway === 'stripe') {
        // Stripe upcoming indicator notice
        toast.info("Stripe Subscriptions Integration", {
          description: "Stripe Billing checkout flow launched in simulator mode. Pre-registering payment card details."
        });
      }

      const randomInvoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTransaction = {
        id: randomInvoiceId,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Paid',
        method: checkoutGateway === 'paypal' ? `PayPal (${paypalEmail})` : `Visa ending 4242`,
        plan: selectedCheckoutPlan.name,
        amount: selectedCheckoutPlan.price.includes('$') ? `${selectedCheckoutPlan.price}.00` : `$${selectedCheckoutPlan.price}.00`
      };

      setTransactions(prev => [newTransaction, ...prev]);

      // Save new active plan to localStorage
      localStorage.setItem('settings_activeWorkspacePlan', selectedCheckoutPlan.name);

      // Dispatches unified invoice details to billing server to fire outbound webhook event triggers
      axios.post('/api/payments/complete', {
        transactionId: randomInvoiceId,
        planName: selectedCheckoutPlan.name,
        amount: selectedCheckoutPlan.price.includes('$') ? `${selectedCheckoutPlan.price}.00` : `$${selectedCheckoutPlan.price}.00`,
        gateway: checkoutGateway,
        email: paypalEmail
      }, {
        headers: { 'x-workspace-id': '1' }
      }).catch(err => console.warn('[Billing] Backend payment confirmation dispatch failure:', err));

      toast.success("Transaction Approved!", {
        description: `Successfully subscribed to the "${selectedCheckoutPlan.name}" plan via ${checkoutGateway === 'paypal' ? 'PayPal Checkout' : 'Stripe Billing (Simulator)'}`
      });
      
      setCheckoutProgress(false);
      setSelectedCheckoutPlan(null);
    }, 1500);
  };

  // Profile data values from LocalStorage
  const fullName = localStorage.getItem('settings_fullName') || 'Preet Kalirona';
  const emailAddress = localStorage.getItem('settings_emailAddress') || 'preetkalirona@gmail.com';
  const jobTitle = localStorage.getItem('settings_jobTitle') || 'Chief Executive Officer / Director';
  const selectedAvatar = localStorage.getItem('settings_avatar') || '👨‍💻';

  return (
    <SystemPageLayout>
      <PageHeader 
        category="Subscription Console & Commercial Tiers"
        title="Modern Commercial Billing"
        description="Review agency subscription grids, subscribe via sandbox PayPal, and preview live Stripe pipelines."
        version="Billing Panel v2.0"
      />
      
      <PageContent>
        
        {/* SIDEBAR COHNSTRAINT: PROFILE & PORTABILITY */}
        <div className="col-span-12 md:col-span-1 lg:col-span-3 space-y-6" id="billing-left-sidebar-column">
          
          <Card className="border border-slate-200 bg-white p-6 rounded-2xl shadow-xs">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-3xl shadow-sm mb-3 select-none">
                {selectedAvatar}
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">{fullName}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 truncate w-full">{jobTitle}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-1 w-full truncate">{emailAddress}</p>
            </div>
          </Card>

          <Card className="border border-slate-200 bg-white p-4 rounded-2xl shadow-xs">
            <div className="mb-3 px-1 text-[9px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
              Console Settings
            </div>
            <div className="w-full flex flex-row lg:flex-col justify-start gap-4 lg:gap-1 lg:items-stretch overflow-x-auto lg:overflow-x-visible scrollbar-none">
              <button
                type="button"
                onClick={() => navigate('/settings?tab=profile')}
                className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent text-slate-500 hover:text-slate-900 bg-transparent px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer text-left lg:justify-start lg:w-full lg:rounded-r-xl"
              >
                <User className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                My Profile
              </button>

              <button
                type="button"
                onClick={() => navigate('/settings?tab=workspace')}
                className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent text-slate-500 hover:text-slate-900 bg-transparent px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer text-left lg:justify-start lg:w-full lg:rounded-r-xl"
              >
                <Building className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                Workspace
              </button>

              <button
                type="button"
                onClick={() => navigate('/settings?tab=api')}
                className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent text-slate-500 hover:text-slate-900 bg-transparent px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer text-left lg:justify-start lg:w-full lg:rounded-r-xl"
              >
                <Key className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                Integrations
              </button>

              <button
                type="button"
                onClick={() => navigate('/settings?tab=team')}
                className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent text-slate-500 hover:text-slate-900 bg-transparent px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer text-left lg:justify-start lg:w-full lg:rounded-r-xl"
              >
                <Users className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                Team Members
              </button>

              <button
                type="button"
                onClick={() => navigate('/settings?tab=security')}
                className="rounded-none border-b-2 lg:border-b-0 lg:border-l-2 border-transparent text-slate-500 hover:text-slate-900 bg-transparent px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer text-left lg:justify-start lg:w-full lg:rounded-r-xl"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                Security
              </button>

              <button
                type="button"
                className="border-b-2 lg:border-b-0 lg:border-l-2 border-indigo-600 text-indigo-700 bg-indigo-50/50 hover:text-slate-900 px-1 lg:px-4 pb-3 lg:pb-2.5 pt-1.5 lg:pt-2.5 font-bold uppercase tracking-widest text-[10px] flex items-center transition-all cursor-pointer text-left lg:justify-start lg:w-full lg:rounded-r-xl"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-current shrink-0" />
                Billing
              </button>
            </div>
          </Card>

          {/* SIMULATED IDENTITY CONTROL */}
          <Card className="border border-slate-200 bg-white text-slate-900 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-5 flex flex-col gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Active Identity</span>
                <h3 className="text-sm font-bold text-slate-950">Role Selection Sandbox</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed leading-none">
                  Switch roles below to toggle plan editing permission.
                </p>
              </div>

              <div className="flex flex-col bg-slate-50 p-1.5 rounded-xl border border-slate-200 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRoleToggle('SUPER_ADMIN')}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    currentUserRole === 'SUPER_ADMIN' 
                      ? 'bg-white text-slate-950 border border-slate-200 shadow-xs' 
                      : 'text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>Super Admin UI</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleToggle('ADMIN')}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    currentUserRole === 'ADMIN' 
                      ? 'bg-white text-slate-950 border border-slate-200 shadow-xs' 
                      : 'text-slate-400 hover:text-slate-800'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Standard Staff</span>
                </button>
              </div>
            </div>
          </Card>

          {/* USAGE LIMITS MONITOR */}
          <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden mt-6">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Plan Quotas</span>
                  <h3 className="text-xs font-bold text-slate-900">Active Usage Tracker</h3>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0.5">
                  {activePlan} Tier
                </Badge>
              </div>

              {/* Interactive Sandbox Changer */}
              <div className="p-2.5 bg-slate-50 border border-slate-205 rounded-xl space-y-1.5 text-left">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Sandbox Demo Upgrade:</span>
                <div className="grid grid-cols-4 gap-1">
                  {Object.keys(PLAN_LIMITS).map((planKey) => (
                    <button
                      key={planKey}
                      type="button"
                      onClick={() => {
                        localStorage.setItem('settings_activeWorkspacePlan', planKey);
                        setActivePlan(planKey);
                        toast.success(`Sandbox Plan upgraded to: ${planKey}`);
                      }}
                      className={cn(
                        "py-1 rounded text-[9px] font-extrabold uppercase transition border text-center cursor-pointer",
                        activePlan === planKey 
                          ? "bg-slate-900 text-white border-slate-900" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {planKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Limits list */}
              <div className="space-y-3 pt-1">
                {/* 1. Clients Limit */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-705">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> CRM Clients</span>
                    <span className="font-mono text-[11px] text-slate-600">
                      {currentUsage.clients} / {PLAN_LIMITS[activePlan].clients >= 1000000 ? 'Unlimited' : PLAN_LIMITS[activePlan].clients}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        (currentUsage.clients / PLAN_LIMITS[activePlan].clients) >= 1.0 ? "bg-rose-500" :
                        (currentUsage.clients / PLAN_LIMITS[activePlan].clients) >= 0.8 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ 
                        width: `${Math.min(100, (currentUsage.clients / PLAN_LIMITS[activePlan].clients) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                {/* 2. Appointments Limit */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-705">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Bookings</span>
                    <span className="font-mono text-[11px] text-slate-600">
                      {currentUsage.appointments} / {PLAN_LIMITS[activePlan].appointments >= 1000000 ? 'Unlimited' : PLAN_LIMITS[activePlan].appointments}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        (currentUsage.appointments / PLAN_LIMITS[activePlan].appointments) >= 1.0 ? "bg-rose-500" :
                        (currentUsage.appointments / PLAN_LIMITS[activePlan].appointments) >= 0.8 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ 
                        width: `${Math.min(100, (currentUsage.appointments / PLAN_LIMITS[activePlan].appointments) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                {/* 3. AI Credits Limit */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-705">
                    <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-slate-400" /> Gemini AI Used</span>
                    <span className="font-mono text-[11px] text-slate-600">
                      {currentUsage.aiCredits} / {PLAN_LIMITS[activePlan].aiCredits >= 1000000 ? 'Unlimited' : PLAN_LIMITS[activePlan].aiCredits}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        (currentUsage.aiCredits / PLAN_LIMITS[activePlan].aiCredits) >= 1.0 ? "bg-rose-500" :
                        (currentUsage.aiCredits / PLAN_LIMITS[activePlan].aiCredits) >= 0.8 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ 
                        width: `${Math.min(100, (currentUsage.aiCredits / PLAN_LIMITS[activePlan].aiCredits) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                {/* 4. Storage Limit */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-705 text-left">
                    <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-slate-400" /> Cloud Storage</span>
                    <span className="font-mono text-[11px] text-slate-600">
                      {currentUsage.storage.toFixed(1)} MB / {PLAN_LIMITS[activePlan].storage} MB
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        (currentUsage.storage / PLAN_LIMITS[activePlan].storage) >= 1.0 ? "bg-rose-500" :
                        (currentUsage.storage / PLAN_LIMITS[activePlan].storage) >= 0.8 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ 
                        width: `${Math.min(100, (currentUsage.storage / PLAN_LIMITS[activePlan].storage) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Status Warning Warning Check */}
              {(currentUsage.clients >= PLAN_LIMITS[activePlan].clients ||
                currentUsage.appointments >= PLAN_LIMITS[activePlan].appointments ||
                currentUsage.aiCredits >= PLAN_LIMITS[activePlan].aiCredits) && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-1 text-[11px] text-rose-800 font-semibold leading-relaxed text-left">
                    <p className="flex items-center gap-1 text-xs font-bold text-rose-900">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Subscription Limit Reached!
                    </p>
                    <p>
                      Your active records are currently bounded by the {activePlan} tier limits. Please select a premium tier grid on the right to expand capabilities seamlessly.
                    </p>
                  </div>
              )}
            </div>
          </Card>
        </div>

        {/* PRIMARY MAIN GRID AND TRANSACTION FLOWS */}
        <div className="col-span-12 lg:col-span-9 space-y-8" id="billing-primary-content-column">
          
          {/* PRICING PLANS VIEW */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  Available Subscription Grids
                </h2>
                <p className="text-xs text-slate-500">Select any plan to experience the integrated checkout engine.</p>
              </div>

              {currentUserRole === 'SUPER_ADMIN' && (
                <Button 
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-wider h-9"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Add Custom Pricing Tier
                </Button>
              )}
            </div>

            {/* SUPER ADMIN PLAN ADD FORM */}
            {currentUserRole === 'SUPER_ADMIN' && showAddForm && (
              <Card className="border-indigo-100 bg-indigo-50/15 overflow-hidden shadow-xs border">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-extrabold text-slate-800">
                    Add New Plan (Super Admin Mode)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure a new multi-tenant SaaS profile pricing tier.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleAddNewPlan}>
                  <CardContent className="p-5 pt-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-700 uppercase">Plan Name</Label>
                        <Input 
                          placeholder="e.g. Enterprise Elite" 
                          required
                          value={planForm.name}
                          onChange={e => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-700 uppercase">Monthly Price ($)</Label>
                        <Input 
                          placeholder="e.g. $499" 
                          required
                          value={planForm.price}
                          onChange={e => setPlanForm(prev => ({ ...prev, price: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-700 uppercase">AI Credits included</Label>
                        <Input 
                          placeholder="e.g. 50,000 or Unlimited" 
                          required
                          value={planForm.credits}
                          onChange={e => setPlanForm(prev => ({ ...prev, credits: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-700 uppercase">Core Features (one feature per line)</Label>
                      <Textarea 
                        placeholder="Unlimited WP Sites&#10;Dedicated Success Strategist&#10;White-label Hosting Slugs"
                        rows={4}
                        required
                        value={planForm.featuresRaw}
                        onChange={e => setPlanForm(prev => ({ ...prev, featuresRaw: e.target.value }))}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id="new-is-popular" 
                        checked={planForm.popular}
                        onChange={e => setPlanForm(prev => ({ ...prev, popular: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                      />
                      <Label htmlFor="new-is-popular" className="text-xs text-slate-600 font-bold select-none cursor-pointer">
                        Mark this plan as "Most Popular / Featured" on standard client pricing screens
                      </Label>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end gap-2.5">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-xs"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase">
                      Publish Commercial Plan
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}

            {/* LIVE DYNAMIC PLAN EDITOR FORM FOR EXSTING TIER */}
            {currentUserRole === 'SUPER_ADMIN' && editingPlan && (
              <Card className="border-amber-200 bg-amber-50/10 overflow-hidden shadow-xs border">
                <CardHeader className="p-5 pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-extrabold text-amber-900">
                      Edit Plan: {editingPlan.name}
                    </CardTitle>
                    <button 
                      type="button" 
                      onClick={() => setEditingPlan(null)} 
                      className="text-amber-700 hover:text-amber-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <form onSubmit={handleUpdatePlan}>
                  <CardContent className="p-5 pt-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-700 uppercase">Plan Name</Label>
                        <Input 
                          value={editingPlan.name}
                          required
                          onChange={e => setEditingPlan(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-700 uppercase">Monthly Price ($)</Label>
                        <Input 
                          value={editingPlan.price}
                          required
                          onChange={e => setEditingPlan(prev => prev ? ({ ...prev, price: e.target.value }) : null)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-700 uppercase">AI Credits</Label>
                        <Input 
                          value={editingPlan.credits}
                          required
                          onChange={e => setEditingPlan(prev => prev ? ({ ...prev, credits: e.target.value }) : null)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-700 uppercase">Features (Comma Separated)</Label>
                      <Input 
                        value={editingPlan.features.join(', ')}
                        required
                        onChange={e => setEditingPlan(prev => prev ? ({ ...prev, features: e.target.value.split(',').map(f => f.trim()) }) : null)}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="bg-slate-50 border-t border-slate-150 p-4 flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-xs" 
                      onClick={() => setEditingPlan(null)}
                    >
                      Dismiss
                    </Button>
                    <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase">
                      Commit Updates
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}

            {/* PLANS RESPONSIVE GRID GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {plans.map((p) => {
                const isPopular = p.popular;
                return (
                  <Card 
                    key={p.id} 
                    className={cn(
                      "relative border shadow-xs overflow-hidden flex flex-col justify-between transition-all duration-300 bg-white",
                      isPopular ? "ring-2 ring-indigo-600 scale-100 z-10 shadow-indigo-100" : "hover:shadow-md border-slate-200"
                    )}
                  >
                    {isPopular && (
                      <div className="bg-indigo-600 py-1.5 text-center">
                        <span className="text-[9px] font-black text-white uppercase tracking-widest block">Featured SaaS Plan</span>
                      </div>
                    )}
                    
                    <div>
                      <CardHeader className="text-center p-5 pb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.name} Plan</h3>
                          
                          {/* Super Admin Control Buttons */}
                          {currentUserRole === 'SUPER_ADMIN' && (
                            <div className="flex gap-1">
                              <button 
                                type="button" 
                                title="Edit Pricing Level"
                                className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-indigo-600 transition"
                                onClick={() => {
                                  setEditingPlan(p);
                                }}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                type="button" 
                                title="Delete Plan"
                                className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-rose-605 transition"
                                onClick={() => handleDeletePlan(p.id, p.name)}
                              >
                                <Trash2 className="w-3 h-3 text-rose-500" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-baseline justify-center gap-0.5 mt-2">
                          <span className="text-2xl font-black text-slate-900 tracking-tighter" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                            {p.price}
                          </span>
                          <span className="text-slate-400 font-bold text-[10px]">/mo</span>
                        </div>
                        <p className="text-[8px] text-indigo-600 font-black uppercase tracking-widest mt-2.5 bg-indigo-50 py-0.5 px-2 rounded-full w-fit mx-auto">
                          {p.credits} Credits Included
                        </p>
                      </CardHeader>
                      
                      <CardContent className="p-5 pt-1">
                        <ul className="space-y-2 text-[11px] mb-5">
                          {p.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-slate-600 font-medium">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="truncate">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </div>

                    <CardFooter className="p-5 pt-0 bg-slate-50/50 border-t border-slate-100 mt-auto">
                      <div className="w-full space-y-2 pt-3">
                        <Button 
                          onClick={() => {
                            setSelectedCheckoutPlan(p);
                          }}
                          variant={isPopular ? "default" : "outline"}
                          className={cn(
                            "w-full h-8 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all",
                            isPopular 
                              ? "bg-indigo-600 hover:bg-indigo-750 text-white" 
                              : "border-slate-200 text-slate-900 hover:bg-slate-100"
                          )}
                        >
                          Select {p.name}
                        </Button>
                        
                        {currentUserRole === 'SUPER_ADMIN' && !isPopular && (
                          <button 
                            onClick={() => makePopular(p.id)}
                            className="text-[9px] text-slate-400 hover:text-indigo-600 font-bold uppercase block w-full text-center hover:underline cursor-pointer"
                          >
                            Highlight Plan
                          </button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* DYNAMIC CHECKOUT MODAL AND SIMULATOR GATEWAYS */}
          {selectedCheckoutPlan && (
            <Card className="border-indigo-600 bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-200" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-50">
                    SaaS Integration Suite: Subscription Checkout
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedCheckoutPlan(null)}
                  className="text-white hover:text-indigo-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-150">
                
                {/* CHECKOUT SELECTION COLUMN */}
                <div className="lg:col-span-4 p-6 bg-slate-50/50 space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Checkout Summary</span>
                  <div className="space-y-1">
                    <h4 className="text-lg font-extrabold text-slate-950" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                      {selectedCheckoutPlan.name} Plan
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">Billed monthly. Unlocked instantly.</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 text-xs">
                    <span className="text-slate-500 font-bold">Subscription Cost</span>
                    <span className="font-mono text-slate-900 font-black">{selectedCheckoutPlan.price}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold">Credits Included</span>
                    <span className="font-bold text-indigo-600 underline">{selectedCheckoutPlan.credits} AI credits</span>
                  </div>

                  <hr className="border-slate-200" />

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Choose Commercial Gateway</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutGateway('paypal')}
                        className={`p-3 rounded-lg border text-xs font-black uppercase tracking-wider flex flex-col items-center gap-1 transition ${
                          checkoutGateway === 'paypal'
                            ? 'border-indigo-600 bg-indigo-50/40 text-slate-950'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <Wallet className="w-4 h-4 text-indigo-500" />
                        <span>Pay with PayPal</span>
                      </button>

                      <button
                        type="button"
                        className={`p-3 rounded-lg border text-xs font-black uppercase tracking-wider flex flex-col items-center gap-1 transition relative overflow-hidden ${
                          checkoutGateway === 'stripe'
                            ? 'border-indigo-600 bg-indigo-50/40 text-slate-900'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100'
                        }`}
                        onClick={() => setCheckoutGateway('stripe')}
                      >
                        <CreditCard className="w-4 h-4 text-indigo-500" />
                        <span>Stripe Billing</span>
                        <span className="absolute bottom-0 right-0 bg-indigo-600 text-white text-[6px] font-extrabold uppercase px-1 rounded-tl">Upcoming</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC FORM COLUMN */}
                <div className="lg:col-span-8 p-6">
                  <form onSubmit={handleProcessCheckout} className="space-y-4 text-left">
                    {checkoutGateway === 'paypal' ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-500/5 border border-amber-100 rounded-xl flex gap-3 text-xs">
                          <Wallet className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-amber-800 font-medium">
                            <strong>Simulated PayPal Merchant Gateway Sandbox</strong><br />
                            Complete standard login authentication to verify wallet and process instant SaaS provisioning.
                          </p>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-600 uppercase">PayPal Email / Mobile ID</Label>
                          <Input 
                            type="email" 
                            required 
                            placeholder="preetkalirona@gmail.com"
                            value={paypalEmail}
                            onChange={e => setPaypalEmail(e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-500/5 border border-blue-100 rounded-xl flex gap-2.5 text-xs text-left">
                          <CreditCard className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <p className="text-blue-800 font-medium">
                            <strong>Upcoming Stripe Subscription Integration Preview</strong><br />
                            Checkout session generates live customer profile and handles secure webhook alerts inside Stripe dashboard.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-600 uppercase">Credit Card Holder</Label>
                            <Input 
                              type="text" 
                              required 
                              value={cardHolder}
                              onChange={e => setCardHolder(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-600 uppercase">Card digits</Label>
                            <Input 
                              type="text" 
                              required 
                              value={cardNumber}
                              onChange={e => setCardNumber(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-600 uppercase">Email Address</Label>
                          <Input 
                            type="email" 
                            required 
                            value={stripeEmail}
                            onChange={e => setStripeEmail(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-3 flex gap-2 justify-end">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="text-xs" 
                        onClick={() => setSelectedCheckoutPlan(null)}
                      >
                        Cancel Checkout
                      </Button>
                      
                      <Button 
                        type="submit" 
                        disabled={checkoutProgress}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest py-5 px-6 flex items-center justify-center gap-1.5"
                      >
                        {checkoutProgress ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Confirming with Merchant...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Process Subscription</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>

              </div>
            </Card>
          )}

          {/* BELOW LAYOUT: TRANSACTION HISTORY & STATUS */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-2">
             
             {/* TRANSACTIONS CARD TABLE */}
             <Card className="xl:col-span-8 border-slate-200 shadow-xs h-fit overflow-hidden bg-white">
               <CardHeader className="bg-slate-50/50 border-b border-slate-150 py-4 px-6 flex flex-row items-center justify-between">
                 <CardTitle className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                   <History className="w-4 h-4 text-slate-400" />
                   Transaction Invoicing Records
                 </CardTitle>
                 <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] uppercase font-black tracking-wider border border-emerald-250">
                    Live Status Feed
                 </Badge>
               </CardHeader>
               <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-[#fcfdfe] text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3">Invoice</th>
                          <th className="px-6 py-3">Billed Plan</th>
                          <th className="px-6 py-3">Gateway / Method</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {transactions.map((inv) => (
                           <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors">
                             <td className="px-6 py-4">
                               <div className="flex items-center gap-2">
                                 <p className="text-xs font-black text-slate-900">{inv.id}</p>
                                 <Download className="w-3.5 h-3.5 text-slate-300 hover:text-indigo-600 cursor-pointer transition-colors" />
                               </div>
                             </td>
                             <td className="px-6 py-4">
                               <span className="text-xs font-bold text-slate-800">{inv.plan}</span>
                             </td>
                             <td className="px-6 py-4">
                               <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">{inv.method}</span>
                             </td>
                             <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{inv.date}</td>
                             <td className="px-6 py-4 text-right text-xs font-black text-slate-900">{inv.amount}</td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                 </div>
               </CardContent>
             </Card>

             {/* STATS OVERVIEW CARD */}
             <Card className="xl:col-span-4 border-slate-200 shadow-xs bg-slate-900 text-white rounded-2xl overflow-hidden flex flex-col justify-between">
               <CardHeader className="p-6 pb-2">
                 <CardTitle className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Active Agency Profile</CardTitle>
                 <p className="text-lg font-black tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Commercial Billing Meta</p>
               </CardHeader>
               <CardContent className="p-6 pt-3 space-y-5">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                         <CreditCard className="w-5 h-5 text-indigo-400" />
                       </div>
                       <div>
                         <p className="text-xs font-black italic">Active Client Portal</p>
                         <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mt-0.5">SANDBOX ACTIVE</p>
                       </div>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-indigo-100/70 font-medium leading-relaxed italic">
                      PayPal and Stripe interfaces currently execute under sandbox simulation constraints. Invoices generate dynamic updates in the grid immediately on merchant token resolution.
                    </p>
                  </div>
               </CardContent>
               <CardFooter className="p-6 bg-slate-950/40 border-t border-white/5">
                 <Button className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">
                   Manage Stripe Hook Alerts
                 </Button>
               </CardFooter>
             </Card>
          </div>

        </div>

      </PageContent>
    </SystemPageLayout>
  );
}
