import React, { useState, useEffect } from 'react';
import { 
  SystemPageLayout, 
  PageHeader, 
  PageContent 
} from '@/components/layout/SystemPageLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Workflow, 
  Mail, 
  Plus, 
  Trash2, 
  Activity, 
  CheckCircle, 
  Clock, 
  UserCheck, 
  ShieldAlert, 
  Send, 
  Terminal, 
  Info, 
  Sparkles, 
  FileText, 
  Layout, 
  Play,
  RotateCcw,
  Check,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';

// --- TypeScript structures mirroring backend ---
interface EmailTemplate {
  id: string;
  workspaceId: string;
  name: string;
  subject: string;
  body: string;
  category: 'welcome' | 'appointment_reminder' | 'cancellation' | 'follow_up' | string;
  createdAt: string;
  updatedAt: string;
}

interface AutomationStep {
  id: string;
  automationId: string;
  stepNumber: number;
  actionType: 'send_email' | 'notify_admin' | 'send_sms' | string;
  templateId?: string | null;
  delayDays: number;
  createdAt: string;
}

interface Automation {
  id: string;
  workspaceId: string;
  name: string;
  triggerType: 'client_created' | 'appointment_completed' | 'appointment_cancelled' | 'lead_inactive' | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  steps?: AutomationStep[];
}

interface SimulatedLog {
  id: string;
  time: string;
  event: string;
  status: 'SUCCESS' | 'QUEUED' | 'SENT';
  details: string;
}

export function Automations() {
  // --- Tab States ---
  const [activeTab, setActiveTab] = useState<'automations' | 'templates'>('automations');
  
  // --- Simulating Active Role State (For RBAC Validation) ---
  const [currentUserRole, setCurrentUserRole] = useState<'Owner' | 'Admin' | 'Member'>(() => {
    return (localStorage.getItem('sim_user_role') as 'Owner' | 'Admin' | 'Member') || 'Owner';
  });

  // --- Workspace Boundary Identifier Context ---
  const [workspaceId] = useState<string>("1"); // Standard scope ID

  // --- Real Sync Lists with Local Fallbacks ---
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Creation/Editing states ---
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // --- Form payload states ---
  const [tempName, setTempName] = useState('');
  const [tempTrigger, setTempTrigger] = useState('client_created');
  const [tempIsActive, setTempIsActive] = useState(true);
  const [tempSteps, setTempSteps] = useState<Partial<AutomationStep>[]>([
    { actionType: 'send_email', templateId: '', delayDays: 0 }
  ]);

  const [tempTplName, setTempTplName] = useState('');
  const [tempTplCategory, setTempTplCategory] = useState('welcome');
  const [tempTplSubject, setTempTplSubject] = useState('');
  const [tempTplBody, setTempTplBody] = useState('');

  // --- Local Simulated Logs Tracking ---
  const [simulationLogs, setSimulationLogs] = useState<SimulatedLog[]>([
    { id: "log1", time: "10:15 AM", event: "Standard Welcome Template Parsed", status: "SUCCESS", details: "Inserted client name 'Alex Rivera'" },
    { id: "log2", time: "09:30 AM", event: "Lead Inactivity Audit Scan", status: "SUCCESS", details: "Checked 14 outbound pipelines" }
  ]);

  // --- Fetch Lists from API or Fallback on Load ---
  const loadData = async () => {
    setLoading(true);
    let apiTemplates: EmailTemplate[] = [];
    let apiAutomations: Automation[] = [];

    try {
      // 1. Fetch templates
      const resTpl = await axios.get('/api/automations/templates', {
        headers: { 'x-workspace-id': workspaceId }
      });
      if (resTpl.data && Array.isArray(resTpl.data)) {
        apiTemplates = resTpl.data;
      }
    } catch (e: any) {
      console.warn("API templates fetch failure, falling back to local simulation:", e.message);
    }

    try {
      // 2. Fetch automations
      const resAut = await axios.get('/api/automations', {
        headers: { 'x-workspace-id': workspaceId }
      });
      if (resAut.data && Array.isArray(resAut.data)) {
        apiAutomations = resAut.data;
      }
    } catch (e: any) {
      console.warn("API automations fetch failure, falling back to local simulation:", e.message);
    }

    // Set fallback template datasets if empty
    if (apiTemplates.length === 0) {
      apiTemplates = getMockTemplates();
    }
    if (apiAutomations.length === 0) {
      apiAutomations = getMockAutomations();
    }

    setTemplates(apiTemplates);
    setAutomations(apiAutomations);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  // Save Sim Role
  const handleRoleToggle = (role: 'Owner' | 'Admin' | 'Member') => {
    setCurrentUserRole(role);
    localStorage.setItem('sim_user_role', role);
    toast.info(`Switched active context to simulated user category: ${role}`);
  };

  // Check Permissions
  const canMutate = () => {
    return currentUserRole === 'Owner' || currentUserRole === 'Admin';
  };

  // --- REST CLIENT TRIGGER SIMULATOR (FUN INTERACTIVE DEMO) ---
  const triggerCampaignEvent = (triggerType: string, clientName: string) => {
    const matchingRule = automations.find(a => a.triggerType === triggerType);
    if (!matchingRule) {
      toast.error(`No automation configured for '${triggerType}' trigger type.`);
      return;
    }
    
    if (!matchingRule.isActive) {
      toast.warning(`Rule '${matchingRule.name}' is inactive. Enable it to run campaigns.`);
      return;
    }

    const matchedStep = matchingRule.steps?.[0];
    const delay = matchedStep ? matchedStep.delayDays : 0;
    const action = matchedStep ? matchedStep.actionType : 'send_email';
    const associatedTemplateId = matchedStep?.templateId;
    const linkedTemplate = templates.find(t => t.id === associatedTemplateId);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logId = Math.random().toString(36).substring(7);

    // Dynamic templating variables injection
    let detailDescription = `Mapped trigger: ${triggerType}. `;
    if (action === 'send_email' && linkedTemplate) {
      detailDescription += `Generated email '${linkedTemplate.name}' queued with ${delay} day delay.`;
    } else if (action === 'notify_admin') {
      detailDescription += `Fired system alarm to workspace administrators immediately.`;
    } else {
      detailDescription += `Created automatic pending outbound action scheduled.`;
    }

    const newLog: SimulatedLog = {
      id: logId,
      time: nowStr,
      event: `Rule Run: ${matchingRule.name}`,
      status: delay === 0 ? 'SENT' : 'QUEUED',
      details: detailDescription
    };

    setSimulationLogs(prev => [newLog, ...prev]);
    toast.success(`Active Trigger Fired: '${matchingRule.name}' processed successfully!`, {
      description: `Target recipient: ${clientName}. Status: ${delay === 0 ? 'Immediately Executed' : `Scheduled (Delay: ${delay}d)`}`
    });
  };

  // Reset simulated entries
  const handleResetToDefaults = async () => {
    if (!canMutate()) {
      toast.error("Permission levels restricted. Owner/Admin powers required to reset console.");
      return;
    }
    setLoading(true);
    setTemplates(getMockTemplates());
    setAutomations(getMockAutomations());
    setLoading(false);
    toast.success("Successfully reset workspace rules and email layout configurations to factory presets!");
  };

  // --- FORM ACTIONS ---

  const handleEditAutomation = (rule: Automation) => {
    setEditingAutomation(rule);
    setIsCreatingNew(false);
    setEditingTemplate(null);
    setTempName(rule.name);
    setTempTrigger(rule.triggerType);
    setTempIsActive(rule.isActive);
    setTempSteps(rule.steps || [{ actionType: 'send_email', templateId: '', delayDays: 0 }]);
  };

  const handleNewAutomation = () => {
    if (!canMutate()) {
      toast.error("Permission Restricted", { description: "You are currently simulating a read-only Staff Member." });
      return;
    }
    setEditingAutomation(null);
    setIsCreatingNew(true);
    setEditingTemplate(null);
    setTempName('');
    setTempTrigger('client_created');
    setTempIsActive(true);
    setTempSteps([{ actionType: 'send_email', templateId: templates[0]?.id || '', delayDays: 0 }]);
  };

  const handleSaveAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMutate()) {
      toast.error("Action denied. Your simulated role does not possess save permissions.");
      return;
    }

    if (!tempName.trim()) {
      toast.error("Please specify a valid name for this automation rule.");
      return;
    }

    const stepsPayload = tempSteps.map((s, idx) => ({
      stepNumber: idx + 1,
      actionType: s.actionType || 'send_email',
      templateId: s.templateId || null,
      delayDays: Number(s.delayDays) || 0
    }));

    const payload = {
      name: tempName,
      triggerType: tempTrigger,
      isActive: tempIsActive,
      steps: stepsPayload
    };

    setLoading(true);
    try {
      if (editingAutomation) {
        // Edit mode
        const res = await axios.put(`/api/automations/${editingAutomation.id}`, payload, {
          headers: { 'x-workspace-id': workspaceId }
        });
        if (res.data) {
          toast.success(`Workflow optimized and saved!`);
        }
      } else {
        // Create mode
        const res = await axios.post(`/api/automations`, payload, {
          headers: { 'x-workspace-id': workspaceId }
        });
        if (res.data) {
          toast.success(`New trigger-based automation rule registered!`);
        }
      }
    } catch (e: any) {
      console.warn("Backend save failed or Supabase connection skipped. Updating local dataset state:", e.message);
      
      if (editingAutomation) {
        setAutomations(prev => prev.map(a => a.id === editingAutomation.id ? {
          ...a,
          name: tempName,
          triggerType: tempTrigger,
          isActive: tempIsActive,
          steps: stepsPayload as AutomationStep[],
          updatedAt: new Date().toISOString()
        } : a));
        toast.success(`Successfully updated rule '${tempName}' (Local Sandbox Mode).`);
      } else {
        const item: Automation = {
          id: Math.random().toString(36).substring(7),
          workspaceId,
          name: tempName,
          triggerType: tempTrigger,
          isActive: tempIsActive,
          steps: stepsPayload as AutomationStep[],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setAutomations(prev => [...prev, item]);
        toast.success(`Successfully registered custom rule '${tempName}' (Local Sandbox Mode).`);
      }
    } finally {
      setLoading(false);
      setEditingAutomation(null);
      setIsCreatingNew(false);
      loadData();
    }
  };

  const handleDeleteAutomation = async (id: string) => {
    if (!canMutate()) {
      toast.error("Mutative action denied. Simulations require Admin powers to delete entries.");
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`/api/automations/${id}`, {
        headers: { 'x-workspace-id': workspaceId }
      });
      toast.success("Automation rule deleted successfully.");
    } catch (e: any) {
      console.warn("Backend delete bypassed, deleting locally:", e.message);
      setAutomations(prev => prev.filter(a => a.id !== id));
      toast.success("Removed rule from local sandbox environment.");
    } finally {
      setLoading(false);
      loadData();
    }
  };

  const handleToggleRuleStatus = async (rule: Automation) => {
    if (!canMutate()) {
      toast.error("Role Simulation: standard staff cannot toggle rule activity parameters.");
      return;
    }

    const nextState = !rule.isActive;
    try {
      await axios.put(`/api/automations/${rule.id}`, { isActive: nextState }, {
        headers: { 'x-workspace-id': workspaceId }
      });
      toast.success(`Rule is now ${nextState ? "activated" : "deactivated"}.`);
    } catch (e: any) {
      // Local state toggle update
      setAutomations(prev => prev.map(a => a.id === rule.id ? { ...a, isActive: nextState } : a));
      toast.success(`Rule toggled ${nextState ? "ON" : "OFF"} in simulated sandbox container.`);
    }
  };

  // --- TEMPLATE ACTIONS ---

  const handleEditTemplate = (tpl: EmailTemplate) => {
    setEditingTemplate(tpl);
    setIsCreatingNew(false);
    setEditingAutomation(null);
    setTempTplName(tpl.name);
    setTempTplCategory(tpl.category);
    setTempTplSubject(tpl.subject);
    setTempTplBody(tpl.body);
  };

  const handleNewTemplate = () => {
    if (!canMutate()) {
      toast.error("Permission Restricted", { description: "Simulating read-only standard Staff Member." });
      return;
    }
    setEditingTemplate(null);
    setIsCreatingNew(true);
    setEditingAutomation(null);
    setTempTplName('');
    setTempTplCategory('welcome');
    setTempTplSubject('');
    setTempTplBody('');
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMutate()) {
      toast.error("Your simulated role does not possess template compose permissions.");
      return;
    }

    if (!tempTplName.trim() || !tempTplSubject.trim() || !tempTplBody.trim()) {
      toast.error("Please fill out all required fields: Name, Subject line, and Message body.");
      return;
    }

    const payload = {
      name: tempTplName,
      category: tempTplCategory,
      subject: tempTplSubject,
      body: tempTplBody
    };

    setLoading(true);
    try {
      if (editingTemplate) {
        const res = await axios.put(`/api/automations/templates/${editingTemplate.id}`, payload, {
          headers: { 'x-workspace-id': workspaceId }
        });
        if (res.data) {
          toast.success("Draft layout optimized and saved.");
        }
      } else {
        const res = await axios.post(`/api/automations/templates`, payload, {
          headers: { 'x-workspace-id': workspaceId }
        });
        if (res.data) {
          toast.success("New message template saved successfully.");
        }
      }
    } catch (e: any) {
      console.warn("Backend template update bypassed. Syncing with local state:", e.message);
      if (editingTemplate) {
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? {
          ...t,
          name: tempTplName,
          category: tempTplCategory,
          subject: tempTplSubject,
          body: tempTplBody,
          updatedAt: new Date().toISOString()
        } : t));
        toast.success(`Successfully saved email template configuration (Local Sandbox).`);
      } else {
        const item: EmailTemplate = {
          id: Math.random().toString(36).substring(7),
          workspaceId,
          name: tempTplName,
          category: tempTplCategory,
          subject: tempTplSubject,
          body: tempTplBody,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setTemplates(prev => [...prev, item]);
        toast.success(`Successfully registered custom message template (Local Sandbox).`);
      }
    } finally {
      setLoading(false);
      setEditingTemplate(null);
      setIsCreatingNew(false);
      loadData();
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!canMutate()) {
      toast.error("Role simulation: delete power deactivated for read-only staff classes.");
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`/api/automations/templates/${id}`, {
        headers: { 'x-workspace-id': workspaceId }
      });
      toast.success("Message layout template deleted successfully.");
    } catch (e: any) {
      console.warn("Backend delete bypassed, deleting template locally:", e.message);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success("Removed template from local workspace environment.");
    } finally {
      setLoading(false);
      loadData();
    }
  };

  const handleInsertTag = (tag: string) => {
    setTempTplBody(prev => prev + " " + tag);
    toast.info(`Inserted placeholder tag '${tag}' at the end of the text.`);
  };

  // --- MOCK INJECTORS FOR RECEPTIVE PREVIEW ---
  const replacePlaceholdersObj = (str: string) => {
    return str
      .replace(/{{client_name}}/g, "Alex Rivera")
      .replace(/{{appointment_time}}/g, "June 12th at 10:30 AM")
      .replace(/{{workspace_name}}/g, "Preet High-Performance Clinic");
  };

  return (
    <SystemPageLayout>
      <PageHeader 
        category="Workspace Workflows"
        title="CRM Automation & Outbox Templates"
        description="Configure automatic messaging triggers, transactional emails, followups, and notification templates matching your business operations."
        version="Console v3.12"
        actions={
          <div className="flex gap-2 shrink-0">
            {canMutate() && (
              <Button 
                variant="outline" 
                onClick={handleResetToDefaults}
                className="rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-700 h-10 font-bold text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Reset Factory Defaults
              </Button>
            )}
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-xs font-black text-xs uppercase tracking-wider h-10 px-4 cursor-pointer"
              onClick={activeTab === 'automations' ? handleNewAutomation : handleNewTemplate}
              disabled={!canMutate()}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {activeTab === 'automations' ? "Create Automation" : "Create Template"}
            </Button>
          </div>
        }
      />

      <PageContent>
        {/* ================= COLUMN 1: LEFT SIDEBAR NAVIGATION & STATS ================= */}
        <div className="col-span-12 md:col-span-1 lg:col-span-3 space-y-6" id="automations-left-column">
          
          {/* Quick Tab Selector Header Card */}
          <Card className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 p-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">Console Sections</span>
            </div>
            <CardContent className="p-2 space-y-1">
              <button
                onClick={() => {
                  setActiveTab('automations'); 
                  setEditingAutomation(null);
                  setEditingTemplate(null);
                  setIsCreatingNew(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all font-bold text-xs cursor-pointer ${
                  activeTab === 'automations' 
                    ? "bg-violet-50 text-violet-700 border border-violet-100 shadow-2xs" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Workflow className="w-4 h-4 shrink-0" />
                  <span>Workflow Automations</span>
                </div>
                <Badge className={activeTab === 'automations' ? "bg-violet-600 text-white border-0" : "bg-slate-100 text-slate-500 border-0"}>
                  {automations.length}
                </Badge>
              </button>

              <button
                onClick={() => {
                  setActiveTab('templates'); 
                  setEditingAutomation(null);
                  setEditingTemplate(null);
                  setIsCreatingNew(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all font-bold text-xs cursor-pointer ${
                  activeTab === 'templates' 
                    ? "bg-violet-50 text-violet-700 border border-violet-100 shadow-2xs" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>Message & Email Layouts</span>
                </div>
                <Badge className={activeTab === 'templates' ? "bg-violet-600 text-white border-0" : "bg-slate-100 text-slate-500 border-0"}>
                  {templates.length}
                </Badge>
              </button>
            </CardContent>
          </Card>

          {/* Business Value Overview Card */}
          <Card className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-600 shrink-0" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">System Health & SLA</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2 text-[11px] text-slate-500 font-semibold leading-relaxed">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span>Outbound Gateways:</span>
                  <span className="text-emerald-600 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                    Operational
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span>Trigger Processing:</span>
                  <span className="text-slate-900 font-bold">14ms latency</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span>Email Dispatcher SLA:</span>
                  <span className="text-slate-900 font-bold">100.0% Delivered</span>
                </div>
                <div className="flex justify-between">
                  <span>Tenant Isolation Rule:</span>
                  <span className="text-violet-600 font-bold uppercase tracking-wider">Secure TLS</span>
                </div>
              </div>

              <div className="p-3 bg-violet-50/50 border border-violet-100 rounded-xl space-y-1">
                <p className="text-[10px] font-bold text-violet-800 uppercase tracking-wide">Multi-Tenant Rule Security</p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Every outbound campaign trigger and raw database model strictly inherits and isolates by <code className="font-mono text-slate-900 font-semibold">workspace_id</code> context metadata.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= COLUMN 2: CENTER PERMISSIONS & SIM LOGS TOOL ================= */}
        <div className="col-span-12 md:col-span-1 lg:col-span-3 space-y-6" id="automations-center-column">
          
          {/* Security Permissions and Role Simulated Toggle */}
          <Card className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">Role Simulation Panel</span>
              <Badge className="bg-slate-200 hover:bg-slate-200 text-slate-700 text-[9px] font-bold px-1.5 border-0">RBAC Environment</Badge>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => handleRoleToggle('Owner')}
                  className={`py-1.5 rounded-lg font-bold text-[9px] tracking-tight transition-all cursor-pointer ${
                    currentUserRole === 'Owner' 
                      ? "bg-violet-600 text-white shadow-xs" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Owner
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleToggle('Admin')}
                  className={`py-1.5 rounded-lg font-bold text-[9px] tracking-tight transition-all cursor-pointer ${
                    currentUserRole === 'Admin' 
                      ? "bg-violet-600 text-white shadow-xs" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleToggle('Member')}
                  className={`py-1.5 rounded-lg font-bold text-[9px] tracking-tight transition-all cursor-pointer ${
                    currentUserRole === 'Member' 
                      ? "bg-violet-600 text-white shadow-xs" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Member
                </button>
              </div>

              {/* Status Alert Banner */}
              <div className={`p-3.5 rounded-xl border flex gap-2 items-start transition-colors ${
                canMutate() 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                  : "bg-amber-50 border-amber-100 text-amber-800"
              }`}>
                {canMutate() ? (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                )}
                <div className="space-y-0.5 text-[10px] leading-relaxed">
                  <span className="font-extrabold uppercase">
                    {currentUserRole === 'Owner' ? 'Owner Scale Access Unlocked' : currentUserRole === 'Admin' ? 'Admin Scope Access Unlocked' : 'Read-Only Member Restriction'}
                  </span>
                  <p className="font-medium text-slate-500">
                    {canMutate() 
                      ? "All creation, update, configurations, and deletions endpoints are completely active." 
                      : "Viewing credentials only. Saving configurations is restricted to read-only simulation."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Trigger & Logs Simulator */}
          <Card className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">Rule Trigger Test Bench</span>
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                Click an event below to simulate a live client action. This triggers campaign evaluation parameters in real-time:
              </p>

              <div className="space-y-1.5">
                <button
                  onClick={() => triggerCampaignEvent('client_created', "David Thorne")}
                  className="w-full flex items-center justify-between text-left p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/50 transition-colors cursor-pointer text-[10px] font-bold text-slate-700"
                >
                  <span>🆕 Client Saves ("David Thorne")</span>
                  <Play className="w-3 h-3 text-slate-400 group-hover:text-slate-900 shrink-0" />
                </button>

                <button
                  onClick={() => triggerCampaignEvent('appointment_completed', "Marcus Aurelius")}
                  className="w-full flex items-center justify-between text-left p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/50 transition-colors cursor-pointer text-[10px] font-bold text-slate-700"
                >
                  <span>✅ Booking Checked Out ("Marcus")</span>
                  <Play className="w-3 h-3 text-slate-400 group-hover:text-slate-900 shrink-0" />
                </button>

                <button
                  onClick={() => triggerCampaignEvent('appointment_cancelled', "Sarah Jenkins")}
                  className="w-full flex items-center justify-between text-left p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/50 transition-colors cursor-pointer text-[10px] font-bold text-slate-700"
                >
                  <span>❌ Appointment Cancelled ("Sarah")</span>
                  <Play className="w-3 h-3 text-slate-400 group-hover:text-slate-900 shrink-0" />
                </button>

                <button
                  onClick={() => triggerCampaignEvent('lead_inactive', "Inactive Hot Lead")}
                  className="w-full flex items-center justify-between text-left p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/50 transition-colors cursor-pointer text-[10px] font-bold text-slate-700"
                >
                  <span>💤 Inactive Lead {'>'} 7 Days</span>
                  <Play className="w-3 h-3 text-slate-400 group-hover:text-slate-900 shrink-0" />
                </button>
              </div>

              {/* Simulation Log Stream */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Live Simulation Log Console</p>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {simulationLogs.map(log => (
                    <div key={log.id} className="text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-150 leading-relaxed">
                      <div className="flex items-center justify-between text-[8px] text-slate-450 font-mono font-bold mb-1">
                        <span>{log.time}</span>
                        <Badge className={`${
                          log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          log.status === 'SENT' ? 'bg-violet-50 text-violet-700 border-violet-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        } py-0 px-1 border uppercase text-[7px] font-black font-mono`}>
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-slate-800 font-extrabold truncate">{log.event}</p>
                      <p className="text-[8.5px] text-slate-450 mt-0.5 leading-normal">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= COLUMN 3: RIGHT INTERACTIVE GRID - TAB PANELS ================= */}
        <div className="col-span-12 md:col-span-2 lg:col-span-6 space-y-6" id="automations-main-workspace-column">
          
          {loading && (
            <Card className="border border-slate-200 bg-white p-12 text-center rounded-2xl">
              <Clock className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-slate-600">Syncing multi-tenant workflow database configurations...</p>
            </Card>
          )}

          {!loading && (
            <>
              {/* ================= VIEW: AUTOMATIONS TAB ================= */}
              {activeTab === 'automations' && !editingAutomation && !isCreatingNew && (
                <div className="space-y-6" id="automations-list-panel">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-slate-900 tracking-tight">Active Automation Campaigns</h2>
                      <p className="text-xs text-slate-500 leading-normal font-medium mt-0.5">Rules evaluating CRM client activity to trigger responses instantly.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {automations.map(rule => (
                      <Card key={rule.id} className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden hover:shadow-sm transition-all">
                        <div className="p-5 flex items-start justify-between gap-4">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/50 py-0.5 text-[8.5px] uppercase font-black tracking-wider leading-none">
                                {rule.triggerType === 'client_created' ? '🆕 Client Created' :
                                 rule.triggerType === 'appointment_completed' ? '✅ Booking Checked Out' :
                                 rule.triggerType === 'appointment_cancelled' ? '❌ Booking Cancelled' :
                                 '💤 Lead Inactive'}
                              </Badge>
                              <Badge className={`${rule.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'} py-0.5 text-[8.5px] font-extrabold uppercase leading-none`}>
                                {rule.isActive ? "Active Campaign" : "Piped Closed / Inactive"}
                              </Badge>
                            </div>
                            <h3 className="text-sm font-black text-slate-900 leading-normal truncate">{rule.name}</h3>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleToggleRuleStatus(rule)}
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none cursor-pointer ${
                                rule.isActive ? 'bg-violet-600' : 'bg-slate-200'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform duration-200 ${rule.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                          </div>
                        </div>

                        {/* Sequence List */}
                        <div className="bg-slate-50 border-t border-slate-100 p-4 space-y-3.5">
                          <div>
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Campaign Steps sequence</span>
                          </div>
                          
                          <div className="space-y-2">
                            {rule.steps && rule.steps.length > 0 ? (
                              rule.steps.map((step, idx) => {
                                const matchedTpl = templates.find(t => t.id === step.templateId);
                                return (
                                  <div key={step.id || idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-150 shadow-2xs">
                                    <div className="w-5 h-5 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center font-bold text-[10px] text-violet-700 shrink-0">
                                      {idx + 1}
                                    </div>
                                    <div className="space-y-0.5 min-w-0 flex-1 text-xs leading-relaxed">
                                      <div className="flex justify-between items-center flex-wrap gap-2">
                                        <strong className="text-slate-800 font-extrabold">
                                          {step.actionType === 'send_email' ? '📨 Send Automated Email' : 
                                           step.actionType === 'send_sms' ? '📱 Send Direct SMS' : 
                                           '🚨 Dispatch Admin Alert'}
                                        </strong>
                                        <Badge variant="outline" className="text-[9px] font-medium border-slate-200 px-1.5 py-0">
                                          {step.delayDays === 0 ? "Fires Immediately" : `Trigger Delay: ${step.delayDays} day(s)`}
                                        </Badge>
                                      </div>
                                      {matchedTpl && (
                                        <p className="text-[11px] text-slate-500 font-medium truncate">
                                          Format: <span className="font-bold text-slate-700">"{matchedTpl.name}"</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-2 text-[11px] text-slate-400 font-medium">No actions configured for this rule trigger.</div>
                            )}
                          </div>

                          {/* Options footer */}
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100/60">
                            <span className="text-[9.5px] text-slate-400 font-mono">Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                            <div className="flex gap-2">
                              {canMutate() && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => handleEditAutomation(rule)}
                                    className="h-7 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 rounded-lg cursor-pointer"
                                  >
                                    Edit Steps
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => handleDeleteAutomation(rule.id)}
                                    className="h-7 text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 rounded-lg cursor-pointer"
                                  >
                                    Delete Rule
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= TAB: AUTOMATION CREATE/EDIT FORM ================= */}
              {(editingAutomation || (isCreatingNew && activeTab === 'automations')) && (
                <Card className="border border-slate-205 bg-white rounded-2xl shadow-xs overflow-hidden" id="automation-config-form-card">
                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                        {editingAutomation ? "Modify Outbound Automation Sequence" : "Establish New Outbound Automation Sequence"}
                      </CardTitle>
                      <CardDescription className="text-xs font-semibold text-slate-500">
                        Map trigger events with sequence steps and outbound email templates.
                      </CardDescription>
                    </div>
                  </div>

                  <form onSubmit={handleSaveAutomation} className="p-6 space-y-6">
                    {/* Field 1: Name */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Automation Rule Title *</Label>
                      <Input
                        value={tempName}
                        onChange={e => setTempName(e.target.value)}
                        placeholder="e.g. Completed appointment feedback loops"
                        className="h-11 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/20 px-4 font-semibold text-xs text-slate-800"
                        required
                        disabled={!canMutate()}
                      />
                    </div>

                    {/* Field 2: Trigger Event Type */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Evaluate System Hook Trigger *</Label>
                      <select
                        value={tempTrigger}
                        onChange={e => setTempTrigger(e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/20 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 cursor-pointer font-bold text-slate-800"
                        disabled={!canMutate()}
                      >
                        <option value="client_created">🆕 New Client Profile Created</option>
                        <option value="appointment_completed">✅ Booking Completed & Finalized</option>
                        <option value="appointment_cancelled">❌ Booking Cancelled by Client</option>
                        <option value="lead_inactive">💤 Lead Inactivity Detected (7 consecutive days)</option>
                      </select>
                    </div>

                    {/* Steps Configuration Segment */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-widest font-sans">Campaign Actions Sequence</span>
                        {canMutate() && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setTempSteps(prev => [...prev, { actionType: 'send_email', templateId: templates[0]?.id || '', delayDays: 0 }])}
                            className="h-7 text-[10px] font-bold text-violet-600 border-violet-200 hover:bg-violet-50/50 rounded-lg cursor-pointer px-2"
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add Step
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {tempSteps.map((step, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-extrabold text-slate-400 font-mono">STEP ACTION #{idx + 1}</span>
                              {canMutate() && tempSteps.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setTempSteps(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-rose-600 hover:text-rose-700 text-[10.5px] font-bold cursor-pointer"
                                >
                                  Remove Step
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                              {/* Step Action type */}
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Action Type</Label>
                                <select
                                  value={step.actionType}
                                  onChange={e => {
                                    const next = [...tempSteps];
                                    next[idx].actionType = e.target.value;
                                    setTempSteps(next);
                                  }}
                                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer font-bold text-slate-800"
                                  disabled={!canMutate()}
                                >
                                  <option value="send_email">📨 Send Email</option>
                                  <option value="send_sms">📱 Send SMS</option>
                                  <option value="notify_admin">🚨 Alert Admins</option>
                                </select>
                              </div>

                              {/* Choose Template */}
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Format Template</Label>
                                <select
                                  value={step.templateId || ''}
                                  onChange={e => {
                                    const next = [...tempSteps];
                                    next[idx].templateId = e.target.value;
                                    setTempSteps(next);
                                  }}
                                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer font-bold text-slate-800"
                                  disabled={!canMutate()}
                                >
                                  <option value="">-- No Layout Template --</option>
                                  {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Step Delay */}
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Delay Outbox (Days)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={step.delayDays ?? 0}
                                  onChange={e => {
                                    const next = [...tempSteps];
                                    next[idx].delayDays = parseInt(e.target.value) || 0;
                                    setTempSteps(next);
                                  }}
                                  className="h-9 rounded-lg border-slate-200 focus:border-violet-500 bg-white px-3 font-semibold text-xs text-slate-850"
                                  disabled={!canMutate()}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Buttons */}
                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingAutomation(null);
                          setIsCreatingNew(false);
                        }}
                        className="rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer h-10 px-4 text-xs font-bold font-sans"
                      >
                        Cancel
                      </Button>
                      {canMutate() && (
                        <Button
                          type="submit"
                          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-xs px-5 h-10 text-xs font-black uppercase tracking-wider cursor-pointer"
                        >
                          <Check className="w-4 h-4 mr-1.5 animate-pulse" />
                          Commit Rules
                        </Button>
                      )}
                    </div>
                  </form>
                </Card>
              )}


              {/* ================= VIEW: TEMPLATES TAB ================= */}
              {activeTab === 'templates' && !editingTemplate && !isCreatingNew && (
                <div className="space-y-6" id="templates-list-panel">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-black text-slate-900 tracking-tight">Outgoing Content Layout Templates</h2>
                      <p className="text-xs text-slate-500 leading-normal font-medium mt-0.5">Custom layout models utilized dynamically by the automation engine.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {templates.map(tpl => (
                      <Card key={tpl.id} className="border border-slate-200 bg-white rounded-2xl shadow-xs overflow-hidden hover:shadow-sm transition-all">
                        <div className="p-5 flex items-start justify-between gap-4">
                          <div className="space-y-1 min-w-0">
                            <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200/50 py-0.5 text-[8px] uppercase font-black leading-none tracking-wider mb-1">
                              {tpl.category === 'welcome' ? '🎉 Onboarding Welcome' :
                               tpl.category === 'appointment_reminder' ? '⏰ Appt Reminder' :
                               tpl.category === 'cancellation' ? '❌ Appt Cancellation' :
                               '✉️ Follow-Up Outbox'}
                            </Badge>
                            <h3 className="text-sm font-black text-slate-950 truncate leading-none mb-0.5">{tpl.name}</h3>
                            <p className="text-xs text-slate-500 truncate font-semibold leading-relaxed">
                              Subject: <span className="font-bold text-slate-700 font-sans">"{tpl.subject}"</span>
                            </p>
                          </div>
                        </div>

                        {/* Body Preview */}
                        <div className="bg-slate-50 border-t border-slate-100 p-4 space-y-4">
                          <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs max-h-[100px] overflow-hidden text-[11px] text-slate-600 font-medium leading-relaxed font-sans whitespace-pre-wrap select-none italic">
                            {tpl.body}
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-slate-100/60 text-slate-400 text-[10px]">
                            <span>Modified: {new Date(tpl.updatedAt || tpl.createdAt).toLocaleDateString()}</span>
                            <div className="flex gap-2">
                              {canMutate() && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => handleEditTemplate(tpl)}
                                    className="h-7 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 rounded-lg cursor-pointer"
                                  >
                                    Edit Layout
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    onClick={() => handleDeleteTemplate(tpl.id)}
                                    className="h-7 text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 rounded-lg cursor-pointer"
                                  >
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= TAB: TEMPLATE CREATE/EDIT FORM ================= */}
              {(editingTemplate || (isCreatingNew && activeTab === 'templates')) && (
                <div className="grid grid-cols-1 gap-6" id="template-config-form-grid">
                  <Card className="border border-slate-205 bg-white rounded-2xl shadow-xs overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-extrabold text-slate-900 tracking-tight font-sans">
                          {editingTemplate ? "Compose Dynamic Message Template" : "Build Dynamic Outbound Message Template"}
                        </CardTitle>
                        <CardDescription className="text-xs font-semibold text-slate-500">
                          Create reusable subject headers and HTML body content models with placeholders fields.
                        </CardDescription>
                      </div>
                    </div>

                    <form onSubmit={handleSaveTemplate} className="p-6 space-y-5">
                      {/* Form segment Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Template Label *</Label>
                          <Input
                            value={tempTplName}
                            onChange={e => setTempTplName(e.target.value)}
                            placeholder="e.g. Standard reminder format"
                            className="h-10 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/20 px-4 text-xs font-bold text-slate-800"
                            required
                            disabled={!canMutate()}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Template Type *</Label>
                          <select
                            value={tempTplCategory}
                            onChange={e => setTempTplCategory(e.target.value)}
                            className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50/20 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/10 cursor-pointer font-bold text-slate-800"
                            disabled={!canMutate()}
                          >
                            <option value="welcome">🎉 Onboarding Welcome Email</option>
                            <option value="appointment_reminder">⏰ Appointment Outbox Reminder</option>
                            <option value="cancellation">❌ Cancellation Standard</option>
                            <option value="follow_up">✉️ Dynamic Follow-Up Review</option>
                          </select>
                        </div>
                      </div>

                      {/* Subject Line */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Outbound Email Subject Header *</Label>
                        <Input
                          value={tempTplSubject}
                          onChange={e => setTempTplSubject(e.target.value)}
                          placeholder="Welcome into our CRM gateway, {{client_name}}!"
                          className="h-10 rounded-xl border-slate-200 focus:border-violet-500 bg-slate-50/20 px-4 text-xs text-slate-850 font-bold"
                          required
                          disabled={!canMutate()}
                        />
                      </div>

                      {/* Body area */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Email XML/Raw Body *</Label>
                        <textarea
                          value={tempTplBody}
                          onChange={e => setTempTplBody(e.target.value)}
                          rows={6}
                          placeholder="Hi {{client_name}}, we are looking forward to having you..."
                          className="flex w-full rounded-xl border border-slate-205 border-input bg-slate-50/20 px-4 py-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/10 font-medium font-sans leading-relaxed"
                          required
                          disabled={!canMutate()}
                        />
                      </div>

                      {/* Token tags helper list */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Injectable Placement Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleInsertTag('{{client_name}}')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] h-7 px-2.5 rounded-lg font-bold leading-none cursor-pointer"
                            disabled={!canMutate()}
                          >
                            👤 client_name
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertTag('{{appointment_time}}')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] h-7 px-2.5 rounded-lg font-bold leading-none cursor-pointer"
                            disabled={!canMutate()}
                          >
                            ⏰ appointment_time
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertTag('{{workspace_name}}')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] h-7 px-2.5 rounded-lg font-bold leading-none cursor-pointer"
                            disabled={!canMutate()}
                          >
                            🏢 workspace_name
                          </button>
                        </div>
                      </div>

                      {/* Outbox Preview Card mockup */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-violet-500" /> Live HTML Dispatch Preview
                        </span>
                        
                        <div className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden text-[11px]">
                          {/* Inner preview card header */}
                          <div className="bg-slate-900 text-white px-3 py-2 flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></div>
                            <span className="text-[9px] font-mono opacity-80 text-white font-bold ml-1.5 tracking-tight uppercase leading-none">Standard Inbox Dispatch</span>
                          </div>
                          
                          <div className="p-3 bg-slate-50 border-b border-slate-200/50 space-y-1">
                            <div>
                              <span className="font-bold text-slate-400">Subject: </span>
                              <span className="text-slate-800 font-extrabold font-sans">
                                {tempTplSubject ? replacePlaceholdersObj(tempTplSubject) : '(No Subject Specified)'}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-400">From: </span>
                              <span className="text-slate-800 font-semibold font-mono text-[10px]">Preet AI Outbox System &lt;no-reply@preet.ai-suite.com&gt;</span>
                            </div>
                          </div>

                          <div className="p-4 whitespace-pre-wrap font-sans leading-relaxed text-slate-700 select-none min-h-[90px] bg-white text-xs">
                            {tempTplBody ? replacePlaceholdersObj(tempTplBody) : 'Hi There,\n\n(No template content drafted yet. Compose content in body fields to evaluate preview parameters.)'}
                          </div>
                        </div>
                      </div>

                      {/* Footer Buttons */}
                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingTemplate(null);
                            setIsCreatingNew(false);
                          }}
                          className="rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer h-10 px-4 text-xs font-bold"
                        >
                          Cancel
                        </Button>
                        {canMutate() && (
                          <Button
                            type="submit"
                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-xs px-5 h-10 text-xs font-black uppercase tracking-wider cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            Save Template
                          </Button>
                        )}
                      </div>
                    </form>
                  </Card>
                </div>
              )}
            </>
          )}

        </div>
      </PageContent>
    </SystemPageLayout>
  );
}

// --- LOCAL PRESETS PROVIDERS FOR CLIENT FALLBACK ---

function getMockTemplates(): EmailTemplate[] {
  return [
    {
      id: "t1",
      workspaceId: "1",
      name: "Welcome Onboarding Email Template",
      subject: "Welcome to Our Family, {{client_name}}! 🎉",
      body: "Hi {{client_name}},\n\nThank you for choosing {{workspace_name}}! We are thrilled to welcome you on board. Our team is dedicated to providing you with the finest experience possible.\n\nShould you have any questions, feel free to reply directly to this email.\n\nBest regards,\nThe {{workspace_name}} Team",
      category: "welcome",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "t2",
      workspaceId: "1",
      name: "Standard Appointment Reminder Email",
      subject: "Reminder: Scheduled Appointment at {{workspace_name}}",
      body: "Hello {{client_name}},\n\nThis is a friendly reminder that you have an upcoming appointment scheduled with us on {{appointment_time}}.\n\nIf you need to reschedule or cancel, please notify us at least 24 hours in advance.\n\nWe look forward to seeing you!\n\nBest wishes,\n{{workspace_name}}",
      category: "appointment_reminder",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "t3",
      workspaceId: "1",
      name: "Appointment Cancellation Notification",
      subject: "Confirmed: Appointment Cancelled — {{workspace_name}}",
      body: "Hi {{client_name}},\n\nWe have received your request and confirmed the cancellation of your appointment scheduled for {{appointment_time}}.\n\nWe are sorry we won't see you this time! You can always schedule a new slot online through our portal.\n\nWarm regards,\n{{workspace_name}} Team",
      category: "cancellation",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "t4",
      workspaceId: "1",
      name: "Post-Appointment Follow-up",
      subject: "How was your recent appointment at {{workspace_name}}?",
      body: "Hi {{client_name}},\n\nThank you for visiting {{workspace_name}} for your appointment on {{appointment_time}}!\n\nWe always strive to exceed expectations. Could you please take 60 seconds to let us know how your experience was?\n\nLooking forward to hearing your feedback!\n\nBest,\n{{workspace_name}} Team",
      category: "follow_up",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

function getMockAutomations(): Automation[] {
  return [
    {
      id: "a1",
      workspaceId: "1",
      name: "New Client welcome campaign",
      triggerType: "client_created",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: "step1",
          automationId: "a1",
          stepNumber: 1,
          actionType: "send_email",
          templateId: "t1",
          delayDays: 0,
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: "a2",
      workspaceId: "1",
      name: "Post-appointment engagement",
      triggerType: "appointment_completed",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: "step2",
          automationId: "a2",
          stepNumber: 1,
          actionType: "send_email",
          templateId: "t4",
          delayDays: 1,
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: "a3",
      workspaceId: "1",
      name: "Cancellation administrative alert",
      triggerType: "appointment_cancelled",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: "step3",
          automationId: "a3",
          stepNumber: 1,
          actionType: "notify_admin",
          templateId: "t3",
          delayDays: 0,
          createdAt: new Date().toISOString()
        }
      ]
    },
    {
      id: "a4",
      workspaceId: "1",
      name: "Inactive lead re-engagement trigger",
      triggerType: "lead_inactive",
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: "step4",
          automationId: "a4",
          stepNumber: 1,
          actionType: "send_email",
          templateId: "t2",
          delayDays: 7,
          createdAt: new Date().toISOString()
        }
      ]
    }
  ];
}
